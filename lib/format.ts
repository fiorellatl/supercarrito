// Texto amigable <-> JSON, para editar menús y recetas sin tocar código.
// Formato (el mismo del ejemplo original): bloques separados por línea en blanco.
//
//   Menú 2
//   - Ají de gallina
//   - Pescado con arroz
//
//   ---(recetas)---
//   Ají de gallina
//   - pollo
//   - leche

type Menus = Record<string, { nombre: string; platos: string[] }>;
type Recipes = Record<string, string[]>;

function bloques(texto: string): string[][] {
  return texto
    .split(/\n\s*\n/) // separa por líneas en blanco
    .map((b) => b.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((b) => b.length > 0);
}

const sinGuion = (l: string) => l.replace(/^[-*]\s*/, "").trim();

// --- Menús ---

export function menusATexto(menus: Menus): string {
  return Object.values(menus)
    .map((m) => [m.nombre, ...m.platos.map((p) => `- ${p}`)].join("\n"))
    .join("\n\n");
}

export function textoAMenus(texto: string): Menus {
  const menus: Menus = {};
  for (const b of bloques(texto)) {
    const nombre = b[0];
    const id = nombre.match(/\d+/)?.[0];
    if (!id) continue; // el nombre del menú debe tener un número (ej. "Menú 2")
    menus[id] = { nombre, platos: b.slice(1).map(sinGuion) };
  }
  return menus;
}

// --- Recetas ---

export function recetasATexto(recipes: Recipes): string {
  return Object.entries(recipes)
    .map(([plato, ings]) => [plato, ...ings.map((i) => `- ${i}`)].join("\n"))
    .join("\n\n");
}

export function textoARecetas(texto: string): Recipes {
  const recipes: Recipes = {};
  for (const b of bloques(texto)) {
    const plato = b[0];
    recipes[plato] = b.slice(1).map(sinGuion);
  }
  return recipes;
}
