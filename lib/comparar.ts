// Comparar la misma compra en otra cadena (bloque B, aprobado por la PO el
// 2026-11-27 «si hay diferencia»; medido: la hay).
//
// La regla que sostiene todo: **solo se compara el MISMO producto.** Nada de
// «parecidos»: huevos Wong contra huevos Metro no es comparar precios, es
// comparar productos, y la familia no podría saber de dónde sale la diferencia.
// Un producto es el mismo en las dos cadenas cuando:
//   1. tiene el mismo SKU (Wong y Metro comparten catálogo: el arroz Costeño de
//      5 kg es el 521 en las dos, con precio propio), o
//   2. tiene el mismo código de barras (EAN), o
//   3. se llama EXACTAMENTE igual en las dos («Leche Reconstituida Gloria Lata
//      390g»), o
//   4. tiene la misma marca, el mismo tamaño total y dice lo mismo
//      (lib/homologar.ts): las marcas cambian el EAN entre cadenas.
//      Las marcas propias («Huevos Pardos Wong») nunca coinciden.
// Medido el 2026-11-27: los EAN no son fiables solos —el arroz Costeño de 5 kg
// es el SKU 521 en las dos cadenas y cada una le pone un EAN distinto—, así que
// el mismo SKU vale si coincide el EAN o el nombre.
// Lo que no cumple ninguna de las dos se queda FUERA de la suma y se dice
// cuántos son. Los dos totales son siempre de la misma lista de productos.
//
// Los totales no los calculamos: se los preguntamos a cada tienda con la
// simulación de su carrito, igual que el total de siempre (lib/tienda.ts).

import type { ProductoWong } from "@/lib/catalog";
import type { Cadena } from "@/lib/cadenas";
import { buscarEnWongVtex, mapear, type VtexProduct } from "@/lib/wongvtex";
import { consultaPara, parentesco } from "@/lib/homologar";
import { catalogoDeTienda, type EnvioDeTienda, type Lugar, type Tienda } from "@/lib/tienda";

const TIMEOUT_MS = 9000;

export type LineaAComparar = {
  sku: string;
  ean?: string;
  unidades: number; // unidades de venta, las mismas que viajan en el enlace
  nombre: string;
  marca?: string;
  unidadVenta?: string;
  cantidadMinima?: number;
};

export type LadoComparado = {
  tienda: Tienda;
  total?: number; // lo que la tienda cobra por los productos comparados
  envio?: EnvioDeTienda;
};

export type Comparacion = {
  comparados: number;
  origen: LadoComparado;
  destino: LadoComparado;
  // Lo que no entra en la suma, con el porqué en palabras de la familia.
  fuera: { nombre: string; motivo: string }[];
  // SKU de origen -> el mismo producto en la otra cadena, para «Pedir en Metro».
  equivalentes: Record<string, ProductoWong>;
};

async function buscarPor(cadena: Cadena, campo: "skuId" | "alternateIds_Ean", valores: string[]) {
  const productos: VtexProduct[] = [];
  for (let i = 0; i < valores.length; i += 50) {
    const fq = valores
      .slice(i, i + 50)
      .map((v) => `fq=${campo}:${encodeURIComponent(v)}`)
      .join("&");
    const res = await fetch(
      `${cadena.base}/api/catalog_system/pub/products/search?${fq}&_from=0&_to=49`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS) }
    );
    if (!res.ok) throw new Error(`catálogo ${res.status}`);
    productos.push(...((await res.json()) as VtexProduct[]));
  }
  return productos;
}

// El mismo producto en la otra cadena, por SKU y si no, por código de barras.
async function equivalentesEn(cadena: Cadena, lineas: LineaAComparar[]) {
  const porSku = new Map<string, ProductoWong>();
  const conItem = (p: VtexProduct, encaja: (it: { itemId?: string; ean?: string }) => boolean) => {
    const item = p.items?.find(encaja);
    return item ? mapear("", { ...p, items: [item] }, cadena) : undefined;
  };

  for (const p of await buscarPor(cadena, "skuId", lineas.map((l) => l.sku))) {
    for (const l of lineas) {
      const m = conItem(p, (it) => it.itemId === l.sku);
      // Mismo SKU y, además, mismo código de barras o mismo nombre.
      if (m?.encontrado && ((!!l.ean && m.ean === l.ean) || mismoNombre(m.nombre, l.nombre)))
        porSku.set(l.sku, m);
    }
  }

  const porEan = lineas.filter((l) => !porSku.has(l.sku) && l.ean);
  if (porEan.length > 0) {
    for (const p of await buscarPor(cadena, "alternateIds_Ean", porEan.map((l) => l.ean!))) {
      for (const l of porEan) {
        const m = conItem(p, (it) => !!it.ean && it.ean === l.ean);
        if (m?.encontrado && !porSku.has(l.sku)) porSku.set(l.sku, m);
      }
    }
  }
  // Último intento, con el buscador de la otra cadena: el mismo nombre exacto
  // o, si no, la misma marca, tipo y tamaño (lib/homologar.ts). Las marcas
  // cambian el código de barras entre cadenas: el pan Bimbo de 770 g lo hace.
  const porNombre = lineas.filter((l) => !porSku.has(l.sku));
  await Promise.all(
    porNombre.map(async (l) => {
      try {
        const consultas = [l.nombre, ...(l.marca ? [consultaPara(l)] : [])];
        const candidatos: ProductoWong[] = [];
        for (const q of consultas) {
          const r = await buscarEnWongVtex(q, cadena);
          candidatos.push(...[r, ...(r.alternativas ?? [])].filter((c) => c.encontrado));
          const igual =
            candidatos.find((c) => mismoNombre(c.nombre, l.nombre)) ??
            candidatos.find((c) => parentesco(l, c) === "mismo");
          if (igual) {
            porSku.set(l.sku, { ...igual, alternativas: undefined });
            return;
          }
        }
      } catch {
        // Si la otra cadena no contesta para este, queda fuera y se dice.
      }
    })
  );
  return porSku;
}

const normal = (s?: string) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const mismoNombre = (a?: string, b?: string) => !!a && normal(a) === normal(b);

const distancia = (a: Lugar, b: Lugar) => Math.hypot(a.lon - b.lon, a.lat - b.lat);

export async function comparar(
  lineas: LineaAComparar[],
  origen: { tienda: Tienda; cadena: Cadena },
  destino: Cadena,
  lugarEnvio?: Lugar
): Promise<Comparacion> {
  const catOrigen = catalogoDeTienda(origen.cadena);
  const catDestino = catalogoDeTienda(destino);

  // La tienda de la otra cadena más cercana a la suya: es la que la familia
  // tendría a mano. Se dice cuál es; no se esconde la elección.
  const tiendasDestino = await catDestino.tiendas();
  if (tiendasDestino.length === 0) throw new Error("sin tiendas en la otra cadena");
  const tiendaDestino = [...tiendasDestino].sort(
    (a, b) => distancia(a, origen.tienda) - distancia(b, origen.tienda)
  )[0];

  const equivalentes = await equivalentesEn(destino, lineas);

  // Primera pasada: qué hay hoy en cada tienda.
  const mapeadas = lineas.filter((l) => equivalentes.has(l.sku));
  const [hoyOrigen, hoyDestino] = await Promise.all([
    catOrigen.precios(lineas.map((l) => ({ sku: l.sku, unidades: l.unidades })), origen.tienda),
    catDestino.precios(
      mapeadas.map((l) => ({ sku: equivalentes.get(l.sku)!.sku!, unidades: l.unidades })),
      tiendaDestino
    ),
  ]);
  const hayOrigen = new Set(hoyOrigen.lineas.filter((l) => l.disponible).map((l) => l.sku));
  const hayDestino = new Set(hoyDestino.lineas.filter((l) => l.disponible).map((l) => l.sku));

  const fuera: Comparacion["fuera"] = [];
  const comparables: LineaAComparar[] = [];
  for (const l of lineas) {
    const eq = equivalentes.get(l.sku);
    if (!eq) fuera.push({ nombre: l.nombre, motivo: `no lo encontré igual en ${destino.nombre}` });
    else if ((eq.cantidadMinima ?? 1) !== (l.cantidadMinima ?? 1))
      fuera.push({ nombre: l.nombre, motivo: `${destino.nombre} lo vende en otra medida` });
    else if (!hayOrigen.has(l.sku))
      fuera.push({ nombre: l.nombre, motivo: `hoy no hay en ${origen.tienda.nombre}` });
    else if (!hayDestino.has(eq.sku!))
      fuera.push({ nombre: l.nombre, motivo: `hoy no hay en ${tiendaDestino.nombre}` });
    else comparables.push(l);
  }

  // Segunda pasada: los dos totales, de exactamente la misma lista.
  const deOrigen = comparables.map((l) => ({ sku: l.sku, unidades: l.unidades }));
  const deDestino = comparables.map((l) => ({
    sku: equivalentes.get(l.sku)!.sku!,
    unidades: l.unidades,
  }));
  const [tOrigen, tDestino, eOrigen, eDestino] = await Promise.all([
    comparables.length ? catOrigen.precios(deOrigen, origen.tienda) : undefined,
    comparables.length ? catDestino.precios(deDestino, tiendaDestino) : undefined,
    lugarEnvio && comparables.length ? catOrigen.envio(deOrigen, lugarEnvio).catch(() => undefined) : undefined,
    lugarEnvio && comparables.length ? catDestino.envio(deDestino, lugarEnvio).catch(() => undefined) : undefined,
  ]);

  return {
    comparados: comparables.length,
    origen: { tienda: origen.tienda, total: tOrigen?.total, envio: eOrigen },
    destino: { tienda: tiendaDestino, total: tDestino?.total, envio: eDestino },
    fuera,
    equivalentes: Object.fromEntries(equivalentes),
  };
}
