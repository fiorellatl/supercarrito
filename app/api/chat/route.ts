import { NextResponse } from "next/server";
import { comprarMenu, menusDisponibles } from "@/lib/cart";

export async function POST(req: Request) {
  const { mensaje } = await req.json();

  const carrito = await comprarMenu(mensaje ?? "");

  if (!carrito) {
    const disponibles = await menusDisponibles();
    return NextResponse.json({
      ok: false,
      texto: `No encontré ese menú. Prueba con: ${disponibles
        .map((n) => `"Compra el menú ${n}"`)
        .join(", ")}.`,
    });
  }

  return NextResponse.json({ ok: true, ...carrito });
}
