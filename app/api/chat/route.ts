import { NextResponse } from "next/server";
import { comprarIntencion, comprarLibreta, comprarLista } from "@/lib/cart";

export async function POST(req: Request) {
  const { mensaje, lista, lineas, titulo } = await req.json();

  // Tres formas de pedir lo mismo; una sola tubería a partir de aquí.
  //
  // `lineas`  — la libreta, y la entrada normal del producto. Cada línea se
  //   normaliza por separado, porque en la misma libreta conviven una lista, un
  //   menú, una receta y lo leído de una captura.
  // `lista`   — una intención YA normalizada (captura importada): no se vuelve a
  //   parsear texto libre y puede traer cantidades.
  // `mensaje` — texto libre de una sola intención. Se conserva para pruebas por
  //   API y para el resto de herramientas.
  const pedidos = Array.isArray(lista)
    ? lista.map((x) => (typeof x === "string" ? { producto: x } : x))
    : null;

  const carrito = Array.isArray(lineas)
    ? await comprarLibreta(lineas.map((x) => (typeof x === "string" ? { texto: x } : x)))
    : pedidos
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
