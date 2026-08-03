// El carrito EN CURSO: lo que la familia tiene delante, ya emparejado y con sus
// decisiones encima (cuánto lleva, qué dejó anotado).
//
// ⚠️ No confundir con `lib/cart.ts`, que es la tubería del SERVIDOR —texto →
// matcher → producto— y ni siquiera se puede importar desde el navegador. Este
// archivo es el otro extremo: el RESULTADO de esa tubería, una vez que ya
// ocurrió.
//
// POR QUÉ EXISTE, y es la razón entera (2026-08-03):
// hasta hoy este carrito vivía SOLO en memoria de React. Al volver a la
// aplicación desaparecía, y la única forma de reconstruirlo era volver a pasar
// el texto de la libreta por el matcher:
//
//     texto → matcher → producto        ← lo que hacíamos, y estaba mal
//
// Eso rompía la promesa más básica del producto: un producto que la familia ya
// había visto —«Plátano Bellaco x kg»— podía volver siendo otro, porque se
// re-emparejaba desde cero contra un catálogo vivo. Y no hace falta que el
// matcher sea inestable para que ocurra: basta con que el Top-6 de hoy no traiga
// el SKU que ella eligió ayer, o con que exista ya una preferencia —se crea sola
// al responder «¿cuánto llevas?»— para que `elegir()` tome otro camino.
//
// La identidad de un producto NO se vuelve a deducir. Se guarda.
//
// Lo único que caduca de un carrito es lo que depende de la tienda:
//
//     sku → simulación de la tienda → precio y stock de hoy
//
// y eso ya lo hace la pantalla por SKU, sin tocar la identidad.

import type { ProductoWong } from "@/lib/catalog";
import { clave } from "@/lib/preferencias";

export type ItemResuelto = {
  ingrediente: string;
  candidatos: ProductoWong[];
  elegido: ProductoWong;
  porPerfil: boolean;
  cantidadPedida?: number;
  unidadPedida?: "kg" | "un";
  cantidadElegida?: number;
  fuera?: boolean; // "dejarlo anotado": sigue a la vista y no compra
};

export type CarritoGuardado = { version: 1; items: ItemResuelto[] };

// Un producto que la familia ya tiene delante no se vuelve a emparejar.
//
// De una búsqueda nueva solo entra lo que TODAVÍA NO ESTABA —las líneas que
// acaba de anotar—. Todo lo demás conserva su SKU, su nombre, su precio, la
// cantidad que ya decidió y su «lo dejé anotado». Cambiar cualquiera de esas
// cosas por nuestra cuenta es exactamente el fallo que este archivo existe para
// impedir.
//
// Y al revés: lo que ya no sale de la libreta desaparece del carrito. La libreta
// sigue mandando sobre QUÉ hay; lo que no se vuelve a decidir es CUÁL es.
export function conservarIdentidad(
  previos: ItemResuelto[] | null | undefined,
  frescos: ItemResuelto[]
): ItemResuelto[] {
  if (!previos || previos.length === 0) return frescos;
  const antes = new Map(previos.map((it) => [clave(it.ingrediente), it]));
  return frescos.map((f) => antes.get(clave(f.ingrediente)) ?? f);
}
