import { NextResponse } from "next/server";
import { catalogoDeLaTienda, type LineaAValorar, type Tienda } from "@/lib/tienda";
import distritos from "@/data/distritos.json";

// Lo que cobra la tienda por llevar la compra a un distrito. El distrito se
// traduce a un punto fijo (data/distritos.json): no pedimos la dirección de
// nadie, y la pantalla dice que el cálculo es para el distrito, no para la
// puerta de su casa.
export async function POST(req: Request) {
  try {
    const { tienda, lineas, distrito } = (await req.json()) as {
      tienda?: Tienda;
      lineas?: LineaAValorar[];
      distrito?: string;
    };
    const lugar = distritos.find((d) => d.nombre === distrito);
    if (!lugar || !Array.isArray(lineas)) {
      return NextResponse.json({ ok: false, motivo: "falta el distrito o las líneas" });
    }
    const envio = await catalogoDeLaTienda(tienda).envio(
      lineas.filter((l) => l?.sku && l.unidades > 0),
      lugar
    );
    return NextResponse.json({ ok: true, ...envio });
  } catch {
    // Sin respuesta no hay número: la pantalla dice que lo confirma la tienda.
    return NextResponse.json({ ok: false, motivo: "la tienda no respondió" });
  }
}
