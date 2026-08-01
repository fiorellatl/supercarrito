// ExtractorDeMuestra: el equivalente de FakeWong para la evidencia.
//
// Mismo contrato que el extractor real, cero red, cero costo, resultado
// determinista. Sirve para tres cosas:
//   · desarrollar y demostrar el flujo completo sin clave de API,
//   · que QA pruebe la pantalla de revisión sin pagar por cada intento,
//   · tener un patrón de referencia estable contra el que comparar al real.
//
// Los datos salen de data/capturas-prueba/verdad.json: una compra real
// transcrita a mano, con sus nombres truncados incluidos. Justamente porque son
// incómodos, son los correctos para probar.

import { promises as fs } from "fs";
import path from "path";
import type {
  Evidencia,
  ExtractorDeEvidencia,
  LineaExtraida,
  ResultadoExtraccion,
  Unidad,
} from "@/lib/evidencia";

type VerdadJson = {
  capturas: {
    archivo: string;
    lineas: {
      textoOriginal: string;
      producto: string;
      cantidad?: number;
      unidad?: string;
      truncado?: boolean;
    }[];
  }[];
};

const RUTA = path.join(process.cwd(), "data", "capturas-prueba", "verdad.json");

export class ExtractorDeMuestra implements ExtractorDeEvidencia {
  // `cual` elige qué captura de muestra devolver (0, 1, 2...). Por defecto rota
  // según el tamaño de la imagen, para que subir archivos distintos dé
  // resultados distintos y la demo no parezca un truco.
  constructor(private cual?: number) {}

  async extraer(evidencia: Evidencia): Promise<ResultadoExtraccion> {
    const t0 = Date.now();
    const verdad = JSON.parse(await fs.readFile(RUTA, "utf8")) as VerdadJson;
    const capturas = verdad.capturas ?? [];

    if (capturas.length === 0) {
      return {
        reconocida: false,
        motivo: "No hay capturas de muestra configuradas.",
        lineas: [],
      };
    }

    const idx = this.cual ?? evidencia.base64.length % capturas.length;
    const elegida = capturas[idx % capturas.length];

    const lineas: LineaExtraida[] = elegida.lineas
      .filter((l) => (l.producto ?? "").trim().length > 0)
      .map((l) => ({
        textoOriginal: l.textoOriginal ?? "",
        producto: l.producto.trim(),
        cantidad: l.cantidad,
        unidad: (l.unidad === "un" || l.unidad === "kg" ? l.unidad : undefined) as
          | Unidad
          | undefined,
        truncado: !!l.truncado,
      }));

    return {
      reconocida: lineas.length > 0,
      lineas,
      diagnostico: {
        proveedor: "muestra",
        modelo: `verdad:${elegida.archivo}`,
        ms: Date.now() - t0,
      },
    };
  }
}
