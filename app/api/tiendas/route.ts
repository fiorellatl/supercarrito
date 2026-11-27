import { NextResponse } from "next/server";
import { catalogoDeTienda } from "@/lib/tienda";
import { CADENAS, cadenasDisponibles, type CadenaId } from "@/lib/cadenas";

// El directorio de tiendas para que la familia elija la suya. Va por el servidor
// como todo lo que habla con la tienda: el navegador nunca llama a la tienda.
//
// Sin `?cadena=`, las tiendas de TODAS las cadenas que el producto sabe atender,
// cada una marcada con la suya: la familia elige cadena y tienda en la misma
// pantalla. Una cadena que no contesta no tumba a las otras.
export async function GET(req: Request) {
  const pedida = new URL(req.url).searchParams.get("cadena") as CadenaId | null;
  const cadenas =
    pedida && CADENAS[pedida]?.verificada ? [CADENAS[pedida]] : cadenasDisponibles();
  const listas = await Promise.all(
    cadenas.map((c) => catalogoDeTienda(c).tiendas().catch(() => []))
  );
  const tiendas = listas.flat();
  // Sin directorio no hay pregunta que hacer, y el producto sigue funcionando
  // con precios de catálogo. Degradar, nunca romper.
  return NextResponse.json({ ok: tiendas.length > 0, tiendas });
}
