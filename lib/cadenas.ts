// Las cadenas de supermercado que el producto sabe atender. Es configuración,
// no código: Wong y Metro son la misma plataforma (VTEX, grupo Cencosud), así
// que cambiar de cadena es cambiar de dirección y de canal de venta, nada más.
// El buscador (lib/wongvtex.ts), el directorio y los precios por tienda
// (lib/tienda.ts) y la entrega (lib/entrega.ts) reciben una `Cadena` y no
// nombran a ninguna.
//
// Una cadena entra en el producto solo cuando está **verificada**: se buscó,
// se valoró una compra en una tienda real y el enlace llenó un carrito real
// (la única prueba de una entrega es leer el carrito, ver lib/entrega.ts).
// Hasta entonces existe aquí, pero ni se ofrece ni se consulta: un carrito que
// no se puede comprar es peor que no tener carrito.

export type CadenaId = "wong" | "metro";

export type Cadena = {
  id: CadenaId;
  nombre: string; // como lo dice una persona: "Wong", "Metro"
  base: string; // https://www.wong.pe
  // Canal de venta de su web. Wong lo publica en /api/segments -> {"channel":"70"}.
  canal: string;
  seller: string;
  // Cómo empiezan sus tiendas en el directorio de puntos de retiro:
  // "Retiro en tienda Wong Óvalo Gutiérrez".
  prefijoTienda: RegExp;
  verificada: boolean;
};

export const CADENAS: Record<CadenaId, Cadena> = {
  wong: {
    id: "wong",
    nombre: "Wong",
    base: "https://www.wong.pe",
    canal: "70", // verificado el 2026-08-03 leyendo el carrito
    seller: "1",
    prefijoTienda: /^wong/i,
    verificada: true,
  },
  metro: {
    id: "metro",
    nombre: "Metro",
    base: "https://www.metro.pe",
    // SIN VERIFICAR: metro.pe no se pudo consultar desde el entorno de
    // desarrollo (2026-11-27). Canal y seller se leen de su /api/segments y de
    // su catálogo antes de poner `verificada: true`.
    canal: "1",
    seller: "1",
    prefijoTienda: /^metro/i,
    verificada: false,
  },
};

export const CADENA_POR_DEFECTO: Cadena = CADENAS.wong;

// Una cadena desconocida, o todavía sin verificar, es la de siempre. Así una
// tienda guardada antes de que existieran las cadenas sigue siendo de Wong.
export function cadenaDe(id: unknown): Cadena {
  const c = typeof id === "string" ? CADENAS[id as CadenaId] : undefined;
  return c?.verificada ? c : CADENA_POR_DEFECTO;
}

export function cadenasDisponibles(): Cadena[] {
  return Object.values(CADENAS).filter((c) => c.verificada);
}
