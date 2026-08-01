// Contrato del extractor de evidencia. Es lo ÚNICO que conoce el resto del
// sistema — igual que `lib/catalog.ts` hace con el catálogo.
//
// Aquí NO aparece la palabra Anthropic, ni Claude, ni ningún proveedor. Cambiar
// de proveedor (o volver a OCR tradicional, o a un parser de texto pegado) es
// escribir otra implementación de `ExtractorDeEvidencia`. Nada más cambia.
//
// Recordatorio del modelo: "extraer la intención de compra a partir de una
// evidencia que el usuario ya tiene". Hoy la evidencia es una captura del
// carrito de Wong; mañana puede ser texto pegado, una foto o una nota de voz.

export type Evidencia = {
  tipo: "imagen";
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  base64: string;
};

export type Unidad = "un" | "kg";

// Una línea leída de la evidencia. NO es todavía un producto de Wong: es lo que
// el usuario ya tenía escrito en alguna parte.
export type LineaExtraida = {
  // ⭐ El texto tal y como aparece en la evidencia, sin limpiar ni completar.
  // Es la materia prima para depurar, para medir la calidad del extractor y
  // para el historial: si mañana cambiamos de modelo, esto sigue siendo cierto.
  // Además delata las truncaduras de la app ("Trucha Desh…"), que son reales.
  textoOriginal: string;

  // Lo que creemos que es el producto, ya normalizado para poder buscarlo.
  producto: string;

  cantidad?: number;
  unidad?: Unidad;

  // true si `textoOriginal` venía cortado en la interfaz de origen ("…").
  // Un nombre truncado NO se puede dar por bueno: se busca, pero se avisa.
  truncado?: boolean;
};

export type ResultadoExtraccion = {
  // ¿La evidencia es realmente un carrito o pedido? Si no, NO adivinamos.
  reconocida: boolean;
  motivo?: string; // por qué no se reconoció (se le muestra al usuario)
  lineas: LineaExtraida[];

  // Telemetría del extractor. No es parte del producto: es para medir y para
  // decidir el modelo con evidencia. La UI la ignora.
  diagnostico?: {
    proveedor: string;
    modelo: string;
    ms: number;
    tokensEntrada?: number;
    tokensSalida?: number;
  };
};

// La interfaz. Misma forma para cualquier proveedor o técnica.
export interface ExtractorDeEvidencia {
  extraer(evidencia: Evidencia): Promise<ResultadoExtraccion>;
}
