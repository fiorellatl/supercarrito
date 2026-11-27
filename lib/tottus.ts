// Tottus, solo para COMPARAR (decisión de la PO, 2026-11-27).
//
// Medido el 2026-11-27: Tottus es de Falabella, no de VTEX. Su buscador es
// público y en JSON y trae los tres precios por separado (online, regular y
// CMR). Lo que NO tiene es un enlace que llene un carrito: el suyo vive en su
// servidor, atado a la sesión de quien navega en tottus.com.pe. Por eso Tottus
// no se elige como tienda ni recibe el pedido: se compara y, si conviene, la
// familia agrega los productos allá, uno por uno, con los enlaces que damos.
//
// Las reglas de la comparación son las de lib/comparar.ts: solo el MISMO
// producto, por código de barras. El buscador no lo trae; la página de cada
// producto sí (`okayToShopBarcodes`), así que se mira la de los primeros
// candidatos. Los precios son los de su zona de reparto de Lima, no de una
// tienda: se dice así.

import type { LineaAComparar } from "@/lib/comparar";
import type { Cadena } from "@/lib/cadenas";
import { catalogoDeTienda, type Tienda } from "@/lib/tienda";

const BASE = "https://www.tottus.com.pe";
const TIMEOUT_MS = 9000;
const CANDIDATOS = 3;

type PrecioTottus = { type?: string; price?: string[] };
type ResultadoTottus = {
  productId?: string;
  displayName?: string;
  url?: string;
  isSponsored?: boolean;
  measurements?: { unit?: string };
  prices?: PrecioTottus[];
};

export type LineaTottus = {
  sku: string; // el de la cadena de origen
  nombre: string; // como se llama en Tottus
  url: string;
  unidades: number;
  precio: number; // online, por unidad
  cmr?: number; // con CMR, por unidad, si lo publica
};

export type ComparacionTottus = {
  comparados: number;
  origen: { tienda: Tienda; total?: number };
  total: number; // suma de precio online × unidades
  totalCmr?: number; // lo mismo con CMR donde lo hay
  lineas: LineaTottus[];
  fuera: { nombre: string; motivo: string }[];
};

const numero = (p?: PrecioTottus) => {
  const n = Number((p?.price?.[0] ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

async function buscar(texto: string): Promise<ResultadoTottus[]> {
  const res = await fetch(`${BASE}/s/browse/v1/search/pe?Ntt=${encodeURIComponent(texto)}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`tottus ${res.status}`);
  const d = (await res.json()) as { data?: { results?: ResultadoTottus[] } };
  return (d.data?.results ?? []).filter((r) => !r.isSponsored && r.productId);
}

// El código de barras de un producto, de su página. Se guarda: no cambia.
const eans = new Map<string, string[]>();
async function codigosDe(productId: string): Promise<string[]> {
  const ya = eans.get(productId);
  if (ya) return ya;
  const res = await fetch(`${BASE}/tottus-pe/articulo/${encodeURIComponent(productId)}/p`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const html = await res.text();
  const lista = html.match(/"okayToShopBarcodes":\[([^\]]*)\]/)?.[1] ?? "";
  const codigos = [...lista.matchAll(/"(\d{8,14})"/g)].map((m) => m[1]);
  eans.set(productId, codigos);
  return codigos;
}

async function igualEnTottus(l: LineaAComparar): Promise<ResultadoTottus | undefined> {
  if (!l.ean) return undefined;
  const candidatos = (await buscar(l.nombre)).slice(0, CANDIDATOS);
  for (const c of candidatos) {
    if ((await codigosDe(c.productId!)).includes(l.ean)) return c;
  }
  return undefined;
}

export async function compararConTottus(
  lineas: LineaAComparar[],
  origen: { tienda: Tienda; cadena: Cadena }
): Promise<ComparacionTottus> {
  const fuera: ComparacionTottus["fuera"] = [];
  const encontradas: { l: LineaAComparar; t: ResultadoTottus }[] = [];

  await Promise.all(
    lineas.map(async (l) => {
      // Al peso no se compara: Tottus y la otra tienda cuentan distinto.
      if ((l.cantidadMinima ?? 1) !== 1) {
        fuera.push({ nombre: l.nombre, motivo: "se vende al peso" });
        return;
      }
      try {
        const t = await igualEnTottus(l);
        if (!t) fuera.push({ nombre: l.nombre, motivo: "no lo encontré igual en Tottus" });
        else if (t.measurements?.unit && t.measurements.unit !== "UN")
          fuera.push({ nombre: l.nombre, motivo: "Tottus lo vende en otra medida" });
        else if (!numero(t.prices?.find((p) => p.type === "internetPrice")))
          fuera.push({ nombre: l.nombre, motivo: "Tottus no da su precio" });
        else encontradas.push({ l, t });
      } catch {
        fuera.push({ nombre: l.nombre, motivo: "Tottus no contestó" });
      }
    })
  );

  // El lado de origen, preguntado a SU tienda, con la misma lista.
  const deOrigen = encontradas.map(({ l }) => ({ sku: l.sku, unidades: l.unidades }));
  const precios = deOrigen.length
    ? await catalogoDeTienda(origen.cadena).precios(deOrigen, origen.tienda)
    : undefined;
  const hay = new Set(precios?.lineas.filter((x) => x.disponible).map((x) => x.sku));
  const comparables = encontradas.filter(({ l }) => {
    if (hay.has(l.sku)) return true;
    fuera.push({ nombre: l.nombre, motivo: `hoy no hay en ${origen.tienda.nombre}` });
    return false;
  });
  // Si alguno se cayó, el total de origen se vuelve a pedir con la lista final.
  const totalOrigen =
    comparables.length === encontradas.length
      ? precios?.total
      : comparables.length
        ? (
            await catalogoDeTienda(origen.cadena).precios(
              comparables.map(({ l }) => ({ sku: l.sku, unidades: l.unidades })),
              origen.tienda
            )
          ).total
        : undefined;

  const lineasT: LineaTottus[] = comparables.map(({ l, t }) => ({
    sku: l.sku,
    nombre: t.displayName ?? l.nombre,
    url: t.url ?? `${BASE}/tottus-pe/articulo/${t.productId}/p`,
    unidades: l.unidades,
    precio: numero(t.prices?.find((p) => p.type === "internetPrice"))!,
    cmr: numero(t.prices?.find((p) => p.type === "cmrPrice")),
  }));
  const r = (n: number) => Math.round(n * 100) / 100;
  const total = r(lineasT.reduce((s, x) => s + x.precio * x.unidades, 0));
  const totalCmr = lineasT.some((x) => x.cmr)
    ? r(lineasT.reduce((s, x) => s + (x.cmr ?? x.precio) * x.unidades, 0))
    : undefined;

  return { comparados: lineasT.length, origen: { tienda: origen.tienda, total: totalOrigen }, total, totalCmr, lineas: lineasT, fuera };
}
