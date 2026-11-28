// Homologar: saber si un producto de una cadena es el MISMO que el de otra
// cuando el código de barras no lo dice.
//
// Medido el 2026-11-28 con una canasta típica de 30 productos de Wong: las
// marcas cambian el EAN entre cadenas (el pan de molde Bimbo de 770 g es
// 7750727015056 en Wong y 7750727014165 en Plaza Vea) y cada cadena nombra a
// su manera («Pan de Molde Blanco Bimbo Extra Grande 770g» vs «Pan de Molde
// Blanco XL BIMBO Extra Grande Bolsa 770g»). Solo con EAN o nombre exacto,
// Plaza Vea encontraba el 47% de la canasta; con marca + tipo + tamaño, el 80%.
//
// Es el MISMO cuando coinciden las tres cosas:
//   · la marca, tal como la declara la tienda (campo `brand`),
//   · el tamaño total (contenido × unidades del paquete), y
//   · las palabras que dicen QUÉ es («molde», «blanco», «integral»…): las del
//     nuestro están casi todas en el otro y al revés. Una sola palabra de más
//     ya puede ser otro producto («Arroz Extra» vs «Arroz Añejo Extra»): ante
//     la duda, PARECIDO.
// Si la marca coincide y es el mismo tipo pero cambia el tamaño, es PARECIDO:
// nunca se confunde con el mismo.

const VACIAS = new Set(
  (
    "de del la el los las con y en x para al a por " +
    "bolsa botella lata caja frasco sachet doypack paquete paq tetrapack tarro " +
    "sobre unidad unidades un und unid pote envase bandeja vaso tubo bidon galonera " +
    "pack twopack tripack sixpack"
  ).split(" ")
);

const normal = (s?: string) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Las palabras de la marca no dicen qué es el producto: se quitan.
function palabras(nombre: string, marca?: string) {
  const deMarca = new Set(normal(marca).split(" "));
  return new Set(
    normal(nombre)
      .replace(/\b\d+(\.\d+)?\s*[a-z]*\b/g, " ")
      .split(" ")
      // La marca, aunque la cadena la escriba con una letra de más («ALACENAA»).
      .filter(
        (t) =>
          t.length > 1 &&
          !VACIAS.has(t) &&
          !deMarca.has(t) &&
          ![...deMarca].some((m) => m.length >= 4 && t.startsWith(m) && t.length - m.length <= 1)
      )
  );
}

type Tamano = { valor: number; unidad: "g" | "ml" | "un" };

// El tamaño TOTAL: «Twopack Aceite 900ml» son 1800 ml; «Atún 140g Paquete
// 6un» son 840 g. Sin tamaño legible devuelve null (no se adivina).
export function tamanoTotal(nombre: string): Tamano | null {
  const n = normal(nombre);
  let contenido: Tamano | null = null;
  let unidades: number | null = null;
  for (const m of n.matchAll(/(\d+(?:\.\d+)?)\s*(kg|kilos?|g|gr|grs|gramos|ml|l|lt|lts|litros?|un|und|unid|unidades)\b/g)) {
    const v = Number(m[1]);
    const u = m[2];
    if (/^(kg|kilo)/.test(u)) contenido = { valor: v * 1000, unidad: "g" };
    else if (/^g/.test(u)) contenido = { valor: v, unidad: "g" };
    else if (u === "ml") contenido = { valor: v, unidad: "ml" };
    else if (/^l/.test(u)) contenido = { valor: v * 1000, unidad: "ml" };
    else unidades = v;
  }
  const prefijo = n.match(/\b(two|tri|six)pack\b/);
  const porPack = n.match(/\b(?:pack|paquete|x)\s*(\d+)\b(?!\s*(?:g|gr|kg|ml|l|lt)\b)/);
  const multiplicador =
    prefijo ? { two: 2, tri: 3, six: 6 }[prefijo[1] as "two" | "tri" | "six"] : porPack ? Number(porPack[1]) : 1;
  if (contenido) {
    // «8un» junto a un contenido es el número de piezas del paquete.
    const veces = Math.max(multiplicador, unidades && unidades > 1 && /paquete|pack|x\s*\d/.test(n) ? unidades : 1);
    return { valor: Math.round(contenido.valor * veces), unidad: contenido.unidad };
  }
  if (unidades) return { valor: unidades * multiplicador, unidad: "un" };
  return null;
}

const cubre = (a: Set<string>, b: Set<string>) => {
  if (a.size === 0) return 1;
  let i = 0;
  for (const x of a) if (b.has(x)) i++;
  return i / a.size;
};

export type Producto = { nombre?: string; marca?: string; unidadVenta?: string };
export type Parentesco = "mismo" | "parecido" | null;

export function parentesco(nuestro: Producto, otro: Producto): Parentesco {
  if (!nuestro.nombre || !otro.nombre || !nuestro.marca || !otro.marca) return null;
  if (normal(nuestro.marca).replace(/\s/g, "") !== normal(otro.marca).replace(/\s/g, "")) return null;
  const a = palabras(nuestro.nombre, nuestro.marca);
  const b = palabras(otro.nombre, otro.marca);
  const ta = tamanoTotal(nuestro.nombre);
  const tb = tamanoTotal(otro.nombre);
  const mismoTamano =
    ta && tb
      ? ta.unidad === tb.unidad && Math.abs(ta.valor - tb.valor) <= Math.max(2, ta.valor * 0.02)
      : !ta && !tb && nuestro.unidadVenta === "kg" && otro.unidadVenta === "kg";
  if (mismoTamano && cubre(a, b) >= 0.75 && cubre(b, a) >= 0.75) return "mismo";
  // Parecido: casi todo lo nuestro está en el otro, y el otro no es otra cosa
  // con más ingredientes («Pack Mixto Queso Edam + Jamón» no es queso edam).
  // Y de un tamaño que se pueda comparar: un pack de dos contra una botella
  // no dice cuál es más barato (±35%: el pan de 480 g contra el de 590 g sí).
  const tamanoCercano =
    mismoTamano ||
    (ta && tb && ta.unidad === tb.unidad && Math.abs(ta.valor - tb.valor) <= ta.valor * 0.35);
  if (tamanoCercano && cubre(a, b) >= 0.75 && cubre(b, a) >= 0.5) return "parecido";
  return null;
}

// La consulta para buscarlo en otra cadena: marca + lo que dice qué es. Sin el
// tamaño: si allá solo hay otro, que salga como parecido.
export function consultaPara(p: Producto): string {
  return [p.marca, ...palabras(p.nombre ?? "", p.marca)].filter(Boolean).join(" ");
}
