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
  items: ItemCarrito[];
  total: number;
  faltantes: string[];
};

export async function comprarMenu(mensaje: string): Promise<Carrito | null> {
  const base = await armarListaDeMenu(mensaje);
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
