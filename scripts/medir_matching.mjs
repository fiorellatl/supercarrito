// Ciclo 4 — "El termómetro de acierto".
// NO es código de producto ni una heurística de selección: es el INSTRUMENTO
// del experimento. Consulta el Top-5 real de Wong (VTEX) para cada ingrediente
// de data/ingredientes_muestra.json, guarda los candidatos crudos y genera una
// hoja de trabajo en Markdown para etiquetar a mano.
//
// Uso (desde un entorno con salida a www.wong.pe, p.ej. tu laptop en Perú):
//   node scripts/medir_matching.mjs
//
// Salidas:
//   data/medicion_c4_raw.json        <- candidatos crudos (evidencia)
//   data/medicion_c4_worksheet.md    <- tabla para etiquetar: clase + elegido
//
// Nota entornos con proxy: el fetch nativo de Node ignora HTTPS_PROXY salvo que
// se corra con NODE_USE_ENV_PROXY=1 (Node >= 22.21). En una laptop sin proxy no
// hace falta nada.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://www.wong.pe";
const TOP_N = 5;
const TIMEOUT_MS = 10000;
const PAUSA_MS = 400; // cortesía: no martillar el endpoint

// Diccionarios SOLO para pre-clasificar (acelerar el etiquetado humano).
// El humano confirma/corrige; no deciden nada del producto.
const CLASES = {
  utensilio: ["pinza", "tabla de", "cuchillo", "olla", "sarten", "sartén", "colador",
    "rallador", "molde", "cucharon", "cucharón", "bowl", "tupper", "envase", "recipiente",
    "exprimidor", "pelador", "batidor", "espatula", "espátula", "licuadora", "procesador",
    "set ", "kit ", "juego de", "vaso", "taza", "plato", "fuente", "bandeja"],
  limpieza: ["detergente", "lejia", "lejía", "jabon", "jabón", "limpiador", "desinfectante",
    "esponja", "lavavajilla", "lavavajillas", "ambientador", "quitamanchas", "cloro",
    "suavizante", "papel higienico", "papel higiénico", "servilleta"],
  mascota: ["perro", "gato", "mascota", "dog", "cat", "purina", "ricocan", "mimaskot",
    "canino", "felino", "alimento para perro", "alimento para gato"],
};

function preclasificar(nombre = "") {
  const n = nombre.toLowerCase();
  for (const [clase, kws] of Object.entries(CLASES)) {
    if (kws.some((k) => n.includes(k))) return clase;
  }
  return "alimento"; // por defecto; el humano baja a "otro" si aplica
}

async function topN(ingrediente) {
  const url = `${BASE}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(
    ingrediente
  )}&_from=0&_to=${TOP_N - 1}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.slice(0, TOP_N).map((p, i) => {
    const item = p.items?.[0];
    const oferta = item?.sellers?.[0]?.commertialOffer;
    return {
      pos: i + 1,
      nombre: p.productName ?? item?.name ?? "(sin nombre)",
      marca: p.brand ?? "",
      categoria_wong: (p.categories?.[0] ?? "").split("/").filter(Boolean).pop() ?? "",
      precio: typeof oferta?.Price === "number" ? oferta.Price : null,
      clase_auto: preclasificar(p.productName ?? item?.name ?? ""),
    };
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const lista = JSON.parse(
    await readFile(join(ROOT, "data/ingredientes_muestra.json"), "utf8")
  );
  const raw = [];
  let ok = 0, fail = 0;

  for (const { ingrediente, categoria, tipo } of lista) {
    try {
      const candidatos = await topN(ingrediente);
      raw.push({ ingrediente, categoria, tipo, candidatos });
      ok++;
      process.stdout.write(`✓ ${ingrediente} (${candidatos.length})\n`);
    } catch (e) {
      raw.push({ ingrediente, categoria, tipo, candidatos: [], error: String(e.message || e) });
      fail++;
      process.stdout.write(`✗ ${ingrediente} — ${e.message}\n`);
    }
    await sleep(PAUSA_MS);
  }

  await writeFile(join(ROOT, "data/medicion_c4_raw.json"), JSON.stringify(raw, null, 2));

  // Hoja de trabajo: una fila por candidato. Columnas a llenar a mano:
  //   clase  -> alimento | utensilio | limpieza | mascota | otro
  //   elegido-> "x" en el candidato que una persona que cocinará esa receta compraría
  let md = `# Ciclo 4 — Hoja de etiquetado (Top-${TOP_N} Wong)\n\n`;
  md += `Consultas OK: ${ok} · fallidas: ${fail} · generado: ${new Date().toISOString()}\n\n`;
  md += `Instrucciones: en cada bloque, corrige \`clase\` si la automática se equivocó y\n`;
  md += `pon \`x\` en \`elegido\` en el candidato correcto. Si NINGÚN candidato sirve,\n`;
  md += `deja \`elegido\` vacío en todos (eso también es un dato: fallo total).\n\n`;
  for (const row of raw) {
    md += `## ${row.ingrediente}  ·  _${row.categoria} / ${row.tipo}_\n\n`;
    if (row.error) { md += `> ⚠️ error de consulta: ${row.error}\n\n`; continue; }
    if (!row.candidatos.length) { md += `> (sin resultados)\n\n`; continue; }
    md += `| # | producto | marca | precio | clase (auto→corrige) | elegido |\n`;
    md += `|---|----------|-------|--------|----------------------|---------|\n`;
    for (const c of row.candidatos) {
      md += `| ${c.pos} | ${c.nombre} | ${c.marca} | ${c.precio ?? "—"} | ${c.clase_auto} |   |\n`;
    }
    md += `\n`;
  }
  await writeFile(join(ROOT, "data/medicion_c4_worksheet.md"), md);

  console.log(`\nListo. OK ${ok} / fallidas ${fail}.`);
  console.log("→ data/medicion_c4_raw.json");
  console.log("→ data/medicion_c4_worksheet.md (etiquétala y me la devuelves)");
}

main().catch((e) => { console.error(e); process.exit(1); });
