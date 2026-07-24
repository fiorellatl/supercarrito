// Dispatcher de catálogo. El resto del sistema importa SOLO de aquí y nunca
// sabe qué proveedor está activo.
//
//   CATALOG_PROVIDER=fake   -> FakeWong (catálogo ficticio, siempre disponible)
//   CATALOG_PROVIDER=wong   -> WongVTEX (datos reales); si falla, degrada a FakeWong
//
// Por defecto usamos "fake" para no depender de la red. En producción (Netlify)
// pon CATALOG_PROVIDER=wong para datos reales; la degradación evita que se rompa.

import { buscarEnFakeWong } from "@/lib/fakewong";
import { buscarEnWongVtex } from "@/lib/wongvtex";
import type { ProductoWong } from "@/lib/catalog";

export type { ProductoWong } from "@/lib/catalog";

const PROVIDER = (process.env.CATALOG_PROVIDER ?? "fake").toLowerCase();

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
