import { NextResponse } from "next/server";
import { comprarIntencion } from "@/lib/cart";

export async function POST(req: Request) {
  const { mensaje } = await req.json();

  const carrito = await comprarIntencion(mensaje ?? "");

  if (!carrito) {
    return NextResponse.json({
      ok: false,
      texto:
        "No entendí qué comprar. Escríbeme una lista (ej. \"pollo, pan, aceite\"), " +
        "una receta (ej. \"ají de gallina\") o un menú (ej. \"menú 2\").",
    });
  }

  return NextResponse.json({ ok: true, ...carrito });
}
