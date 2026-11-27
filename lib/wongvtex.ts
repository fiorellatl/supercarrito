// WongVTEX: conector real a Wong usando su API pública de VTEX.
// GET /api/io/_v/api/intelligent-search/product_search/?query=<texto>
// Devuelve el MISMO ProductoWong que FakeWong. Nada de scraping.
//
// Por qué Intelligent Search y no `catalog_system/pub/products/search` (cambio
// del 2026-11-27, medido contra wong.pe): el buscador viejo solo cruza texto y
// contestaba «leche» con un chocolate, «azúcar» con un azucarero de Snoopy y
// «atún» con un mueble. Intelligent Search es el buscador que usa la propia
// web de la tienda, es igual de público y devuelve los productos con la MISMA
// forma (items, sellers, commertialOffer, measurementUnit, unitMultiplier).
// Con él: leche → Leche Entera Danlac, azúcar → Azúcar Rubia, atún → Atún Primor.
//
// Degradación: ante un fallo de transporte (timeout, 429, 403, 5xx, endpoint
// caído) LANZA un error; el dispatcher (lib/wong.ts) lo captura y usa FakeWong.
// Una respuesta válida pero vacía NO es un fallo: se devuelve "no encontrado".

import type { ProductoWong } from "@/lib/catalog";
import { CADENA_POR_DEFECTO, type Cadena } from "@/lib/cadenas";
const TIMEOUT_MS = 8000;

// Forma parcial de la respuesta VTEX (solo lo que usamos).
type VtexOffer = { Price?: number; IsAvailable?: boolean; AvailableQuantity?: number };
type VtexItem = {
  itemId?: string;
  name?: string;
  measurementUnit?: string;
  ean?: string;
  unitMultiplier?: number;
  images?: { imageUrl?: string }[];
  sellers?: { commertialOffer?: VtexOffer }[];
};
type VtexProduct = {
  productId?: string;
  productName?: string;
  brand?: string;
  linkText?: string;
  link?: string;
  categories?: string[];
  productReference?: string;
  items?: VtexItem[];
};

export async function buscarEnWongVtex(
  ingrediente: string,
  cadena: Cadena = CADENA_POR_DEFECTO
): Promise<ProductoWong> {
  // Ciclo 5: pedimos el Top-6, no el primero. Las alternativas son la materia
  // prima de la corrección y, por tanto, de todo el aprendizaje del perfil.
  // Pedimos 10: la reordenación por clase (lib/cart.ts) necesita margen para
  // pasar por delante el producto suelto cuando la tienda pone primero los packs.
  const url = `${cadena.base}/api/io/_v/api/intelligent-search/product_search/?query=${encodeURIComponent(
    ingrediente
  )}&count=10&page=1&locale=es-PE`;

  // fetch lanza en timeout/red; !ok lo convertimos en throw -> el dispatcher degrada.
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`VTEX HTTP ${res.status}`); // 403/429/5xx/endpoint caído
  }

  const data = ((await res.json()) as { products?: VtexProduct[] })?.products;
  if (!Array.isArray(data) || data.length === 0) {
    return { ingrediente, encontrado: false, motivo: "sin resultados", proveedor: cadena.id };
  }

  // Mapeamos todos y nos quedamos con los que tienen precio. El primero es el
  // elegido por defecto (orden de relevancia de Wong); el resto, alternativas.
  const candidatos = data.map((p) => mapear(ingrediente, p, cadena)).filter((c) => c.encontrado);
  if (candidatos.length === 0) {
    return { ingrediente, encontrado: false, motivo: "sin precio", proveedor: cadena.id };
  }

  const [mejor, ...resto] = candidatos;
  return { ...mejor, alternativas: resto };
}

function mapear(ingrediente: string, p: VtexProduct, cadena: Cadena): ProductoWong {
  const item = p.items?.[0];
  const oferta = item?.sellers?.[0]?.commertialOffer;
  const precio = oferta?.Price;

  if (typeof precio !== "number" || precio <= 0) {
    return { ingrediente, encontrado: false, motivo: "sin precio", proveedor: cadena.id };
  }

  // categoría: VTEX la da como "/Abarrotes/Arroz/Arroz Extra y Superior/".
  // Guardamos la hoja para leerla y la ruta entera para clasificar.
  const partes = (p.categories?.[0] ?? "").split("/").filter(Boolean);
  const categoria = partes.length ? partes[partes.length - 1] : undefined;
  const categoriaRuta = partes.length ? partes.join("/") : undefined;

  // Cómo se vende. Verificado contra la API y contra una boleta real:
  //   · `Price` es el precio POR `measurementUnit` — para "x kg", el del KILO.
  //   · `unitMultiplier` NO es la presentación: es la cantidad MÍNIMA de compra
  //     (queso de 100 en 100 g, trucha de 400 en 400 g).
  // Antes pintábamos unitMultiplier como presentación y Price como el precio de
  // esa presentación. Cada número era correcto y la pareja era mentira.
  const unidadVenta = item?.measurementUnit === "kg" ? "kg" : "un";
  const cantidadMinima =
    typeof item?.unitMultiplier === "number" && item.unitMultiplier > 0
      ? item.unitMultiplier
      : 1;

  // Presentación solo para envasados: el nombre del ítem cuando difiere del
  // producto ("Pack x6", "180 g"). Nunca se deriva del multiplicador.
  const presentacion =
    item?.name && item.name !== p.productName ? item.name : undefined;

  const disponible =
    oferta?.IsAvailable ?? ((oferta?.AvailableQuantity ?? 0) > 0);

  return {
    ingrediente,
    encontrado: true,
    sku: item?.itemId ?? p.productReference ?? p.productId,
    ean: item?.ean || undefined,
    nombre: p.productName,
    marca: p.brand,
    imagen: item?.images?.[0]?.imageUrl,
    precio,
    unidadVenta,
    cantidadMinima,
    presentacion,
    categoria,
    categoriaRuta,
    disponible,
    url: p.linkText ? `${cadena.base}/${p.linkText}/p` : p.link,
    proveedor: cadena.id,
  };
}
