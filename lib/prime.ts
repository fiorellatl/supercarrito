// Wong Prime: envío gratis en supermercado por compras desde S/ 79.90, solo en
// Wong (wong.pe/prime, leído el 2026-11-28; Metro no lo menciona). Aprobado por
// la PO el 2026-11-28: si la familia dijo que lo tiene, se aplica y se DICE
// («gratis con tu Prime»), nunca en silencio. No lo podemos comprobar: lo
// confirma Wong al pagar.

export const PRIME = { tarjeta: "Wong Prime", cadena: "wong", desde: 79.9 } as const;

export type ConPrime = { aplica: boolean; faltan?: number; desde: number };

export function primeEnEnvio(
  cadena: string | undefined,
  tarjetas: string[] | undefined,
  productos: number | undefined
): ConPrime | undefined {
  if (cadena !== PRIME.cadena || !tarjetas?.includes(PRIME.tarjeta) || productos == null) return undefined;
  return productos >= PRIME.desde
    ? { aplica: true, desde: PRIME.desde }
    : { aplica: false, faltan: Math.round((PRIME.desde - productos) * 100) / 100, desde: PRIME.desde };
}
