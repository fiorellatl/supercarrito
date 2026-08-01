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

const UMBRAL = 40;
const MAX_CANDIDATOS = 6; // 1 elegido + hasta 5 alternativas para corregir

function aProductoWong(ingrediente: string, p: ProductoCatalogo): ProductoWong {
  return {
    ingrediente,
    encontrado: true,
    sku: p.sku,
    nombre: p.nombre,
    marca: p.marca,
    imagen: p.imagen,
    precio: p.precio,
    // El catálogo ficticio es todo por pieza. Cuando haga falta probar el
    // camino de los pesables sin red, se añade aquí un producto "x kg".
    unidadVenta: "un",
    cantidadMinima: 1,
    presentacion: p.presentacion,
    categoria: p.categoria,
    disponible: p.disponible,
    url: p.url,
    proveedor: "fake",
  };
}

export function buscarEnFakeWong(ingrediente: string): ProductoWong {
  // Ciclo 5: ya no basta con el mejor. Necesitamos el ranking completo para que
  // el usuario pueda corregirnos (y para que aprendamos de esa corrección).
  const ranking = CATALOGO.map((p) => ({ p, score: puntuar(ingrediente, p) }))
    .filter((r) => r.score >= UMBRAL)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATOS);

  if (ranking.length === 0) {
    return { ingrediente, encontrado: false, motivo: "sin resultados" };
  }

  const [mejor, ...resto] = ranking.map((r) => aProductoWong(ingrediente, r.p));
  return { ...mejor, alternativas: resto };
}
