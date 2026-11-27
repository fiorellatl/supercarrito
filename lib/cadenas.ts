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

export type CadenaId = "wong" | "metro" | "plazavea";

export type Cadena = {
  id: CadenaId;
  nombre: string; // como lo dice una persona: "Wong", "Metro"
  base: string; // https://www.wong.pe
  // Canal de venta de su web. Wong lo publica en /api/segments -> {"channel":"70"}.
  canal: string;
  seller: string;
  // Qué entradas del directorio de puntos de retiro son SUS tiendas, y cómo se
  // llaman (primer grupo). Cada cuenta lo escribe a su manera:
  //   Wong:  "Retiro en tienda Wong Aldabas" (y la misma en MAYÚSCULAS, que no)
  //   Metro: "Metro Chorrillos", "Retiro en Metro Breña - Martinto"
  puntoDeRetiro: RegExp;
  // Lo que se antepone al nombre capturado, si la cadena no lo escribe igual:
  // Plaza Vea dice «plazaVea Miraflores», «Plazavea - Miraflores»…
  prefijo?: string;
  // Cómo entiende la simulación dónde está la tienda. Wong y Metro, con
  // coordenadas (el código postal les deja todo sin stock). Plaza Vea, al
  // revés: con coordenadas solas responde «no se puede entregar».
  zona: "coordenadas" | "codigoPostal";
  // Tarjetas propias que la familia puede marcar en esta cadena.
  tarjetas: string[];
  verificada: boolean;
};

export const CADENAS: Record<CadenaId, Cadena> = {
  wong: {
    id: "wong",
    nombre: "Wong",
    base: "https://www.wong.pe",
    canal: "70", // verificado el 2026-08-03 leyendo el carrito
    seller: "1",
    puntoDeRetiro: /^retiro en tienda\s+(wong\b.*)$/i,
    zona: "coordenadas",
    tarjetas: ["Tarjeta Cencosud", "Interbank", "Wong Prime"],
    verificada: true,
  },
  metro: {
    id: "metro",
    nombre: "Metro",
    base: "https://www.metro.pe",
    // Medido el 2026-11-27: /api/segments de metro.pe -> {"channel":"1"} y el
    // catálogo vende con sellerId "1" (CENCOSUD RETAIL PERU S.A.).
    canal: "1",
    seller: "1",
    puntoDeRetiro: /^(?:retiro en\s+)?(metro\b.*)$/i,
    zona: "coordenadas",
    tarjetas: ["Tarjeta Cencosud", "Interbank"],
    verificada: true,
  },
  plazavea: {
    id: "plazavea",
    nombre: "Plaza Vea",
    base: "https://www.plazavea.com.pe",
    // Medido el 2026-11-27: /api/segments -> {"channel":"1"}, seller "1", y el
    // enlace /checkout/cart/add?…&sc=1 llenó un carrito real (leído en
    // /api/checkout/pub/orderForm). Es de otro grupo (Intercorp): NO comparte
    // SKU con Wong/Metro; solo se compara por código de barras.
    canal: "1",
    seller: "1",
    puntoDeRetiro: /^plaza\s?vea\s*-?\s*(.+)$/i,
    prefijo: "Plaza Vea",
    zona: "codigoPostal",
    tarjetas: ["Tarjeta Sip", "Interbank"],
    verificada: true,
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
