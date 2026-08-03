// Quién vive aquí. El modelo mínimo de identidad del producto.
//
// Decisión de la PO (2026-08-02): el producto necesita una entrada con identidad.
// Esto **revierte** el principio "ninguna pantalla aparece antes de la libreta":
// se acepta a conciencia, porque una familia que abre por primera vez no entiende
// qué es SuperCarrito mirando un folio en blanco.
//
// Lo que NO es, y es deliberado:
//   · No hay contraseña. No pedimos ni guardamos credenciales de nadie.
//   · No hay servidor todavía: esto vive en el navegador, como el perfil.
//   · No es un formulario de preferencias. Un nombre y nada más: pedir gustos
//     por adelantado es hacer trabajar a la familia por un beneficio que aún no
//     ha visto.
//
// El nombre sirve para dos cosas concretas y ninguna decorativa: saludar por su
// nombre al volver, y firmar el monograma de la casa.

export type Casa = {
  version: 1;
  nombre: string; // "Rosa", "los Torres", lo que ella escriba
  desde: number; // cuándo entró por primera vez
};

export const casaVacia = (): Casa => ({ version: 1, nombre: "", desde: 0 });

export function crearCasa(nombre: string): Casa {
  return { version: 1, nombre: nombre.trim(), desde: Date.now() };
}

export function tieneCasa(casa: Casa): boolean {
  return casa.nombre.trim().length > 0;
}

// Las iniciales para el monograma. "los Torres" -> "LT" · "Rosa" -> "R".
export function monograma(casa: Casa): string {
  const palabras = casa.nombre.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return "·";
  if (palabras.length === 1) return palabras[0].slice(0, 1).toUpperCase();
  return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
}

// Cómo la llamamos en pantalla. Si escribió "los Torres", saludar con
// "Hola, los Torres" suena raro: la preposición ya venía en su respuesta.
export function saludo(casa: Casa): string {
  return casa.nombre.trim();
}
