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

export const color = {
  papel: "#F5F3ED", // fondo
  papel2: "#EFEDE5", // hojas que suben
  blanco: "#FFFFFF", // fondo de toda foto de producto
  tinta: "#223354", // TODO lo que escribe la familia
  tinta2: "#4A5A78", // lo pegado por la familia, un paso atrás
  lapiz: "#7F8A80", // TODO lo que dice SuperCarrito
  lapiz2: "#A3ADA5", // lo que dice y casi no importa
  renglon: "#E2DED2", // la línea del cuaderno y todo borde
  pino: "#2E5D4B", // dinero, confirmar, botón lleno. Nunca decoración.
  papaya: "#E0864B", // el cursor. Aparece poquísimo.
  ladrillo: "#A8503C", // agotado y error. Dos veces en toda la app.
} as const;

// Una sola familia, redondeada, del sistema. Sin serif (decisión de la PO) y sin
// webfonts: una tipografía que tarda en cargar hace saltar la primera línea.
export const fuente =
  "ui-rounded, 'SF Pro Rounded', 'Segoe UI Variable Display', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', sans-serif";

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

export const radio = { boton: 13, hoja: 26, foto: 12, fotoGrande: 14 } as const;

export function soles(n: number): string {
  return `S/ ${n.toFixed(2)}`;
}
