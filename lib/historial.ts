// El historial de compra: los HECHOS.
//
// Distinción que ordena el modelo (discusión del 2026-07-26):
//   · El historial es HECHO   — "el 12 de marzo escribió 'Leche Gloria' y no corrigió".
//   · El perfil es OPINIÓN    — "su marca de leche es Gloria".
// Los hechos no caducan ni se discuten. Las opiniones sí, y las nuestras van a
// cambiar muchas veces. Por eso guardamos los hechos desde ya: es barato ahora e
// imposible de recuperar después.
//
// ALCANCE DELIBERADO (decisión de la PO): historial SIMPLE y append-only.
// No hay reproyección, ni derivación del perfil desde aquí, ni migraciones. Eso
// se construirá cuando exista una segunda política que aplicar, no antes.
// Hoy esto solo escribe. Nadie lo lee todavía, y está bien.

// Los hechos se registran en el lenguaje de la FAMILIA (lo que escribió, la marca,
// el nombre, el precio), no en el del supermercado. Así el historial es portable
// a Plaza Vea o Tottus. El identificador del proveedor va aparte y aislado,
// como lo que es: un atajo desechable.
export type Proveniencia = { proveedor?: string; sku?: string };

export type Candidato = {
  nombre?: string;
  marca?: string;
  precio?: number;
};

export type Hecho =
  // Lo que el usuario dijo, y lo que le propusimos a cambio.
  | {
      tipo: "escribio";
      ts: string;
      texto: string;
      propuestas: {
        ingrediente: string;
        nombre?: string;
        marca?: string;
        precio?: number;
        porPerfil: boolean; // lo eligió su memoria, no el catálogo
        origen: Proveniencia;
      }[];
    }
  // Una corrección: nos dijo que preferíamos mal.
  | {
      tipo: "eligio";
      ts: string;
      ingrediente: string;
      nombre?: string;
      marca?: string;
      presentacion?: string;
      precio?: number;
      origen: Proveniencia;
      candidatos: Candidato[]; // entre qué opciones eligió (contexto de la decisión)
    };

export type Historial = {
  version: 1;
  hechos: Hecho[];
};

export function historialVacio(): Historial {
  return { version: 1, hechos: [] };
}

// Tope pragmático: localStorage tiene ~5 MB. Un historial que rompe la escritura
// sería peor que uno recortado. Cuando el historial viva en un backend, se quita.
export const MAX_HECHOS = 1000;

export function registrar(historial: Historial, hecho: Hecho): Historial {
  const hechos = [...historial.hechos, hecho];
  return {
    ...historial,
    hechos: hechos.length > MAX_HECHOS ? hechos.slice(-MAX_HECHOS) : hechos,
  };
}

export function ahora(): string {
  return new Date().toISOString();
}
