// El precio con tarjeta, tal como lo publica la propia tienda.
//
// Medido el 2026-11-27 contra wong.pe y metro.pe (gracias a la captura de la PO
// del Rummikub: «Tarjeta Cencosud S/ 72.80 · Precio Online S/ 91.00»): VTEX
// publica cada promoción de un producto como un «teaser» en su oferta. Las de
// tarjeta llevan como condición los BIN de la tarjeta (`RestrictionsBins`) y en
// el nombre la marca de Cencosud: «[TCENCO] Nov26 - Juguetes - Con 20% Dscto
// Con TC Wong…». El efecto es un porcentaje (`PercentualDiscount: 20`) o un
// precio final por unidad (`MaximumUnitPriceDiscount: 99900` = S/ 999).
//
// Reglas, para no prometer lo que no es:
//   · Solo cuenta un teaser con BIN (sin BIN es un «2×» u otra cosa, no tarjeta).
//   · Solo si sabemos de qué tarjeta es por su nombre. Si no, no se dice.
//   · Solo si no pide nada más que pagar con esa tarjeta (ni cantidad mínima ni
//     condiciones que no conocemos).
//   · No se resta del total: la tienda lo descuenta al pagar. Se muestra aparte.

export type ConTarjeta = {
  tarjeta: string; // como la marca la familia: «Tarjeta Cencosud», «Interbank»
  precio: number; // soles por unidad de venta, pagando con ella
  porcentaje?: number; // 20 → «−20%», cuando la tienda lo da así
};

export type Teaser = {
  nombre: string;
  minimo: number;
  condiciones: Record<string, string>;
  efectos: Record<string, string>;
};

const CONDICIONES_DE_PAGO = new Set(["PaymentMethodId", "RestrictionsBins"]);

function tarjetaDe(nombre: string): string | undefined {
  if (/\[TCENCO\]|tarjeta cencosud|\bTC (?:wong|metro)\b/i.test(nombre)) return "Tarjeta Cencosud";
  if (/interbank|\bibk\b/i.test(nombre)) return "Interbank";
  return undefined;
}

const redondo = (n: number) => Math.round(n * 100) / 100;

// El mejor precio con cada tarjeta que conocemos para un producto de `precio`.
export function preciosConTarjeta(teasers: Teaser[], precio: number): ConTarjeta[] {
  const mejor = new Map<string, ConTarjeta>();
  for (const t of teasers) {
    if (!t.condiciones.RestrictionsBins || t.minimo > 0) continue;
    if (Object.keys(t.condiciones).some((c) => !CONDICIONES_DE_PAGO.has(c))) continue;
    const tarjeta = tarjetaDe(t.nombre);
    if (!tarjeta) continue;

    let oferta: ConTarjeta | undefined;
    const pct = Number(t.efectos.PercentualDiscount);
    const tope = Number(t.efectos.MaximumUnitPriceDiscount);
    if (Object.keys(t.efectos).length !== 1) continue;
    if (pct > 0 && pct < 100) oferta = { tarjeta, precio: redondo(precio * (1 - pct / 100)), porcentaje: pct };
    else if (tope > 0 && tope / 100 < precio) oferta = { tarjeta, precio: redondo(tope / 100) };
    if (!oferta) continue;
    const ya = mejor.get(tarjeta);
    if (!ya || oferta.precio < ya.precio) mejor.set(tarjeta, oferta);
  }
  return [...mejor.values()];
}

// VTEX da los teasers con dos formas según la API.
type ParIS = { name?: string; value?: string };
type TeaserIS = {
  name?: string;
  conditions?: { minimumQuantity?: number; parameters?: ParIS[] };
  effects?: { parameters?: ParIS[] };
};
type ParCat = { Name?: string; Value?: string };
type TeaserCat = {
  Name?: string;
  Conditions?: { MinimumQuantity?: number; Parameters?: ParCat[] };
  Effects?: { Parameters?: ParCat[] };
};

const aMapa = (ps: { k?: string; v?: string }[] = []) =>
  Object.fromEntries(ps.filter((p) => p.k).map((p) => [p.k!, p.v ?? ""]));

// Intelligent Search: `commertialOffer.teasers`, en minúsculas.
export function teasersDeIS(ts: TeaserIS[] = []): Teaser[] {
  return ts.map((t) => ({
    nombre: t.name ?? "",
    minimo: t.conditions?.minimumQuantity ?? 0,
    condiciones: aMapa(t.conditions?.parameters?.map((p) => ({ k: p.name, v: p.value }))),
    efectos: aMapa(t.effects?.parameters?.map((p) => ({ k: p.name, v: p.value }))),
  }));
}

// catalog_system: `commertialOffer.PromotionTeasers`, en mayúsculas.
export function teasersDeCatalogo(ts: TeaserCat[] = []): Teaser[] {
  return ts.map((t) => ({
    nombre: t.Name ?? "",
    minimo: t.Conditions?.MinimumQuantity ?? 0,
    condiciones: aMapa(t.Conditions?.Parameters?.map((p) => ({ k: p.Name, v: p.Value }))),
    efectos: aMapa(t.Effects?.Parameters?.map((p) => ({ k: p.Name, v: p.Value }))),
  }));
}
