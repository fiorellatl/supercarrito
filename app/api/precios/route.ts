import { NextResponse } from "next/server";
import { wongTienda, type LineaAValorar, type Tienda } from "@/lib/tienda";

// Precio y disponibilidad reales de la tienda de la familia, para la compra
// entera y en UNA sola llamada (~1 s con 35 productos, medido).
//
// Se le mandan las unidades de venta ya redondeadas —las mismas que viajarán en
// el enlace—, no las cantidades pedidas. Así el total que devuelve Wong es
// exactamente el que la familia va a ver en su carrito cinco segundos después.
export async function POST(req: Request) {
  try {
    const { tienda, lineas } = (await req.json()) as {
      tienda?: Tienda;
      lineas?: LineaAValorar[];
    };

    if (!tienda?.lon || !tienda?.lat || !Array.isArray(lineas)) {
      return NextResponse.json({ ok: false, motivo: "faltan la tienda o las líneas" });
    }

    const precios = await wongTienda.precios(
      lineas.filter((l) => l?.sku && l.unidades > 0),
      tienda
    );
    return NextResponse.json({ ok: true, ...precios });
  } catch {
    // Si la tienda no contesta, el producto sigue: se pintan los precios de
    // catálogo y se DICE que son referenciales. Nunca en silencio.
    return NextResponse.json({ ok: false, motivo: "la tienda no respondió" });
  }
}
