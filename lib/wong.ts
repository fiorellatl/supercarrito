// Conector de Wong usando la API pública de VTEX.
// Endpoint: /api/catalog_system/pub/products/search?ft=<texto>
// Devuelve JSON estructurado: no scrapeamos el DOM.

import wongMock from "@/data/wong-mock.json";

const BASE = "https://www.wong.pe";

// Modo demo: en entornos sin acceso a Wong (ej. este sandbox) usamos datos de
// ejemplo. En tu laptop, sin SUPERCARRITO_MOCK, siempre pega a Wong real.
const MOCK = process.env.SUPERCARRITO_MOCK === "1";
const MOCK_CATALOGO = wongMock as Record<string, { nombre: string; precio: number }>;

function buscarEnMock(ingrediente: string): ProductoWong {
  const hit = MOCK_CATALOGO[ingrediente.toLowerCase()];
  if (!hit) return { ingrediente, encontrado: false, motivo: "sin resultados (mock)" };
  return { ingrediente, encontrado: true, nombre: hit.nombre, precio: hit.precio };
}

export type ProductoWong = {
  ingrediente: string;
  encontrado: boolean;
  nombre?: string;
  precio?: number; // en soles
  imagen?: string;
  link?: string;
  motivo?: string; // por qué no se encontró (para QA / debug)
};

// La respuesta de VTEX es un array de productos. Solo tocamos lo que necesitamos.
type VtexOffer = { Price?: number; IsAvailable?: boolean };
type VtexSeller = { commertialOffer?: VtexOffer };
type VtexItem = { images?: { imageUrl?: string }[]; sellers?: VtexSeller[] };
type VtexProduct = {
  productName?: string;
  linkText?: string;
  items?: VtexItem[];
};

export async function buscarEnWong(ingrediente: string): Promise<ProductoWong> {
  if (MOCK) return buscarEnMock(ingrediente);

  const url = `${BASE}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(
    ingrediente
  )}&_from=0&_to=0`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // No queremos que un supermercado lento cuelgue el chat.
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return { ingrediente, encontrado: false, motivo: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as VtexProduct[];

    if (!Array.isArray(data) || data.length === 0) {
      return { ingrediente, encontrado: false, motivo: "sin resultados" };
    }

    return extraerPrimero(ingrediente, data[0]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error de red";
    return { ingrediente, encontrado: false, motivo: msg };
  }
}

// Extrae nombre + precio del primer producto. Exportada para poder testear
// la lógica sin depender de la red.
export function extraerPrimero(
  ingrediente: string,
  p: VtexProduct
): ProductoWong {
  const item = p.items?.[0];
  const oferta = item?.sellers?.[0]?.commertialOffer;
  const precio = oferta?.Price;

  if (typeof precio !== "number" || precio <= 0) {
    return { ingrediente, encontrado: false, motivo: "sin precio" };
  }

  return {
    ingrediente,
    encontrado: true,
    nombre: p.productName ?? ingrediente,
    precio,
    imagen: item?.images?.[0]?.imageUrl,
    link: p.linkText ? `${BASE}/${p.linkText}/p` : undefined,
  };
}
