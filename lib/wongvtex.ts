// WongVTEX: conector real a Wong usando su API pública de VTEX.
// GET /api/catalog_system/pub/products/search?ft=<texto>
// Devuelve el MISMO ProductoWong que FakeWong. Nada de scraping.
//
// Degradación: ante un fallo de transporte (timeout, 429, 403, 5xx, endpoint
// caído) LANZA un error; el dispatcher (lib/wong.ts) lo captura y usa FakeWong.
// Una respuesta válida pero vacía NO es un fallo: se devuelve "no encontrado".

import type { ProductoWong } from "@/lib/catalog";

const BASE = "https://www.wong.pe";
const TIMEOUT_MS = 8000;

// Forma parcial de la respuesta VTEX (solo lo que usamos).
type VtexOffer = { Price?: number; IsAvailable?: boolean; AvailableQuantity?: number };
type VtexItem = {
  itemId?: string;
  name?: string;
  measurementUnit?: string;
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

export async function buscarEnWongVtex(ingrediente: string): Promise<ProductoWong> {
  const url = `${BASE}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(
    ingrediente
  )}&_from=0&_to=0`;

  // fetch lanza en timeout/red; !ok lo convertimos en throw -> el dispatcher degrada.
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`VTEX HTTP ${res.status}`); // 403/429/5xx/endpoint caído
  }

  const data = (await res.json()) as VtexProduct[];
  if (!Array.isArray(data) || data.length === 0) {
    return { ingrediente, encontrado: false, motivo: "sin resultados", proveedor: "wong" };
  }

  return mapear(ingrediente, data[0]);
}

function mapear(ingrediente: string, p: VtexProduct): ProductoWong {
  const item = p.items?.[0];
  const oferta = item?.sellers?.[0]?.commertialOffer;
  const precio = oferta?.Price;

  if (typeof precio !== "number" || precio <= 0) {
    return { ingrediente, encontrado: false, motivo: "sin precio", proveedor: "wong" };
  }

  // categoría: VTEX la da como "/Abarrotes/Arroz/" -> "Arroz"
  const categoria = (p.categories?.[0] ?? "")
    .split("/")
    .filter(Boolean)
    .pop();

  // presentación: VTEX no tiene un campo limpio. La derivamos de unitMultiplier +
  // measurementUnit (ej. "5 kg") o, si no, del nombre del ítem. Puede faltar.
  const presentacion =
    item?.unitMultiplier && item.unitMultiplier !== 1 && item.measurementUnit
      ? `${item.unitMultiplier} ${item.measurementUnit}`
      : item?.name && item.name !== p.productName
        ? item.name
        : undefined;

  const disponible =
    oferta?.IsAvailable ?? ((oferta?.AvailableQuantity ?? 0) > 0);

  return {
    ingrediente,
    encontrado: true,
    sku: item?.itemId ?? p.productReference ?? p.productId,
    nombre: p.productName,
    marca: p.brand,
    imagen: item?.images?.[0]?.imageUrl,
    precio,
    presentacion,
    categoria,
    disponible,
    url: p.linkText ? `${BASE}/${p.linkText}/p` : p.link,
    proveedor: "wong",
  };
}
