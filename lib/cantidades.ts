// Cantidades: formato y opciones. Puro, sin React ni red.
//
// PRINCIPIO (decisión de la PO): **todo monto debe ser explicable por el propio
// producto.** El usuario nunca debería preguntarse de dónde salió un precio.
// De ahí se derivan dos reglas duras:
//   · si no sabemos la cantidad, el producto NO suma al total;
//   · nunca ajustamos una cantidad en silencio.
//
// Lo que este archivo NO hace, a propósito: conversiones entre unidades,
// paquetes, equivalencias ni cantidades "sugeridas". Ese es el modelado
// completo de cantidades, y no está abierto.

import type { UnidadVenta } from "@/lib/catalog";

// 0.25 -> "250 g" · 1 -> "1 kg" · 1.5 -> "1,5 kg" · 3 (un) -> "3"
export function formatearCantidad(cantidad: number, unidad: UnidadVenta): string {
  if (unidad !== "kg") return `${redondear(cantidad)}`;
  if (cantidad < 1) return `${Math.round(cantidad * 1000)} g`;
  return `${redondear(cantidad).toString().replace(".", ",")} kg`;
}

export function etiquetaUnitaria(unidad: UnidadVenta): string {
  return unidad === "kg" ? "/kg" : " c/u";
}

function redondear(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// Opciones para "¿cuánto compras normalmente?".
//
// Se generan como MÚLTIPLOS de la cantidad mínima del producto, nunca como una
// lista fija: el queso se vende de 100 en 100 g y la trucha de 400 en 400, así
// que ofrecer "100 g" de trucha sería ofrecer algo que Wong no vende. Así el
// usuario solo puede elegir cantidades reales y no hay nada que redondear
// después a sus espaldas.
export function opcionesDeCantidad(cantidadMinima?: number, unidad?: UnidadVenta): number[] {
  if (unidad !== "kg") return [1, 2, 3, 4];

  const min = cantidadMinima && cantidadMinima > 0 ? cantidadMinima : 0.1;
  const TOPE = 2; // más de 2 kg de algo fresco es un caso raro, no la norma
  const opciones = [1, 2, 5, 10]
    .map((m) => redondear(min * m))
    .filter((c) => c <= TOPE);

  // Un mínimo grande (p. ej. 1 kg) dejaría la lista casi vacía: al menos dos.
  if (opciones.length < 2) return [redondear(min), redondear(min * 2)];
  return [...new Set(opciones)];
}
