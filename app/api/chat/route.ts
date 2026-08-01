import { NextResponse } from "next/server";
import { comprarIntencion, comprarLista } from "@/lib/cart";

export async function POST(req: Request) {
  const { mensaje, lista, titulo } = await req.json();

  // Dos formas de pedir lo mismo. Cuando la intención YA viene normalizada
  // (importar una captura), no se vuelve a parsear texto libre: solo cambia la
  // puerta de entrada; la tubería a partir de aquí es idéntica.
  // `lista` acepta strings sueltos o pedidos con cantidad: la captura sí sabe
  // cuánto, y esa cantidad es lo que permite explicar el monto después.
  const pedidos = Array.isArray(lista)
    ? lista.map((x) => (typeof x === "string" ? { producto: x } : x))
    : null;

  const carrito = pedidos
    ? await comprarLista(typeof titulo === "string" && titulo ? titulo : "Tu compra", pedidos)
    : await comprarIntencion(mensaje ?? "");

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
