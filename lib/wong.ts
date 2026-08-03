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
// Es seguro porque la degradación ya existe: si Wong falla —timeout, 403, 429,
// endpoint caído— se cae a FakeWong solo y la experiencia no se rompe. El riesgo
// de equivocarse hacia datos reales es cero; hacia datos ficticios, era enseñarle
// a una familia precios inventados sin que nadie se diera cuenta.

import { buscarEnFakeWong } from "@/lib/fakewong";
import { buscarEnWongVtex } from "@/lib/wongvtex";
import type { ProductoWong } from "@/lib/catalog";

export type { ProductoWong } from "@/lib/catalog";

const PROVIDER = (process.env.CATALOG_PROVIDER ?? "wong").toLowerCase();

export async function buscarEnWong(ingrediente: string): Promise<ProductoWong> {
  if (PROVIDER !== "wong") {
    return buscarEnFakeWong(ingrediente);
  }

  // Proveedor real, con degradación elegante ante cualquier fallo de Wong.
  try {
    return await buscarEnWongVtex(ingrediente);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[WongVTEX] "${ingrediente}" falló (${
          e instanceof Error ? e.message : "error"
        }). Degradando a FakeWong.`
      );
    }
    return { ...buscarEnFakeWong(ingrediente), degradado: true };
  }
}

export function proveedorActivo(): string {
  return PROVIDER;
}
