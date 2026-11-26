// El sistema visual, en un solo sitio.
//
// Es la traducción literal de `design/app.html` y de §🎨 Sistema visual de
// PROJECT_STATE.md. Ningún componente inventa un color, un tamaño ni un tiempo:
// los pide aquí. Si algo no está en este archivo, no debería estar en pantalla.
//
// 📌 LA REGLA QUE GOBIERNA TODO:
//    La familia escribe en TINTA. SuperCarrito habla en LÁPIZ.
//    Misma tipografía para ambos; la diferencia la hacen color y peso, de forma
//    que el producto nunca puede fingir ser ella.

import type { CSSProperties } from "react";

// Estilo «puesto de mercado» (elegido por la PO, 2026-11-26): toldo rojo
// tomate, verde de hoja para el dinero y la acción, amarillo ají para lo que
// falta decidir. Los nombres de siempre se mantienen para no tocar cada
// componente; cambian los valores.
export const color = {
  papel: "#FFFFFF", // fondo
  papel2: "#F3F7EF", // filas y hojas que suben: verde muy pálido
  blanco: "#FFFFFF", // fondo de toda foto de producto
  tinta: "#15301F", // TODO lo que escribe la familia: verde casi negro
  tinta2: "#3C5446", // lo pegado por la familia, un paso atrás
  lapiz: "#4D6656", // TODO lo que dice SuperCarrito
  lapiz2: "#8A9C90", // lo que dice y casi no importa
  renglon: "#E1E9DC", // todo borde
  pino: "#2F9E44", // dinero, confirmar, botón lleno. Nunca decoración.
  papaya: "#E8412C", // tomate: el toldo, el foco y el cursor
  ladrillo: "#B8321F", // agotado y error
  aji: "#FFD23F", // lo que espera una decisión de la familia
  noche: "#15301F", // la hoja oscura y el cartelito de «Elige»
} as const;

// Una sola familia, sin serif (decisión de la PO): Bricolage Grotesque, la del
// letrero pintado del puesto. Se carga con `display=swap` y cae a la redondeada
// del sistema si no llega.
export const fuente =
  "'Bricolage Grotesque', ui-rounded, 'SF Pro Rounded', 'Segoe UI', system-ui, -apple-system, sans-serif";

// El renglón. Todo lo que vive en la libreta cae en él o en un múltiplo.
export const RENGLON = 38;

// Los tiempos son de Design y no se negocian: son la diferencia entre un
// producto que acompaña y uno que reacciona.
export const tiempo = {
  linea: 220, // entra una línea escrita: sube 3 px. No rebota.
  clip: 260, // cae una captura, torcida, y se endereza
  eco: 180, // aparece una propuesta: SOLO opacidad, nada se mueve
  hoja: 320, // sube el carrito: salida rápida, llegada lenta
  trazo: 520, // se dibuja el visto de "listo"
  respirar: 2600, // una exhalación mientras se buscan precios. No gira.
} as const;

export const curva = "cubic-bezier(.22,.61,.36,1)";

// --- Piezas de texto ---------------------------------------------------------
// Dos voces y ni una más.

// La familia. 17 px, peso 500, tinta.
export const tinta: CSSProperties = {
  fontSize: 17,
  fontWeight: 500,
  color: color.tinta,
  letterSpacing: "-0.015em",
  lineHeight: 1.3,
};

// SuperCarrito. 12,5 px, peso 400, lápiz.
export const lapiz: CSSProperties = {
  fontSize: 12.5,
  fontWeight: 400,
  color: color.lapiz,
  lineHeight: 1.5,
};

// El dinero siempre en cifras tabulares: una columna de precios que baila es
// una columna que no se puede comparar de un vistazo.
export const plata: CSSProperties = {
  fontVariantNumeric: "tabular-nums",
  fontWeight: 600,
  color: color.tinta,
};

// El rótulo de una sección. Nunca compite con lo escrito.
export const rotulo: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  color: color.lapiz2,
};

// --- Superficies -------------------------------------------------------------

// Una sola sombra con peso en todo el producto: la de la hoja al levantarse.
// Nada más flota. Las tarjetas elevadas convierten una libreta en un panel.
export const sombraHoja = "0 -24px 50px -28px rgba(0,0,0,.55)";

export const radio = { boton: 999, hoja: 26, foto: 12, fotoGrande: 14, fila: 16 } as const;

export function soles(n: number): string {
  return `S/ ${n.toFixed(2)}`;
}
