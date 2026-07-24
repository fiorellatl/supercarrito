// FakeWong: catálogo ficticio + motor de ranking heurístico (sin IA).
// Devuelve un ProductoWong idéntico al que devolverá VTEX el día de mañana.
import catalogo from "@/data/catalogo.json";
import type { ProductoWong } from "@/lib/catalog";

type ProductoCatalogo = {
  sku: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number;
  presentacion: string;
  disponible: boolean;
  imagen: string;
  url: string;
  keywords: string[];
  prioridad: number;
};

const CATALOGO = catalogo as ProductoCatalogo[];
const norm = (s: string) => s.toLowerCase().trim();

// Puntúa qué tan bien un producto responde a la búsqueda.
// Ej: "pollo" -> pollo fresco > pechuga > muslo > pollo entero.
function puntuar(query: string, p: ProductoCatalogo): number {
  const q = norm(query);
  const kws = p.keywords.map(norm);
  let score = 0;

  if (kws.includes(q)) {
    score += 100; // coincidencia exacta de palabra clave
  } else {
    for (const k of kws) {
      if (k.startsWith(q) || q.startsWith(k)) score = Math.max(score, 60);
      else if (k.includes(q) || q.includes(k)) score = Math.max(score, 40);
    }
  }

  if (norm(p.nombre).includes(q)) score += 20; // aparece en el nombre
  if (norm(p.categoria) === q) score += 15; // misma categoría
  if (kws.includes("fresco")) score += 8; // preferimos lo fresco
  score += (p.prioridad ?? 0) * 0.1; // desempate curado
  if (!p.disponible) score -= 1000; // agotados al fondo

  return score;
}

export function buscarEnFakeWong(ingrediente: string): ProductoWong {
  let mejor: ProductoCatalogo | null = null;
  let mejorScore = 0;

  for (const p of CATALOGO) {
    const s = puntuar(ingrediente, p);
    if (s > mejorScore) {
      mejorScore = s;
      mejor = p;
    }
  }

  if (!mejor || mejorScore < 40) {
    return { ingrediente, encontrado: false, motivo: "sin resultados" };
  }

  return {
    ingrediente,
    encontrado: true,
    sku: mejor.sku,
    nombre: mejor.nombre,
    marca: mejor.marca,
    imagen: mejor.imagen,
    precio: mejor.precio,
    presentacion: mejor.presentacion,
    categoria: mejor.categoria,
    disponible: mejor.disponible,
    url: mejor.url,
    proveedor: "fake",
  };
}
