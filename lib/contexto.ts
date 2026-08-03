// Qué es una compra y qué es conversación.
//
// Este archivo existe por un fallo concreto y caro: pegar un WhatsApp normal y
// que «gracias!» volviera del buscador convertido en una *Cama El Cisne Munay +
// Sofá Cama, S/ 659.00*. El buscador no tiene la culpa: le preguntamos por
// «gracias» y, como todo buscador, devolvió algo. La culpa es de haberle
// preguntado.
//
// EL OBJETIVO NO ES ACERTAR MÁS. Es no equivocarse feo. Una línea que no
// encontramos deja a la familia donde estaba; una línea inventada de S/ 659 le
// enseña que el producto no entiende lo que le escribe, y eso no se recupera.
// Por eso, ante la duda, NO se busca: se pregunta.
//
// Es una lista cerrada de palabras y un puñado de formas reconocibles. No hay
// modelo, no hay servicio, no hay motor de lenguaje: eso sería un sistema mucho
// más difícil de explicar y de corregir para arreglar un problema que se
// resuelve mirando la línea. Cuando la regla se equivoque, se ve por qué.

// Tres naturalezas, no dos. El «no sé» es la pieza que faltaba: hasta hoy toda
// línea era producto o encabezado, y lo que no encajaba en encabezado se iba al
// buscador por descarte.
export type Naturaleza =
  | "compra" // se busca
  | "contexto" // no se busca, y no se le reprocha haber quedado pendiente
  | "duda"; // no se busca sin preguntar antes

export type Lectura = { naturaleza: Naturaleza; motivo: string };

// --- Encabezados: contexto, no productos -------------------------------------
//
// Un mensaje de WhatsApp casi nunca empieza por un producto. Empieza por a quién
// va dirigido y por lo que se pide hacer:
//
//   «Mami                         →  esto no es un producto
//    compra 2 kg de pollo          →  el producto es "2 kg de pollo"
//    lista del mercado             →  esto no es un producto
//    aceite»
//
// Solo se quitan si van AL PRINCIPIO y solo mientras se encadenen. En cuanto
// aparece cualquier otra cosa —un número, un producto— se para y el resto se
// respeta letra por letra.
//
// Fuera de la lista a propósito: **papa** y **papi**. En Perú "papa" es un
// producto que se compra todas las semanas, y confundirlo con un vocativo sería
// mucho peor que el fallo que estamos arreglando.
const ENCABEZADO = new Set([
  "mami", "mama", "mamá", "mamita", "mamacita", "hija", "hijita", "hijo", "hijito",
  "amor", "hola", "buenas", "oye", "oiga", "porfa", "porfis", "please", "urgente",
  "compra", "compras", "cómprame", "comprame", "comprar", "compre", "compremos",
  "trae", "tráeme", "traeme", "traer", "necesito", "necesitamos", "falta", "faltan",
  "acuérdate", "acuerdate", "recuerda", "anota", "apunta",
  "lista", "listita", "mercado", "súper", "super", "supermercado", "encargo", "pedido",
]);

// Solo se descartan DESPUÉS de haber quitado un encabezado. "el pollo" a secas
// se respeta; "cómprame el pollo" sí puede perder su "el".
const RELLENO = new Set([
  "de", "del", "la", "el", "los", "las", "para", "por", "favor",
  "que", "hay", "me", "nos", "un", "una", "y",
]);

// Fórmulas de conversación que NUNCA son un producto. Es la lista que hoy no
// existía y por la que «gracias» llegó al buscador. Solo cuentan cuando son la
// línea ENTERA: "pan con queso y gracias" no está aquí, y no queremos que lo
// esté — "leche" dentro de una línea larga sigue siendo leche.
const CORTESIA = new Set([
  "gracias", "muchas gracias", "mil gracias", "graciasss", "grax",
  "ok", "oka", "oki", "okey", "okay", "vale", "dale", "ya", "ya esta", "ya está",
  "listo", "lista lista", "perfecto", "bueno", "buenisimo", "buenísimo", "genial",
  "si", "sí", "no", "nada", "nada mas", "nada más", "eso es todo", "es todo",
  "chau", "chao", "adios", "adiós", "bye", "besos", "un beso", "abrazo", "abrazos",
  "buenos dias", "buenos días", "buenas tardes", "buenas noches",
  "te amo", "te quiero", "cuidate", "cuídate", "avisame", "avísame",
  "jaja", "jajaja", "jeje", "jejeje", "xd", "emm", "eh",
]);

const desnudo = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const ENCABEZADO_PLANO = new Set([...ENCABEZADO].map(desnudo));
const RELLENO_PLANO = new Set([...RELLENO].map(desnudo));
const CORTESIA_PLANA = new Set([...CORTESIA].map(desnudo));

// Devuelve la línea sin su encabezado. Si no queda nada, la línea ERA el
// encabezado. Nunca modifica lo que la familia ve: solo lo que se busca.
export function sinEncabezado(texto: string): string {
  const palabras = (texto ?? "").trim().split(/\s+/).filter(Boolean);
  let i = 0;
  let corte = 0;
  while (i < palabras.length) {
    const p = desnudo(palabras[i].replace(/[.,:;!¡?¿]+$/, ""));
    if (ENCABEZADO_PLANO.has(p)) {
      i++;
      corte = i;
    } else if (corte > 0 && RELLENO_PLANO.has(p)) {
      i++;
    } else break;
  }
  return palabras.slice(corte === 0 ? 0 : i).join(" ").trim();
}

// --- Formas que delatan una conversación -------------------------------------
// Cada una es un patrón que ninguna compra tiene. Se comprueban sobre la línea
// entera, no sobre palabras sueltas.

// «[10:03» · «21:45». La coma con la que WhatsApp separa hora y fecha ya partió
// la línea en dos antes de llegar aquí, así que cada mitad se reconoce sola.
const HORA = /\b\d{1,2}:\d{2}\b/;
// «2/8/2026] Mamá: compra por favor». Ojo: exige TRES grupos, para que "1/2 kg
// de queso" —media unidad, una compra perfectamente normal— no caiga aquí.
const FECHA = /\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/;
const ENLACE = /(https?:\/\/|www\.)/i;
const CORREO = /\S+@\S+\.\S+/;
// Un teléfono peruano, con o sin espacios. Un producto nunca es nueve dígitos.
const TELEFONO = /(?:\+?51)?[\s-]?9\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/;
const TIENE_LETRA_O_NUMERO = /[\p{L}\p{N}]/u;
const TIENE_NUMERO = /\p{N}/u;

// Una compra es corta. Cuando alguien escribe una frase larga sin una sola
// cantidad, casi siempre está contando algo, no pidiendo algo. Casi. Por eso
// esto NO descarta: pregunta.
const PALABRAS_DE_MAS = 6;

const limpiarBordes = (s: string) =>
  s.replace(/^[\s\p{P}\p{S}]+|[\s\p{P}\p{S}]+$/gu, "").trim();

/**
 * Qué es esta línea, antes de buscar nada.
 *
 * El orden importa: primero lo que es imposible que sea una compra, y solo al
 * final la sospecha. Ante el empate gana no buscar.
 */
export function naturalezaDe(texto: string): Lectura {
  const bruto = (texto ?? "").trim();
  if (!bruto) return { naturaleza: "contexto", motivo: "está vacía" };

  // Emojis, signos, un «👍» suelto. No hay nada que buscar.
  if (!TIENE_LETRA_O_NUMERO.test(bruto))
    return { naturaleza: "contexto", motivo: "no dice nada que se pueda comprar" };

  // La hora sola —lo que queda de «[10:03, 2/8/2026]» tras partir por la coma—
  // es contexto. «pollo a las 10:00» no: ahí la hora acompaña a algo.
  if (HORA.test(bruto) && limpiarBordes(bruto.replace(HORA, "")) === "")
    return { naturaleza: "contexto", motivo: "es la hora del mensaje" };
  if (FECHA.test(bruto))
    return { naturaleza: "contexto", motivo: "es la fecha del mensaje" };
  if (ENLACE.test(bruto)) return { naturaleza: "contexto", motivo: "es un enlace" };
  if (CORREO.test(bruto)) return { naturaleza: "contexto", motivo: "es un correo" };
  if (TELEFONO.test(bruto))
    return { naturaleza: "contexto", motivo: "es un número de teléfono" };

  // A partir de aquí se juzga la línea SIN su encabezado: "porfa gracias" es
  // tan poco producto como "gracias".
  const util = sinEncabezado(bruto);
  if (util === "")
    return { naturaleza: "contexto", motivo: "es cómo empieza el mensaje" };

  const plano = desnudo(limpiarBordes(util));
  if (CORTESIA_PLANA.has(plano))
    return { naturaleza: "contexto", motivo: "es una fórmula de conversación" };

  // Una pregunta no es un encargo: «¿compramos pollo?» puede serlo, pero
  // decidirlo por ella sería inventarle una compra. Se pregunta.
  if (/[?？]\s*$/.test(bruto) || /^\s*¿/.test(bruto))
    return { naturaleza: "duda", motivo: "parece una pregunta" };

  const palabras = util.split(/\s+/).filter(Boolean);
  if (palabras.length > PALABRAS_DE_MAS && !TIENE_NUMERO.test(util))
    return { naturaleza: "duda", motivo: "parece una frase, no un producto" };

  return { naturaleza: "compra", motivo: "" };
}

// Compatibilidad con lo que ya existía: una línea que no se busca porque es
// contexto. La duda NO es contexto —se busca en cuanto la familia diga que sí—,
// y por eso no cabía en un booleano.
export function esContexto(texto: string): boolean {
  return naturalezaDe(texto).naturaleza === "contexto";
}
