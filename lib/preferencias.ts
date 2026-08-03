// Ciclo 5 — El modelo conceptual del ACTIVO del producto: la memoria de compra
// de una familia.
//
// Este archivo es PURO: no sabe de React, ni de localStorage, ni de red, ni de
// Wong. Solo tipos y funciones. Esa es la condición para poder migrar el perfil
// a un backend sin tocar nada de esta lógica (ver lib/perfil-store.ts).

import type { ProductoWong, UnidadVenta } from "@/lib/catalog";

// --- Las dimensiones que aprendemos -----------------------------------------
// marca · formato · sensibilidad al precio · sustituciones · frecuencia
// y la quinta, que decide cuando las demás se contradicen: PRIORIDAD.

export type Eje = "disponibilidad" | "marca" | "formato" | "precio";

// Qué pesa más cuando hay conflicto. Ej. ["marca","formato","precio"] = "quiero
// Gloria aunque sea más cara"; ["precio","marca"] = "lo más barato, y si empatan
// que sea Gloria". Se evalúa en orden: cada eje filtra candidatos, y si un eje
// dejaría cero candidatos se salta (es una preferencia, no un requisito).
export const PRIORIDAD_POR_DEFECTO: Eje[] = ["disponibilidad", "marca", "formato", "precio"];

export type SensibilidadPrecio = "mas_barato" | "marca_fija" | "sin_preferencia";

export type Preferencia = {
  ingrediente: string; // clave canónica ("leche")
  marca?: string;
  formato?: string; // presentación habitual ("1 L", "5 kg")
  sensibilidadPrecio?: SensibilidadPrecio;
  sustitucionesAceptadas?: string[]; // marcas OK si falta la preferida
  frecuenciaDias?: number; // aún no se aprende (ciclo 9)
  prioridad: Eje[];

  // Cuánto compra esta familia de este ingrediente, en la unidad de venta del
  // producto. Es la única dimensión que hoy SÍ preguntamos, y solo cuando el
  // producto se vende al peso y no tenemos la respuesta: sin ella no podríamos
  // calcular un total honesto. Una vez respondida, no se vuelve a preguntar.
  cantidadHabitual?: number;
  // En qué unidad se aprendió. Sin esto, "0.5" es un número sin mundo: no se
  // puede escribir como "500 g" ni saber si sirve para el producto de hoy.
  unidadHabitual?: UnidadVenta;

  skuElegido?: string;
  vecesConfirmada: number; // 3 = alta confianza ("deja de preguntar")
  actualizado: string; // ISO
};

export type Metricas = {
  correcciones: number; // señal capturada
  preferenciasAprendidas: number; // indicador 1 del ciclo
  preguntasEvitadas: number; // indicador 2 del ciclo ⭐
};

export type Perfil = {
  version: 1;
  preferencias: Record<string, Preferencia>;
  metricas: Metricas;
};

export function perfilVacio(): Perfil {
  return {
    version: 1,
    preferencias: {},
    metricas: { correcciones: 0, preferenciasAprendidas: 0, preguntasEvitadas: 0 },
  };
}

// Clave canónica: "Leche " y "leche" son el mismo ingrediente.
export function clave(ingrediente: string): string {
  return ingrediente
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function preferenciaDe(perfil: Perfil, ingrediente: string): Preferencia | undefined {
  return perfil.preferencias[clave(ingrediente)];
}

export function confianza(p: Preferencia): "baja" | "alta" {
  return p.vecesConfirmada >= 3 ? "alta" : "baja";
}

// --- Elegir con el perfil ----------------------------------------------------
// El corazón del ciclo: dados los candidatos de Wong y lo que sabemos de la
// familia, ¿cuál habría elegido ella? Sin perfil, se respeta el orden del
// catálogo (matching). Con perfil, manda el perfil.

const mismaMarca = (a?: string, b?: string) =>
  !!a && !!b && clave(a) === clave(b);

function filtrar(cands: ProductoWong[], eje: Eje, p: Preferencia): ProductoWong[] {
  switch (eje) {
    case "disponibilidad":
      return cands.filter((c) => c.disponible !== false);
    case "marca": {
      const aceptadas = [p.marca, ...(p.sustitucionesAceptadas ?? [])].filter(Boolean);
      if (aceptadas.length === 0) return cands;
      return cands.filter((c) => aceptadas.some((m) => mismaMarca(m, c.marca)));
    }
    case "formato":
      if (!p.formato) return cands;
      return cands.filter((c) => clave(c.presentacion ?? "") === clave(p.formato!));
    case "precio": {
      if (p.sensibilidadPrecio !== "mas_barato") return cands;
      const min = Math.min(...cands.map((c) => c.precio ?? Infinity));
      return cands.filter((c) => (c.precio ?? Infinity) === min);
    }
  }
}

export type Eleccion = {
  elegido: ProductoWong;
  porPerfil: boolean; // true = lo eligió la familia, no el catálogo
  ejesAplicados: Eje[]; // para QA y para explicárselo al usuario
};

export function elegir(
  candidatos: ProductoWong[],
  pref: Preferencia | undefined
): Eleccion {
  const vivos = candidatos.filter((c) => c.encontrado);
  if (vivos.length === 0) {
    return { elegido: candidatos[0], porPerfil: false, ejesAplicados: [] };
  }
  if (!pref) return { elegido: vivos[0], porPerfil: false, ejesAplicados: [] };

  // El SKU exacto que la familia ya eligió antes gana sobre cualquier heurística.
  const exacto = vivos.find((c) => pref.skuElegido && c.sku === pref.skuElegido);
  if (exacto) return { elegido: exacto, porPerfil: true, ejesAplicados: ["marca"] };

  let restantes = vivos;
  const ejesAplicados: Eje[] = [];
  for (const eje of pref.prioridad ?? PRIORIDAD_POR_DEFECTO) {
    const filtrados = filtrar(restantes, eje, pref);
    // Un eje que deja cero candidatos se ignora: es preferencia, no requisito.
    if (filtrados.length > 0 && filtrados.length < restantes.length) {
      ejesAplicados.push(eje);
      restantes = filtrados;
    } else if (filtrados.length > 0) {
      restantes = filtrados;
    }
  }

  return {
    elegido: restantes[0],
    porPerfil: ejesAplicados.length > 0,
    ejesAplicados,
  };
}

// --- Aprender ----------------------------------------------------------------
// Única fuente de señal del ciclo 5: el usuario corrige lo que elegimos.
// Sin preguntas. Fricción cero. Cada corrección es un depósito en el activo.

export function aprenderDeCorreccion(
  perfil: Perfil,
  ingrediente: string,
  elegido: ProductoWong,
  candidatos: ProductoWong[]
): Perfil {
  const k = clave(ingrediente);
  const previa = perfil.preferencias[k];
  const esNueva = !previa;

  // ¿Eligió el más barato de lo que le ofrecimos? Es señal de sensibilidad al
  // precio. Solo la damos por buena cuando se repite (ver vecesConfirmada).
  const precios = candidatos.map((c) => c.precio ?? Infinity);
  const eraElMasBarato =
    precios.length > 1 && (elegido.precio ?? Infinity) === Math.min(...precios);

  const cambioDeMarca = !!previa && !mismaMarca(previa.marca, elegido.marca);

  const nueva: Preferencia = {
    ingrediente: k,
    marca: elegido.marca ?? previa?.marca,
    formato: elegido.presentacion ?? previa?.formato,
    // Si cambió de marca buscando el más barato, el precio manda sobre la marca.
    sensibilidadPrecio: eraElMasBarato
      ? "mas_barato"
      : elegido.marca
        ? "marca_fija"
        : previa?.sensibilidadPrecio,
    // La marca que abandona sigue siendo aceptable como sustituta.
    sustitucionesAceptadas: cambioDeMarca && previa?.marca
      ? [...new Set([...(previa.sustitucionesAceptadas ?? []), previa.marca])]
      : previa?.sustitucionesAceptadas,
    frecuenciaDias: previa?.frecuenciaDias,
    prioridad: eraElMasBarato
      ? ["disponibilidad", "precio", "marca", "formato"]
      : (previa?.prioridad ?? PRIORIDAD_POR_DEFECTO),
    skuElegido: elegido.sku,
    // Repetir el mismo SKU sube la confianza; cambiar de idea la reinicia.
    vecesConfirmada:
      previa && previa.skuElegido === elegido.sku ? previa.vecesConfirmada + 1 : 1,
    actualizado: new Date().toISOString(),
  };

  return {
    ...perfil,
    preferencias: { ...perfil.preferencias, [k]: nueva },
    metricas: {
      ...perfil.metricas,
      correcciones: perfil.metricas.correcciones + 1,
      preferenciasAprendidas:
        perfil.metricas.preferenciasAprendidas + (esNueva ? 1 : 0),
    },
  };
}

// La respuesta a "¿cuánto compras normalmente?". Es aprendizaje EXPLÍCITO: la
// única pregunta que hacemos, y solo cuando sin ella no podríamos mostrar un
// monto explicable. Se guarda para no volver a hacerla nunca.
export function aprenderCantidad(
  perfil: Perfil,
  ingrediente: string,
  cantidad: number,
  unidad?: UnidadVenta
): Perfil {
  const k = clave(ingrediente);
  const previa = perfil.preferencias[k];
  const esNueva = !previa;

  const nueva: Preferencia = {
    ...(previa ?? {
      ingrediente: k,
      prioridad: PRIORIDAD_POR_DEFECTO,
      vecesConfirmada: 0,
    }),
    ingrediente: k,
    cantidadHabitual: cantidad,
    unidadHabitual: unidad ?? previa?.unidadHabitual,
    actualizado: new Date().toISOString(),
  };

  return {
    ...perfil,
    preferencias: { ...perfil.preferencias, [k]: nueva },
    metricas: {
      ...perfil.metricas,
      preferenciasAprendidas:
        perfil.metricas.preferenciasAprendidas + (esNueva ? 1 : 0),
    },
  };
}

// Indicador 2 ⭐ — "cada compra debería requerir menos decisiones que la anterior".
// Cada vez que el perfil resuelve una ambigüedad, es una pregunta que NO hicimos.
export function contarPreguntasEvitadas(perfil: Perfil, cuantas: number): Perfil {
  if (cuantas <= 0) return perfil;
  return {
    ...perfil,
    metricas: {
      ...perfil.metricas,
      preguntasEvitadas: perfil.metricas.preguntasEvitadas + cuantas,
    },
  };
}
