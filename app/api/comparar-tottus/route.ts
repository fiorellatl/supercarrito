import { NextResponse } from "next/server";
import type { LineaAComparar } from "@/lib/comparar";
import { cadenaDe } from "@/lib/cadenas";
import type { Tienda } from "@/lib/tienda";
import { compararConTottus } from "@/lib/tottus";

// La misma compra en Tottus, solo para comparar (ver lib/tottus.ts).
export async function POST(req: Request) {
  try {
    const { tienda, lineas } = (await req.json()) as { tienda?: Tienda; lineas?: LineaAComparar[] };
    if (!tienda?.lon || !tienda?.lat || !Array.isArray(lineas) || lineas.length === 0) {
      return NextResponse.json({ ok: false, motivo: "faltan la tienda o las líneas" });
    }
    const r = await compararConTottus(
      lineas.filter((l) => l?.sku && l.unidades > 0).slice(0, 40),
      { tienda, cadena: cadenaDe(tienda.cadena) }
    );
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.warn("[comparar-tottus]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, motivo: "Tottus no respondió" });
  }
}
