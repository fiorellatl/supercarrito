import { NextResponse } from "next/server";
import { catalogoDeTienda } from "@/lib/tienda";
import { cadenaDe } from "@/lib/cadenas";

// El directorio de tiendas para que la familia elija la suya. Va por el servidor
// como todo lo que habla con Wong: el navegador nunca llama a la tienda.
export async function GET(req: Request) {
  try {
    // ?cadena=metro. Sin ella, o sin verificar, Wong.
    const cadena = cadenaDe(new URL(req.url).searchParams.get("cadena"));
    const tiendas = await catalogoDeTienda(cadena).tiendas();
    return NextResponse.json({ ok: true, tiendas });
  } catch {
    // Sin directorio no hay pregunta que hacer, y el producto sigue funcionando
    // con precios de catálogo. Degradar, nunca romper.
    return NextResponse.json({ ok: false, tiendas: [] });
  }
}
