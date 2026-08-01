// Prompt + esquema del extractor, en JS plano.
//
// Vive aquí, y no dentro de lib/extractor-claude.ts, por una razón concreta:
// el instrumento de medición (scripts/comparar_extractores.mjs) tiene que usar
// EXACTAMENTE el mismo prompt y el mismo esquema que el producto. Si se
// duplicaran, la medición dejaría de decir la verdad en cuanto uno de los dos
// cambiara. Una sola fuente, dos consumidores.

// PRINCIPIO DE DISEÑO (decisión de la PO): el extractor depende del SIGNIFICADO
// del contenido, nunca de la posición visual de los elementos. El layout de Wong
// va a cambiar; estas instrucciones deben seguir siendo ciertas cuando cambie.
// Por eso no se nombra ninguna columna, ni orden de campos, ni elemento concreto
// de la interfaz como criterio: todos los ejemplos son ilustrativos, y el
// criterio siempre es semántico.
export const INSTRUCCIONES = `Eres el extractor de SuperCarrito. Recibes UNA evidencia visual de una compra y devuelves los productos que contiene.

QUÉ ACEPTAS
Cualquier pantalla que liste productos de un supermercado: un carrito, una lista, el detalle de un pedido o un historial de compra. Da igual si viene de una app o de una web, si muestra fotos o no, si los precios están a la derecha, debajo o no aparecen, y da igual cómo estén dispuestas las columnas. Cualquier otra imagen —comida, una nevera, una conversación, un documento que no sea una compra— NO es válida: devuelve reconocida=false, lineas vacío y un motivo breve y amable en español.

CÓMO DECIDES QUÉ ES UN PRODUCTO
Por su significado, NUNCA por su posición. Algo es un producto si nombra un artículo que una familia compraría en un supermercado. No asumas ninguna disposición concreta de filas, columnas, imágenes o campos: los diseños cambian y tu criterio no debe depender de ellos.

QUÉ IGNORAS
Todo lo que no sea un producto: cabeceras, títulos, totales, descuentos, cupones, publicidad, controles de la interfaz, barra de estado del teléfono, navegación. Esta lista es ilustrativa, no exhaustiva — el criterio es el significado, no el nombre del elemento.

REGLAS POR PRODUCTO
- textoOriginal: el nombre EXACTAMENTE como se ve, carácter por carácter, incluidos los puntos suspensivos si la interfaz lo cortó. No lo limpies, no lo corrijas, no lo completes.
- truncado: true si el nombre aparece cortado (termina en "…" o "..."), false si está completo.
- producto: el nombre listo para buscar. Si venía truncado, usa SOLO la parte visible, sin los puntos suspensivos. NUNCA adivines ni completes lo que no se ve, aunque la foto del producto lo sugiera: es preferible un nombre incompleto a uno inventado.
- cantidad y unidad: acepta cualquier forma de escribirla ("3 un", "x3", "3 unidades", "1.6 kg", "0,75 kg", "500 g", "2 und"). Normaliza a un número y a "un" o "kg" — la coma decimal es un punto decimal, y los gramos se convierten a kg. Si no hay cantidad visible, unidad "desconocida".
- Si el mismo producto aparece dos veces, devuélvelo dos veces.
- Si un producto aparece sin nombre legible pero con cantidad, inclúyelo igualmente con producto y textoOriginal vacíos y truncado=true.
- Ignora precios y subtotales. No son fiables en la evidencia y los consultamos al supermercado.

ORDEN
El mismo en que aparecen, leyendo de arriba abajo.

No inventes productos que no estén en la evidencia.`;

export const ESQUEMA = {
  type: "object",
  properties: {
    reconocida: {
      type: "boolean",
      description: "true si la imagen es un carrito/lista/pedido de supermercado",
    },
    motivo: {
      type: "string",
      description:
        "Si reconocida=false, explicación breve para el usuario. Si no, cadena vacía.",
    },
    lineas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          textoOriginal: { type: "string" },
          producto: { type: "string" },
          cantidad: { type: "number" },
          unidad: { type: "string", enum: ["un", "kg", "desconocida"] },
          truncado: { type: "boolean" },
        },
        required: ["textoOriginal", "producto", "cantidad", "unidad", "truncado"],
        additionalProperties: false,
      },
    },
  },
  required: ["reconocida", "motivo", "lineas"],
  additionalProperties: false,
};

export const PETICION = "Extrae los productos de esta captura.";

// --- Segunda estrategia: completar lo truncado --------------------------------
// La estrategia por defecto (arriba) es LITERAL: nunca completa un nombre
// cortado. Es la más honesta respecto al texto... pero el objetivo del extractor
// no es hacer OCR perfecto, es construir el mejor carrito posible. Si completar
// "Trucha Desh…" a "Trucha Deshuesada" hace que Wong encuentre el producto
// correcto más veces, la fidelidad textual importa menos que el resultado.
//
// Se mide, no se supone. Ambas estrategias comparten TODO lo demás.
export const INSTRUCCIONES_COMPLETAR = INSTRUCCIONES.replace(
  `- producto: el nombre listo para buscar. Si venía truncado, usa SOLO la parte visible, sin los puntos suspensivos. NUNCA adivines ni completes lo que no se ve, aunque la foto del producto lo sugiera: es preferible un nombre incompleto a uno inventado.`,
  `- producto: el nombre listo para buscar en el supermercado. Si el nombre venía truncado, COMPLÉTALO cuando la evidencia visual te dé confianza suficiente para hacerlo: la foto del producto, la marca visible en el envase, el formato, la categoría. "Trucha Desh…" sobre una foto de filete de trucha es "Trucha Deshuesada"; "Queso Philadel…" sobre una caja de Philadelphia es "Queso Philadelphia". Si NO tienes evidencia suficiente, deja solo la parte visible: entre inventar y quedarte corto, quédate corto. \`textoOriginal\` sigue siendo siempre el texto literal, sin completar — es la única forma de saber después qué completaste tú.`
);

export const ESTRATEGIAS = {
  literal: { nombre: "literal", instrucciones: INSTRUCCIONES },
  completar: { nombre: "completar", instrucciones: INSTRUCCIONES_COMPLETAR },
};

// Cuerpo de la petición, idéntico para producto e instrumento. Fijar `thinking`
// explícitamente es lo único que hace justa la comparación entre modelos: Opus
// omite el pensamiento por defecto y Sonnet lo activa. La extracción es
// mecánica y no necesita razonamiento extendido.
export function cuerpoPeticion(modelo, mediaType, base64, estrategia = "literal") {
  const elegida = ESTRATEGIAS[estrategia] ?? ESTRATEGIAS.literal;
  return {
    model: modelo,
    max_tokens: 8000,
    thinking: { type: "disabled" },
    output_config: { format: { type: "json_schema", schema: ESQUEMA } },
    system: elegida.instrucciones,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: PETICION },
        ],
      },
    ],
  };
}
