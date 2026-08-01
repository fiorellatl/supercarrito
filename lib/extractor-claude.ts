// Implementación de `ExtractorDeEvidencia` con un modelo multimodal de Claude.
//
// ⚠️ SOLO SERVIDOR. Este archivo usa ANTHROPIC_API_KEY del entorno y nunca debe
// importarse desde un componente "use client": la clave no puede llegar al
// navegador. Se usa exclusivamente desde app/api/extraer/route.ts.
//
// Por qué un modelo multimodal y no OCR: el OCR devolvería un muro de texto que
// igual habría que parsear, y ese parser se rompería con cada cambio de layout
// de la app de Wong. Aquí la IA no resuelve un problema de negocio; evita
// construir código frágil sin ventaja competitiva (decisión de la PO).
//
// El prompt y el esquema NO viven aquí: están en lib/extractor-contrato.mjs,
// compartidos con el instrumento de medición para que ambos midan lo mismo.

import Anthropic from "@anthropic-ai/sdk";
import { cuerpoPeticion } from "@/lib/extractor-contrato.mjs";
import type {
  Evidencia,
  ExtractorDeEvidencia,
  LineaExtraida,
  ResultadoExtraccion,
} from "@/lib/evidencia";

// Decisión del benchmark (PROJECT_STATE.md, 2026-08-01): Sonnet 5 + estrategia
// "completar" igualan en precisión a Opus 4.8 a 2,5x menos costo. Configurable
// por entorno para poder cambiarlo sin tocar código, pero el default ES la
// decisión ya tomada, no un placeholder.
export const MODELO_POR_DEFECTO = process.env.EXTRACTOR_MODELO ?? "claude-sonnet-5";
export const ESTRATEGIA_POR_DEFECTO = process.env.EXTRACTOR_ESTRATEGIA ?? "completar";

type Crudo = {
  reconocida: boolean;
  motivo: string;
  lineas: {
    textoOriginal: string;
    producto: string;
    cantidad: number;
    unidad: string;
    truncado: boolean;
  }[];
};

export class ExtractorClaude implements ExtractorDeEvidencia {
  private cliente: Anthropic;
  private modelo: string;
  private estrategia: string;

  constructor(modelo: string = MODELO_POR_DEFECTO, estrategia: string = ESTRATEGIA_POR_DEFECTO) {
    this.modelo = modelo;
    this.estrategia = estrategia;
    // Sin argumentos: el SDK resuelve la credencial del entorno del servidor.
    this.cliente = new Anthropic();
  }

  async extraer(evidencia: Evidencia): Promise<ResultadoExtraccion> {
    const t0 = Date.now();

    // El cuerpo viene de un .mjs compartido con el instrumento de medición, así
    // que TypeScript lo ve con tipos ensanchados (string en vez de literales).
    // El cast es el único punto donde eso se reconcilia.
    const peticion = cuerpoPeticion(
      this.modelo,
      evidencia.mediaType,
      evidencia.base64,
      this.estrategia
    ) as Anthropic.MessageCreateParamsNonStreaming;

    const respuesta = await this.cliente.messages.create(peticion);

    const ms = Date.now() - t0;
    const diagnostico = {
      proveedor: "claude",
      modelo: this.modelo,
      ms,
      tokensEntrada: respuesta.usage.input_tokens,
      tokensSalida: respuesta.usage.output_tokens,
    };

    // Una negativa del modelo no puede romper la compra: se trata como "no
    // reconocida", igual que una imagen que no es un carrito.
    if (respuesta.stop_reason === "refusal") {
      return { reconocida: false, motivo: "No pude leer esta imagen.", lineas: [], diagnostico };
    }

    const texto = respuesta.content.find((b) => b.type === "text")?.text ?? "";
    let crudo: Crudo;
    try {
      crudo = JSON.parse(texto) as Crudo;
    } catch {
      return {
        reconocida: false,
        motivo: "No pude leer esta imagen. Intenta con otra captura.",
        lineas: [],
        diagnostico,
      };
    }

    const lineas: LineaExtraida[] = (crudo.lineas ?? [])
      .filter((l) => (l.producto ?? "").trim().length > 0)
      .map((l) => ({
        textoOriginal: l.textoOriginal ?? "",
        producto: l.producto.trim(),
        cantidad: Number.isFinite(l.cantidad) && l.cantidad > 0 ? l.cantidad : undefined,
        unidad: l.unidad === "un" || l.unidad === "kg" ? l.unidad : undefined,
        truncado: !!l.truncado,
      }));

    return {
      reconocida: !!crudo.reconocida && lineas.length > 0,
      motivo: crudo.reconocida
        ? undefined
        : crudo.motivo || "Esto no parece un carrito de compras.",
      lineas,
      diagnostico,
    };
  }
}
