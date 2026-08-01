import { NextResponse } from "next/server";
import { extractorActivo } from "@/lib/extractor";
import type { Evidencia } from "@/lib/evidencia";

// El SDK necesita Node, no el runtime Edge.
export const runtime = "nodejs";

// La ruta no conoce ningún proveedor: pide el activo y habla con la interfaz.
const extractor = extractorActivo();

const TIPOS_OK = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
const MAX_BYTES = 8 * 1024 * 1024; // una captura de móvil no llega ni de lejos

export async function POST(req: Request) {
  let cuerpo: { mediaType?: string; base64?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false, motivo: "Petición inválida." }, { status: 400 });
  }

  const { mediaType, base64 } = cuerpo;

  if (!base64 || !mediaType || !TIPOS_OK.includes(mediaType as (typeof TIPOS_OK)[number])) {
    return NextResponse.json(
      { ok: false, motivo: "Sube una imagen PNG, JPG o WEBP." },
      { status: 400 }
    );
  }

  // base64 abulta ~4/3 respecto al binario original.
  if (base64.length * 0.75 > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, motivo: "La imagen es muy pesada. Prueba con una captura normal del celular." },
      { status: 413 }
    );
  }

  const evidencia: Evidencia = {
    tipo: "imagen",
    mediaType: mediaType as Evidencia["mediaType"],
    base64,
  };

  try {
    const resultado = await extractor.extraer(evidencia);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (e) {
    // Nunca devolvemos el error crudo: puede llevar detalles del proveedor.
    // Se registra en el servidor y al usuario se le dice algo accionable.
    console.error("[importar-captura]", e);
    const faltaClave = e instanceof Error && /api[_ -]?key|authentication/i.test(e.message);
    return NextResponse.json(
      {
        ok: false,
        motivo: faltaClave
          ? "El lector de capturas no está configurado en este servidor."
          : "No pude leer la captura. Intenta de nuevo en un momento.",
      },
      { status: faltaClave ? 503 : 502 }
    );
  }
}
