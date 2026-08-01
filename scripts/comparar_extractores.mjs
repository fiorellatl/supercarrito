// Instrumento de la decisión. NO es código de producto.
//
// Compara 2 modelos × 2 estrategias de prompt sobre las MISMAS capturas reales.
//
// La métrica que decide NO es la fidelidad del texto extraído, sino cuántos
// productos terminan encontrados en Wong: el objetivo del extractor no es hacer
// OCR perfecto, es construir el mejor carrito posible. Por eso cada línea
// extraída se busca de verdad en el catálogo, igual que haría el producto.
//
// Usa el mismo prompt y el mismo esquema que el producto
// (lib/extractor-contrato.mjs). Si se duplicaran, esto dejaría de decir la verdad.
//
// Uso:
//   export ANTHROPIC_API_KEY=...        (la clave NUNCA se escribe en un archivo)
//   node scripts/comparar_extractores.mjs
//   node scripts/comparar_extractores.mjs --modelos claude-sonnet-5
//
// Salidas:
//   data/comparacion_extractores.json  <- crudo, evidencia completa
//   data/comparacion_extractores.md    <- informe + hoja de patrones de error

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { cuerpoPeticion, ESTRATEGIAS } from "../lib/extractor-contrato.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CAPTURAS = join(ROOT, "data", "capturas-prueba");
const WONG = "https://www.wong.pe";

// Next carga .env.local solo; un script suelto de Node no. Lo cargamos a mano
// para que el instrumento funcione igual que la app. El valor entra en
// process.env y no se imprime, ni se escribe, ni se pasa por línea de comandos.
async function cargarEnvLocal() {
  const ruta = join(ROOT, ".env.local");
  if (!existsSync(ruta)) return;
  for (const linea of (await readFile(ruta, "utf8")).split(/\r?\n/)) {
    const m = linea.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue; // comentarios y líneas vacías
    const valor = m[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[m[1]]) process.env[m[1]] = valor; // el entorno real manda
  }
}

// Precios por millón de tokens (catálogo Anthropic, jul-2026). Sonnet 5 tiene
// precio de lanzamiento hasta el 2026-08-31; después pasa a 3/15.
const MODELOS = [
  { id: "claude-sonnet-5", entrada: 2.0, salida: 10.0, nota: "lanzamiento; lista 3/15" },
  { id: "claude-opus-4-8", entrada: 5.0, salida: 25.0, nota: "" },
];

const MEDIA = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

const arg = (n) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : null;
};
const modelosPedidos = arg("--modelos");
const modelos = modelosPedidos
  ? MODELOS.filter((m) => modelosPedidos.split(",").includes(m.id))
  : MODELOS;

const norm = (s) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[…]/g, "...")
    .replace(/\s+/g, " ")
    .trim();

const PARADAS = new Set(["de", "del", "la", "el", "los", "las", "en", "y", "con", "x", "un", "sin", "por"]);
const tokens = (s) => norm(s).split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !PARADAS.has(t));

// --- Wong: la misma búsqueda que hace el producto ----------------------------

async function buscarEnWong(termino) {
  const url = `${WONG}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(termino)}&_from=0&_to=0`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return { encontrado: false, motivo: `HTTP ${res.status}` };
    const data = await res.json();
    const p = Array.isArray(data) ? data[0] : null;
    const oferta = p?.items?.[0]?.sellers?.[0]?.commertialOffer;
    if (!p || typeof oferta?.Price !== "number" || oferta.Price <= 0) {
      return { encontrado: false, motivo: "sin resultados" };
    }
    return {
      encontrado: true,
      nombre: p.productName,
      marca: p.brand,
      precio: oferta.Price,
      unidad: p.items?.[0]?.measurementUnit ?? "un",
    };
  } catch (e) {
    return { encontrado: false, motivo: e.message };
  }
}

// ¿El producto que devolvió Wong se parece a lo que pedía la captura?
// Proxy automático: solapamiento de palabras significativas. NO sustituye al ojo
// humano — por eso el informe incluye la tabla completa para revisar a mano,
// igual que el termómetro del ciclo 4.
function pareceCorrecto(esperado, obtenido) {
  const e = tokens(esperado);
  const o = tokens(obtenido);
  if (e.length === 0 || o.length === 0) return false;
  const comunes = e.filter((t) => o.some((x) => x.startsWith(t) || t.startsWith(x)));
  return comunes.length / e.length >= 0.6;
}

// --- Evaluación de una corrida ------------------------------------------------

async function evaluar(esperadas, obtenidas) {
  const libres = obtenidas.map((l) => ({ l, usada: false }));
  const detalle = [];
  let emparejados = 0, textoExacto = 0, cantidadOk = 0;
  let enWong = 0, correctosEnWong = 0;

  for (const esp of esperadas) {
    const cand =
      libres.find((c) => !c.usada && norm(c.l.producto) === norm(esp.producto)) ??
      libres.find((c) => !c.usada && tokens(c.l.producto).some((t) => tokens(esp.producto).includes(t)));

    if (!cand) {
      detalle.push({ estado: "OMITIDO", esperado: esp.textoOriginal || "(sin nombre)", extraido: null });
      continue;
    }
    cand.usada = true;
    emparejados++;
    if (norm(cand.l.textoOriginal) === norm(esp.textoOriginal)) textoExacto++;
    if ((cand.l.cantidad ?? null) === (esp.cantidad ?? null)) cantidadOk++;

    // ⭐ Lo que de verdad decide: ¿construye el carrito correcto?
    const wong = await buscarEnWong(cand.l.producto);
    const ok = wong.encontrado && pareceCorrecto(esp.producto || esp.textoOriginal, wong.nombre);
    if (wong.encontrado) enWong++;
    if (ok) correctosEnWong++;

    detalle.push({
      estado: ok ? "OK" : wong.encontrado ? "WONG DUDOSO" : "WONG NO ENCUENTRA",
      esperado: esp.textoOriginal || "(sin nombre)",
      extraido: cand.l.producto,
      completado: norm(cand.l.producto) !== norm(esp.producto),
      wong: wong.nombre ?? wong.motivo,
      cantidad: `${esp.cantidad ?? "—"} vs ${cand.l.cantidad ?? "—"}`,
    });
    await new Promise((r) => setTimeout(r, 250)); // cortesía con el endpoint
  }

  const inventadas = libres.filter((c) => !c.usada).map((c) => c.l.producto);
  for (const t of inventadas) detalle.push({ estado: "INVENTADO", esperado: null, extraido: t });

  return {
    total: esperadas.length,
    emparejados,
    omitidos: esperadas.length - emparejados,
    inventados: inventadas.length,
    textoExacto,
    cantidadOk,
    enWong,
    correctosEnWong,
    detalle,
  };
}

async function extraer(cliente, modelo, estrategia, mediaType, base64) {
  const t0 = Date.now();
  const r = await cliente.messages.create(cuerpoPeticion(modelo, mediaType, base64, estrategia));
  const ms = Date.now() - t0;
  const texto = r.content.find((b) => b.type === "text")?.text ?? "";
  let datos = { reconocida: false, lineas: [] };
  try {
    datos = JSON.parse(texto);
  } catch {
    /* se reporta como 0 líneas */
  }
  return { ms, tokensEntrada: r.usage.input_tokens, tokensSalida: r.usage.output_tokens, ...datos };
}

async function main() {
  await cargarEnvLocal();

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error(
      "Falta la credencial. Ponla en .env.local como ANTHROPIC_API_KEY=... o\n" +
        "expórtala en tu terminal. Este script no la escribe en ningún sitio."
    );
    process.exit(1);
  }

  const verdad = JSON.parse(await readFile(join(CAPTURAS, "verdad.json"), "utf8"));
  const cliente = new Anthropic();
  const crudo = [];

  for (const captura of verdad.capturas) {
    const ruta = join(CAPTURAS, captura.archivo);
    if (!existsSync(ruta)) {
      console.error(`⚠️  Falta ${captura.archivo}; se salta.`);
      continue;
    }
    const base64 = (await readFile(ruta)).toString("base64");
    const mediaType = MEDIA[extname(captura.archivo).toLowerCase()] ?? "image/png";

    for (const m of modelos) {
      for (const est of Object.keys(ESTRATEGIAS)) {
        process.stdout.write(`\n${captura.archivo} · ${m.id} · ${est}… `);
        try {
          const res = await extraer(cliente, m.id, est, mediaType, base64);
          const notas = await evaluar(captura.lineas, res.lineas ?? []);
          const costo = (res.tokensEntrada / 1e6) * m.entrada + (res.tokensSalida / 1e6) * m.salida;
          crudo.push({ captura: captura.archivo, modelo: m.id, estrategia: est, res, notas, costo });
          console.log(
            `Wong ${notas.correctosEnWong}/${notas.total} · texto ${notas.textoExacto} · inventados ${notas.inventados} · ${res.ms} ms · US$${costo.toFixed(4)}`
          );
        } catch (e) {
          console.log(`ERROR: ${e.message}`);
          crudo.push({ captura: captura.archivo, modelo: m.id, estrategia: est, error: e.message });
        }
      }
    }
  }

  await writeFile(join(ROOT, "data/comparacion_extractores.json"), JSON.stringify(crudo, null, 2));

  // --- Informe ---
  let md = `# Comparación de extractores — modelo × estrategia\n\n`;
  md += `Generado: ${new Date().toISOString()}\n\n`;
  md += `Mismo prompt base, mismo esquema y \`thinking\` desactivado en todos los casos.\n`;
  md += `Sin eso la comparación no sería justa: Opus omite el pensamiento por defecto y Sonnet lo activa.\n\n`;
  md += `**La métrica que decide es "productos correctos en Wong"**, no la fidelidad del texto.\n\n`;

  md += `## Resumen\n\n`;
  md += `| Modelo | Estrategia | ✅ Correctos en Wong | Texto exacto | Cantidad OK | Inventados | Omitidos | Tiempo medio | Costo/captura |\n`;
  md += `|---|---|---|---|---|---|---|---|---|\n`;

  for (const m of modelos) {
    for (const est of Object.keys(ESTRATEGIAS)) {
      const filas = crudo.filter((c) => c.modelo === m.id && c.estrategia === est && !c.error);
      if (!filas.length) {
        md += `| \`${m.id}\` | ${est} | — sin datos — | | | | | | |\n`;
        continue;
      }
      const s = (f) => filas.reduce((a, c) => a + f(c), 0);
      const total = s((c) => c.notas.total);
      const pct = ((s((c) => c.notas.correctosEnWong) / total) * 100).toFixed(0);
      md += `| \`${m.id}\` | ${est} | **${s((c) => c.notas.correctosEnWong)}/${total} (${pct}%)** `;
      md += `| ${s((c) => c.notas.textoExacto)}/${total} `;
      md += `| ${s((c) => c.notas.cantidadOk)}/${total} `;
      md += `| ${s((c) => c.notas.inventados)} `;
      md += `| ${s((c) => c.notas.omitidos)} `;
      md += `| ${Math.round(s((c) => c.res.ms) / filas.length)} ms `;
      md += `| US$${(s((c) => c.costo) / filas.length).toFixed(4)} |\n`;
    }
  }

  md += `\n> Costo con el precio efectivo de hoy. Sonnet 5 está en precio de lanzamiento `;
  md += `(US$2/US$10 por millón de tokens) hasta el 2026-08-31; después US$3/US$15. Opus 4.8: US$5/US$25.\n`;

  md += `\n## Patrones de error\n\n`;
  md += `Lo que importa no es el porcentaje sino QUÉ falla cada combinación.\n\n`;
  for (const c of crudo.filter((x) => !x.error)) {
    const fallos = c.notas.detalle.filter((d) => d.estado !== "OK");
    md += `### ${c.captura} · \`${c.modelo}\` · ${c.estrategia}\n\n`;
    if (!fallos.length) {
      md += `Sin fallos.\n\n`;
      continue;
    }
    md += `| estado | esperado | extraído | ¿completó? | Wong devolvió |\n|---|---|---|---|---|\n`;
    for (const d of fallos) {
      md += `| ${d.estado} | ${d.esperado ?? "—"} | ${d.extraido ?? "—"} | ${d.completado ? "sí" : "no"} | ${d.wong ?? "—"} |\n`;
    }
    md += `\n`;
  }

  await writeFile(join(ROOT, "data/comparacion_extractores.md"), md);
  console.log(`\n\nListo.\n→ data/comparacion_extractores.json\n→ data/comparacion_extractores.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
