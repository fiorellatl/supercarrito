import { NextResponse } from "next/server";
import { wongTienda } from "@/lib/tienda";

// El directorio de tiendas para que la familia elija la suya. Va por el servidor
// como todo lo que habla con Wong: el navegador nunca llama a la tienda.
export async function GET() {
  try {
    const tiendas = await wongTienda.tiendas();
    return NextResponse.json({ ok: true, tiendas });
  } catch {
    // Sin directorio no hay pregunta que hacer, y el producto sigue funcionando
    // con precios de catálogo. Degradar, nunca romper.
    return NextResponse.json({ ok: false, tiendas: [] });
  }
}
