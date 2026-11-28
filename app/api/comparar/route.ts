import { NextResponse } from "next/server";
import { comparar, type LineaAComparar } from "@/lib/comparar";
import { cadenaDe, cadenasDisponibles } from "@/lib/cadenas";
import type { Tienda } from "@/lib/tienda";
import distritos from "@/data/distritos.json";

// La misma compra en otra cadena (una por llamada; la pantalla pregunta a cada una). Ver lib/comparar.ts: solo el MISMO
// producto, y los dos totales los da cada tienda.
export async function POST(req: Request) {
  try {
    const { tienda, lineas, distrito, destino: idDestino } = (await req.json()) as {
      destino?: string; // cuál de las otras cadenas; sin él, la primera
      tienda?: Tienda;
      lineas?: LineaAComparar[];
      distrito?: string;
    };
    if (!tienda?.lon || !tienda?.lat || !Array.isArray(lineas) || lineas.length === 0) {
      return NextResponse.json({ ok: false, motivo: "faltan la tienda o las líneas" });
    }
    const origen = cadenaDe(tienda.cadena);
    const otras = cadenasDisponibles().filter((c) => c.id !== origen.id);
    const destino = otras.find((c) => c.id === idDestino) ?? otras[0];
    if (!destino) return NextResponse.json({ ok: false, motivo: "no hay otra cadena" });
    const lugar = distritos.find((d) => d.nombre === distrito);
    const r = await comparar(
      lineas.filter((l) => l?.sku && l.unidades > 0),
      { tienda, cadena: origen },
      destino,
      lugar
    );
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    console.warn("[comparar]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, motivo: "una de las tiendas no respondió" });
  }
}
