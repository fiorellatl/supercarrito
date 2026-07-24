import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
  menusATexto,
  recetasATexto,
  textoAMenus,
  textoARecetas,
} from "@/lib/format";

const DATA = path.join(process.cwd(), "data");
const MENUS = path.join(DATA, "menus.json");
const RECIPES = path.join(DATA, "recipes.json");

async function leer(p: string) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

// Devuelve los datos actuales como texto editable.
export async function GET() {
  const [menus, recipes] = await Promise.all([leer(MENUS), leer(RECIPES)]);
  return NextResponse.json({
    menus: menusATexto(menus),
    recetas: recetasATexto(recipes),
  });
}

// Guarda el texto editado de vuelta a los JSON.
export async function POST(req: Request) {
  const { menus, recetas } = await req.json();
  try {
    const menusJson = textoAMenus(menus ?? "");
    const recetasJson = textoARecetas(recetas ?? "");

    if (Object.keys(menusJson).length === 0) {
      return NextResponse.json(
        { ok: false, error: "Cada menú necesita un número en su nombre (ej. \"Menú 2\")." },
        { status: 400 }
      );
    }

    await fs.writeFile(MENUS, JSON.stringify(menusJson, null, 2) + "\n");
    await fs.writeFile(RECIPES, JSON.stringify(recetasJson, null, 2) + "\n");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
