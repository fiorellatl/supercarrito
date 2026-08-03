// La libreta — el Home del producto, como modelo puro.
//
// Sin React, sin red, sin almacenamiento: igual que `preferencias.ts`. Quién la
// guarda es `libreta-store.ts`; quién la pinta es `app/page.tsx`.
//
// PRINCIPIOS QUE ESTE ARCHIVO PROTEGE (§4 de PROJECT_STATE):
//   · El formato lo pone la familia: el separador se detecta, no se declara.
//   · El trabajo del usuario no se pierde jamás — por eso cada línea tiene id
//     estable y nada se reescribe al comprar.
//   · La unidad es la LÍNEA, no la lista. Anotar nunca es "hacer una lista".
//   · Al comprar la libreta no se vacía: se RESUELVE. Lo comprado se va; lo que
//     no, se queda con la marca de por qué sigue ahí.

export type OrigenLinea = "escrita" | "pegada" | "captura" | "menu";

export type Linea = {
  id: string;
  texto: string;
  ts: number;
  origen: OrigenLinea;
  // Solo la trae lo leído de una captura: es lo que permite explicar su monto
  // sin preguntar nada. El texto libre nunca sabe cuánto.
  cantidad?: number;
  unidad?: "kg" | "un";
  // Sobrevivió a una compra anterior. Se dice en lápiz, sin fecha y sin reproche.
  quedo?: boolean;
};

export type Libreta = { version: 1; lineas: Linea[] };

export const libretaVacia = (): Libreta => ({ version: 1, lineas: [] });

let contador = 0;
const nuevoId = () => `l${Date.now().toString(36)}${(contador++).toString(36)}`;

// El separador se detecta, no se declara: saltos de línea, comas, punto y coma,
// guiones y viñetas. Todo mezclado es válido — si la familia tiene que pensar
// CÓMO escribirlo, ya perdimos.
//
// Lo que NO se toca, a propósito: mayúsculas, tildes, faltas, emojis y el
// «mami» del principio. Su desorden es suyo y sobrevive tal cual hasta el
// momento de comprar.
export function partir(texto: string): string[] {
  return (texto ?? "")
    .split(/[\n;]+|,(?![^(]*\))/g)
    .map((t) => t.replace(/^\s*(?:[-–—*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

export function anotar(
  libreta: Libreta,
  texto: string,
  origen: OrigenLinea = "escrita",
  extra?: { cantidad?: number; unidad?: "kg" | "un" }
): Libreta {
  const nuevas = partir(texto).map((t) => ({
    id: nuevoId(),
    texto: t,
    ts: Date.now(),
    origen,
    ...extra,
  }));
  if (nuevas.length === 0) return libreta;
  return { ...libreta, lineas: [...libreta.lineas, ...nuevas] };
}

export function quitar(libreta: Libreta, id: string): Libreta {
  return { ...libreta, lineas: libreta.lineas.filter((l) => l.id !== id) };
}

export function editar(libreta: Libreta, id: string, texto: string): Libreta {
  const limpio = texto.trim();
  if (!limpio) return quitar(libreta, id);
  return {
    ...libreta,
    lineas: libreta.lineas.map((l) => (l.id === id ? { ...l, texto: limpio } : l)),
  };
}

// Deshacer un pegado: quita el último bloque que entró junto. Nunca borra nada
// que la familia escribiera a mano.
export function deshacerUltimoBloque(libreta: Libreta, cuantas: number): Libreta {
  if (cuantas <= 0) return libreta;
  return { ...libreta, lineas: libreta.lineas.slice(0, -cuantas) };
}

// Comprar no vacía la libreta: la resuelve.
//
// Se va lo que efectivamente se compró; sobrevive lo que no —lo agotado, lo que
// se quitó del carrito, lo que quedó pendiente de cantidad— marcado con `quedo`
// para que la interfaz pueda decir "quedó de la semana pasada" sin usar fechas.
// La distancia entre lo que pensó y lo que compró es la señal más limpia que
// tenemos, y se pierde si aquí borramos todo.
export function resolverCompra(libreta: Libreta, compradas: string[]): Libreta {
  const fuera = new Set(compradas.map((t) => t.trim().toLowerCase()));
  return {
    ...libreta,
    lineas: libreta.lineas
      .filter((l) => !fuera.has(l.texto.trim().toLowerCase()))
      .map((l) => ({ ...l, quedo: true })),
  };
}

// Lo que se manda al motor. Una línea es una línea: no se agrupa, no se ordena
// y no se reescribe.
export function aPedidos(libreta: Libreta) {
  return libreta.lineas.map((l) => ({
    texto: l.texto,
    ...(l.cantidad != null ? { cantidad: l.cantidad, unidad: l.unidad } : {}),
  }));
}

export function origenLegible(origen: OrigenLinea): string {
  return origen === "pegada"
    ? "de lo que pegaste"
    : origen === "captura"
      ? "de la captura"
      : origen === "menu"
        ? "del menú"
        : "lo escribiste tú";
}
