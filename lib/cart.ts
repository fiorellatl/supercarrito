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
};

// "ají amarillo" no está en Wong -> probamos con "ají". "carne de res" -> "carne".
async function buscarConAlternativa(ingrediente: string): Promise<ItemCarrito> {
  const exacto = await buscarEnWong(ingrediente);
  if (exacto.encontrado) {
    return { ...exacto, terminoUsado: ingrediente, alternativa: false };
  }

  const generico = ingrediente.split(" ")[0];
  if (generico.toLowerCase() !== ingrediente.toLowerCase()) {
    const alt = await buscarEnWong(generico);
    if (alt.encontrado) {
      return { ...alt, terminoUsado: generico, alternativa: true };
    }
  }

  return { ...exacto, terminoUsado: ingrediente, alternativa: false };
}

export type Carrito = ResultadoMenu & {
  titulo: string;
  items: ItemCarrito[];
  total: number;
  faltantes: string[];
};

// Cualquier intención (menú, receta o lista) -> carrito con productos reales.
export async function comprarIntencion(mensaje: string): Promise<Carrito | null> {
  const base = await normalizarIntencion(mensaje);
  if (!base) return null;

  // En paralelo: no hacemos esperar al usuario ingrediente por ingrediente.
  const items = await Promise.all(base.ingredientes.map(buscarConAlternativa));

  const total = items.reduce(
    (s, it) => s + (it.encontrado && it.disponible !== false ? it.precio ?? 0 : 0),
    0
  );
  const faltantes = items.filter((it) => !it.encontrado).map((it) => it.ingrediente);

  return { ...base, items, total: Math.round(total * 100) / 100, faltantes };
}
