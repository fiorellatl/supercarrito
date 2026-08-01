// Dispatcher de extractores. El resto del sistema importa SOLO de aquí y nunca
// sabe qué proveedor está activo — exactamente igual que lib/wong.ts hace con
// el catálogo.
//
//   EXTRACTOR_PROVIDER=muestra  -> ExtractorDeMuestra (sin red, sin costo)
//   EXTRACTOR_PROVIDER=claude   -> ExtractorClaude (modelo multimodal real)
//
// Por defecto usamos "muestra" si no hay credencial configurada: así el
// proyecto sigue arrancando y demostrándose sin clave, igual que arranca sin
// conexión a Wong. La degradación nunca rompe la experiencia.

import { ExtractorClaude } from "@/lib/extractor-claude";
import { ExtractorDeMuestra } from "@/lib/extractor-muestra";
import type { ExtractorDeEvidencia } from "@/lib/evidencia";

function elegirProveedor(): "claude" | "muestra" {
  const pedido = (process.env.EXTRACTOR_PROVIDER ?? "").toLowerCase();
  if (pedido === "claude") return "claude";
  if (pedido === "muestra") return "muestra";
  // Sin preferencia explícita: real si hay credencial, muestra si no.
  return process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
    ? "claude"
    : "muestra";
}

export function extractorActivo(): ExtractorDeEvidencia {
  return elegirProveedor() === "claude"
    ? new ExtractorClaude()
    : new ExtractorDeMuestra();
}
