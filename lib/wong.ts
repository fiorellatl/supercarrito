// Dispatcher de catálogo. El resto del sistema importa SOLO de aquí y nunca
// sabe qué proveedor está activo.
//
//   CATALOG_PROVIDER=wong   -> WongVTEX (datos reales). **Es el defecto.**
//   CATALOG_PROVIDER=fake   -> FakeWong (catálogo ficticio, sin red ni costo)
//
// El defecto es `wong` desde el 2026-08-02, y es una decisión, no una comodidad:
// antes había que acordarse de poner la variable en el panel de Netlify, así que
// "producción usa datos reales" dependía de la memoria de una persona. Ahora es
// verdad por construcción, y ponerlo en fake exige decirlo a propósito.
//
// Si Wong falla —timeout, 403, 429, endpoint caído— NO se rellena con el
// catálogo ficticio (2026-11-26). Hasta entonces se caía a FakeWong en silencio,
// y una familia podía ver productos y precios inventados como si fueran de Wong,
// con un enlace de SKUs que no existen. Eso rompe la regla que sostiene todo el
// producto: nada de inventar. Ahora la línea vuelve «no encontrada» y marcada
// `degradado`, para que la pantalla diga que Wong no contestó y la deje anotada.
//
// FakeWong sigue existiendo para desarrollar y hacer demos sin red, pero solo
// cuando se pide a propósito: CATALOG_PROVIDER=fake.

import { buscarEnFakeWong } from "@/lib/fakewong";
import { buscarEnWongVtex } from "@/lib/wongvtex";
import type { ProductoWong } from "@/lib/catalog";
import { CADENA_POR_DEFECTO, type Cadena } from "@/lib/cadenas";

export type { ProductoWong } from "@/lib/catalog";

const PROVIDER = (process.env.CATALOG_PROVIDER ?? "wong").toLowerCase();

export async function buscarEnWong(
  ingrediente: string,
  cadena: Cadena = CADENA_POR_DEFECTO
): Promise<ProductoWong> {
  if (PROVIDER !== "wong") {
    return buscarEnFakeWong(ingrediente);
  }

  // Proveedor real. Ante cualquier fallo, se dice; no se inventa.
  try {
    return await buscarEnWongVtex(ingrediente, cadena);
  } catch (e) {
    console.warn(
      `[${cadena.nombre}] "${ingrediente}" falló (${e instanceof Error ? e.message : "error"}).`
    );
    return {
      ingrediente,
      encontrado: false,
      motivo: `${cadena.nombre} no respondió`,
      proveedor: cadena.id,
      degradado: true,
    };
  }
}

export function proveedorActivo(): string {
  return PROVIDER;
}
