import { promises as fs } from "fs";
import path from "path";
import { buscarEnWong, type ProductoWong } from "@/lib/wong";

type Menus = Record<string, { nombre: string; platos: string[] }>;
type Recipes = Record<string, string[]>;

const DATA = path.join(process.cwd(), "data");

// Leemos del disco en cada request para que las ediciones en /editar se vean
// de inmediato en el chat (los import estáticos de JSON se cachean).
async function cargarDatos(): Promise<{ menus: Menus; recipes: Recipes }> {
  const [menus, recipes] = await Promise.all([
    fs.readFile(path.join(DATA, "menus.json"), "utf8"),
    fs.readFile(path.join(DATA, "recipes.json"), "utf8"),
  ]);
  return { menus: JSON.parse(menus), recipes: JSON.parse(recipes) };
}

// "Compra el menú 2" -> "2". Toma el primer número que aparezca en el mensaje.
export function extraerNumeroMenu(mensaje: string): string | null {
  const match = mensaje.match(/\d+/);
  return match ? match[0] : null;
}

export type ResultadoMenu = {
  menu: string;
  platos: string[];
  ingredientes: string[];
};

async function armarListaDeMenu(mensaje: string): Promise<ResultadoMenu | null> {
  const numero = extraerNumeroMenu(mensaje);
  if (!numero) return null;

  const { menus, recipes } = await cargarDatos();
  const menu = menus[numero];
  if (!menu) return null;

  // Consolidar ingredientes de todos los platos, sin duplicados.
  const set = new Set<string>();
  for (const plato of menu.platos) {
    for (const ing of recipes[plato] ?? []) {
      set.add(ing);
    }
  }

  return {
    menu: menu.nombre,
    platos: menu.platos,
    ingredientes: [...set],
  };
}

// --- Normalizador de intención ---------------------------------------------
// El corazón del producto: no importa CÓMO llegue la intención de compra, la
// convertimos en una lista canónica de ingredientes. Hoy soportamos 3 formas;
// foto/voz vendrán después por esta misma puerta.
//
//   "menú 2"                -> menú (número) -> platos -> ingredientes
//   "ají de gallina"        -> receta (por nombre) -> ingredientes
//   "pollo, pan, aceite"    -> lista libre -> ingredientes tal cual
//
// Devuelve además un `titulo` legible para la cabecera del carrito.
export type Intencion = ResultadoMenu & { titulo: string };

// Palabras de relleno que la gente escribe pero no son ingredientes.
const RELLENO = new Set([
  "y", "e", "de", "un", "una", "unos", "unas", "el", "la", "los", "las",
  "necesito", "quiero", "comprar", "compra", "porfa", "porfavor", "para",
]);

function normalizarListaLibre(mensaje: string): string[] {
  const items = mensaje
    .split(/[,\n;]+|\by\b/gi) // comas, saltos, ";" o " y "
    .map((s) => s.trim().toLowerCase())
    .map((s) => s.replace(/^(un|una|unos|unas|el|la|los|las)\s+/i, "")) // "un pollo" -> "pollo"
    .filter((s) => s.length > 1 && /[a-záéíóúñ]/i.test(s) && !RELLENO.has(s));
  return [...new Set(items)]; // sin duplicados, preserva orden
}

export async function normalizarIntencion(mensaje: string): Promise<Intencion | null> {
  const texto = (mensaje ?? "").trim();
  if (!texto) return null;

  // 1) Menú por número.
  const menu = await armarListaDeMenu(texto);
  if (menu) return { ...menu, titulo: menu.menu };

  // 2) Receta por nombre (coincidencia flexible con data/recipes.json).
  const { recipes } = await cargarDatos();
  const clave = Object.keys(recipes).find(
    (n) => n.toLowerCase() === texto.toLowerCase()
  );
  if (clave) {
    return {
      menu: clave,
      titulo: clave,
      platos: [clave],
      ingredientes: [...new Set(recipes[clave] ?? [])],
    };
  }

  // 3) Lista libre.
  const ingredientes = normalizarListaLibre(texto);
  if (ingredientes.length === 0) return null;
  return { menu: "Tu lista", titulo: "Tu lista", platos: [], ingredientes };
}

export async function menusDisponibles(): Promise<string[]> {
  const { menus } = await cargarDatos();
  return Object.keys(menus);
}

// Resumen para la pantalla inicial: número + nombre + platos de cada menú.
// Se lee de data/ (no hardcodeado): editar en /editar se refleja aquí.
export type MenuResumen = { numero: string; nombre: string; platos: string[] };

export async function menusResumen(): Promise<MenuResumen[]> {
  const { menus } = await cargarDatos();
  return Object.entries(menus).map(([numero, m]) => ({
    numero,
    nombre: m.nombre,
    platos: m.platos,
  }));
}

// --- Wong: buscar cada ingrediente, con alternativa genérica (idea de Iris) ---

export type ItemCarrito = ProductoWong & {
  terminoUsado: string;
  alternativa: boolean; // se encontró usando un término más genérico

  // Cuánto vamos a comprar, en la `unidadVenta` del producto.
  // `undefined` = todavía no lo sabemos, y eso es un estado legítimo: un
  // producto sin cantidad NO suma al total. Preferimos un carrito incompleto
  // a un monto inventado.
  cantidad?: number;

  // La cantidad tal y como venía en la evidencia, antes de contrastarla con el
  // producto. Se conserva porque el usuario puede cambiar de producto y el
  // sustituto venderse en otra unidad: "1 un" no significa nada si el nuevo
  // producto va al peso.
  cantidadPedida?: number;
  unidadPedida?: "kg" | "un";
};

// Una intención de compra: qué producto y, si se sabe, cuánto.
export type Pedido = { producto: string; cantidad?: number; unidad?: "kg" | "un" };

// La cantidad que traía la evidencia solo sirve si habla la misma unidad que el
// producto. La captura dice "Queso Edam · 1 un" pero Wong lo vende al peso: esa
// cantidad no significa nada aquí, así que queda pendiente en vez de mentir.
// Un producto por pieza sin cantidad explícita es 1: no hay nada que preguntar.
function cantidadAplicable(p: ProductoWong, pedido: Pedido): number | undefined {
  const unidad = p.unidadVenta ?? "un";
  if (pedido.cantidad && pedido.unidad === unidad) return pedido.cantidad;
  return unidad === "un" ? (pedido.cantidad && !pedido.unidad ? pedido.cantidad : 1) : undefined;
}

// El sufijo de venta ("x kg", "x un") ENVENENA la búsqueda de Wong cuando el
// nombre del producto es corto. Medido, no supuesto:
//
//   "Maracuyá x kg"  -> Gallina Sin Menudencia Sadia x kg
//   "Pepinillo x un" -> Ostras Vivas x un
//   "Pepinillo"      -> Pepinillo x un  ✅
//
// Con nombres largos ("Zapallito Italiano x un") es inofensivo, así que quitarlo
// siempre es seguro. Este arreglo determinista valía 8 puntos de precisión en el
// experimento del extractor — más que cambiar de modelo, y gratis.
// ...pero quitarlo SIEMPRE tampoco vale. Medido igual de bien:
//
//   "Mango Kent Wong x kg" -> Mango Edward Wong x kg  ✅
//   "Mango Kent Wong"      -> Helado Wong Premium Mango ❌
//
// Con nombres largos el sufijo AYUDA (empuja hacia el producto fresco); con
// cortos ESTORBA. No hay una regla fija buena, así que no la inventamos:
// buscamos las dos formas y nos quedamos con el resultado que de verdad se
// parece a lo que pidió el usuario. Es una búsqueda extra solo para los
// términos que traen sufijo, y todas van en paralelo.
const SUFIJO_DE_VENTA = /\s+(?:x|por)\s+(?:kg|kilo|kilos|un|und|unid|unidad|unidades)\.?\s*$/i;

export function terminoDeBusqueda(texto: string): string {
  return texto.replace(SUFIJO_DE_VENTA, "").replace(/\s+/g, " ").trim() || texto.trim();
}

function unidadDelSufijo(texto: string): "kg" | "un" | undefined {
  const m = texto.match(SUFIJO_DE_VENTA);
  if (!m) return undefined;
  return /kg|kilo/i.test(m[0]) ? "kg" : "un";
}

const SIN_VALOR = new Set(["de", "del", "la", "el", "los", "las", "en", "y", "con", "para"]);
const limpiar = (s: string) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// ¿Cuánto se parece lo que devolvió Wong a lo que pidió el usuario?
function puntuarResultado(
  consulta: string,
  p: ProductoWong,
  unidadEsperada?: "kg" | "un"
): number {
  if (!p.encontrado) return -1;
  const claves = limpiar(terminoDeBusqueda(consulta))
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !SIN_VALOR.has(w));
  const nombre = limpiar(p.nombre ?? "");
  const aciertos = claves.filter((k) => nombre.includes(k)).length;
  let punto = claves.length > 0 ? aciertos / claves.length : 0;
  // Desempate: si el usuario dijo "x kg", preferimos algo que se venda al peso.
  if (unidadEsperada && (p.unidadVenta ?? "un") === unidadEsperada) punto += 0.15;
  return punto;
}

// --- Instrumentación de matching (solo investigación) ------------------------
// NO es una funcionalidad del producto: es una herramienta para entender POR QUÉ
// el sistema eligió un producto durante las entrevistas. Se activa con
// DEBUG_MATCHING=1 en el servidor y nunca se pinta en la interfaz.
export const DEBUG_MATCHING = process.env.DEBUG_MATCHING === "1";

export type IntentoMatching = {
  estrategia: string;
  consulta: string;
  encontrado: boolean;
  resultado?: string;
  unidadVenta?: string;
  score?: number;
};

export type TrazaMatching = {
  consultaOriginal: string;
  consultaNormalizada: string;
  intentos: IntentoMatching[];
  elegido?: string;
  motivo: string;
};

function anotar(
  estrategia: string,
  consulta: string,
  p: ProductoWong,
  score?: number
): IntentoMatching {
  return {
    estrategia,
    consulta,
    encontrado: !!p.encontrado,
    resultado: p.nombre ?? p.motivo,
    unidadVenta: p.unidadVenta,
    score: score != null ? Math.round(score * 100) / 100 : undefined,
  };
}

// Busca con y sin sufijo cuando lo hay, y devuelve el mejor de los dos.
async function buscarMejor(
  termino: string,
  traza?: TrazaMatching
): Promise<ProductoWong> {
  const limpio = terminoDeBusqueda(termino);

  if (limpio === termino.trim()) {
    const r = await buscarEnWong(termino);
    if (traza) {
      traza.intentos.push(anotar("directa", termino, r));
      traza.motivo = "sin sufijo de venta: una sola consulta";
    }
    return r;
  }

  const unidad = unidadDelSufijo(termino);
  const [conSufijo, sinSufijo] = await Promise.all([
    buscarEnWong(termino),
    buscarEnWong(limpio),
  ]);
  const pCon = puntuarResultado(termino, conSufijo, unidad);
  const pSin = puntuarResultado(termino, sinSufijo, unidad);

  if (traza) {
    traza.intentos.push(anotar("con sufijo", termino, conSufijo, pCon));
    traza.intentos.push(anotar("sin sufijo", limpio, sinSufijo, pSin));
    traza.motivo =
      pSin > pCon
        ? `gana "sin sufijo" (${pSin.toFixed(2)} > ${pCon.toFixed(2)})`
        : `empate o gana "con sufijo" (${pCon.toFixed(2)} >= ${pSin.toFixed(2)}); en empate se respeta el original`;
  }

  // Empate -> se queda el original: no cambiamos nada sin una razón medible.
  return pSin > pCon ? sinSufijo : conSufijo;
}

// "ají amarillo" no está en Wong -> probamos con "ají". "carne de res" -> "carne".
// La traza es opcional y no cambia el resultado en absoluto: cuando existe, solo
// se le añaden anotaciones. Así la instrumentación no puede alterar el matching
// que se está observando.
async function buscarConAlternativa(
  pedido: Pedido,
  traza?: TrazaMatching
): Promise<ItemCarrito> {
  const ingrediente = pedido.producto;
  // Se prueba con y sin sufijo de venta; el ingrediente que se le muestra al
  // usuario sigue siendo el suyo: no le cambiamos las palabras.
  const exacto = await buscarMejor(ingrediente, traza);
  if (exacto.encontrado) {
    if (traza) traza.elegido = exacto.nombre;
    return {
      ...exacto,
      terminoUsado: ingrediente,
      alternativa: false,
      cantidad: cantidadAplicable(exacto, pedido),
      cantidadPedida: pedido.cantidad,
      unidadPedida: pedido.unidad,
    };
  }

  const limpio = terminoDeBusqueda(ingrediente);
  const generico = limpio.split(" ")[0];
  if (generico.toLowerCase() !== limpio.toLowerCase()) {
    const alt = await buscarEnWong(generico);
    if (traza) {
      traza.intentos.push(anotar("alternativa genérica", generico, alt));
    }
    if (alt.encontrado) {
      if (traza) {
        traza.elegido = alt.nombre;
        traza.motivo += ` · sin match directo, cae a alternativa genérica "${generico}"`;
      }
      return {
        ...alt,
        terminoUsado: generico,
        alternativa: true,
        cantidad: cantidadAplicable(alt, pedido),
        cantidadPedida: pedido.cantidad,
        unidadPedida: pedido.unidad,
      };
    }
  }

  if (traza) traza.motivo += " · sin resultado en ninguna estrategia";
  return {
    ...exacto,
    terminoUsado: ingrediente,
    alternativa: false,
    cantidadPedida: pedido.cantidad,
    unidadPedida: pedido.unidad,
  };
}

export type Carrito = ResultadoMenu & {
  titulo: string;
  items: ItemCarrito[];
  total: number; // SOLO lo confirmado: los pendientes no suman
  pendientes: number; // cuántos productos esperan que se defina su cantidad
  faltantes: string[];
  // Solo presente con DEBUG_MATCHING=1. Herramienta de investigación, no de
  // producto: nunca se pinta en la interfaz normal.
  trazas?: TrazaMatching[];
};

// Un producto solo suma al total si conocemos su cantidad. Regla de producto,
// no detalle de implementación: preferimos un carrito incompleto y honesto a un
// total completo e inventado.
export function subtotalDe(it: ItemCarrito): number | undefined {
  if (!it.encontrado || it.disponible === false) return 0;
  if (it.cantidad == null || it.precio == null) return undefined;
  return Math.round(it.precio * it.cantidad * 100) / 100;
}

// Corazón compartido: de una intención ya normalizada al carrito con productos.
async function armarCarrito(base: Intencion, pedidos: Pedido[]): Promise<Carrito> {
  // Las trazas solo se crean si DEBUG_MATCHING está activo: en producción esto
  // es exactamente el mismo trabajo que ya se hacía, sin coste extra.
  const trazas = DEBUG_MATCHING
    ? pedidos.map((p) => ({
        consultaOriginal: p.producto,
        consultaNormalizada: terminoDeBusqueda(p.producto),
        intentos: [] as IntentoMatching[],
        motivo: "",
      }))
    : undefined;

  // En paralelo: no hacemos esperar al usuario ingrediente por ingrediente.
  const items = await Promise.all(
    pedidos.map((p, i) => buscarConAlternativa(p, trazas?.[i]))
  );

  const total = items.reduce((s, it) => s + (subtotalDe(it) ?? 0), 0);
  const pendientes = items.filter((it) => subtotalDe(it) === undefined).length;
  const faltantes = items.filter((it) => !it.encontrado).map((it) => it.ingrediente);

  return {
    ...base,
    items,
    total: Math.round(total * 100) / 100,
    pendientes,
    faltantes,
    ...(trazas ? { trazas } : {}),
  };
}

// Cualquier intención (menú, receta o lista) -> carrito con productos reales.
// El texto libre nunca trae cantidades: los pesables quedarán pendientes.
export async function comprarIntencion(mensaje: string): Promise<Carrito | null> {
  const base = await normalizarIntencion(mensaje);
  if (!base) return null;
  return armarCarrito(
    base,
    base.ingredientes.map((producto) => ({ producto }))
  );
}

// Una lista YA normalizada -> carrito. La usa la importación de una captura: el
// extractor ya leyó la evidencia, así que no hay que volver a parsear texto
// libre (y no queremos: "Lomos de Atún en Agua y Sal" se partiría por la " y ").
// A diferencia del texto, esta entrada SÍ puede traer cantidades: son la razón
// por la que un carrito importado puede explicarse solo.
export async function comprarLista(
  titulo: string,
  pedidos: Pedido[]
): Promise<Carrito | null> {
  const vistos = new Set<string>();
  const limpios: Pedido[] = [];
  for (const p of pedidos ?? []) {
    const producto = (p?.producto ?? "").trim();
    if (!producto || vistos.has(producto.toLowerCase())) continue;
    vistos.add(producto.toLowerCase());
    limpios.push({ ...p, producto });
  }
  if (limpios.length === 0) return null;

  return armarCarrito(
    { menu: titulo, titulo, platos: [], ingredientes: limpios.map((p) => p.producto) },
    limpios
  );
}
