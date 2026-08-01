// Ciclo 5 — Dónde vive el perfil. La ÚNICA pieza que sabe de almacenamiento.
//
// Decisión de la PO: hoy localStorage, sin autenticación. Pero el diseño del
// perfil es independiente del mecanismo: `RepositorioPerfil` es un puerto de
// dos métodos. Migrar a backend cuando el producto esté validado = escribir un
// `RepositorioApi` que cumpla esta interfaz. Ni lib/preferencias.ts ni la UI
// cambian una línea.
//
// Por eso la interfaz es async aunque localStorage sea síncrono: el día que sea
// red, nadie tiene que refactorizar.

import { perfilVacio, type Perfil } from "@/lib/preferencias";
import { historialVacio, registrar, type Hecho, type Historial } from "@/lib/historial";

export interface RepositorioPerfil {
  cargar(): Promise<Perfil>;
  guardar(perfil: Perfil): Promise<void>;
  borrar(): Promise<void>;
}

const CLAVE = "supercarrito.perfil.v1";

// Un perfil corrupto o de una versión futura no debe romper la compra: se
// descarta y se empieza de cero. El activo importa, pero la compra importa más.
function sanear(crudo: string | null): Perfil {
  if (!crudo) return perfilVacio();
  try {
    const p = JSON.parse(crudo) as Perfil;
    if (p?.version !== 1 || typeof p.preferencias !== "object") return perfilVacio();
    return { ...perfilVacio(), ...p, metricas: { ...perfilVacio().metricas, ...p.metricas } };
  } catch {
    return perfilVacio();
  }
}

export class RepositorioLocalStorage implements RepositorioPerfil {
  async cargar(): Promise<Perfil> {
    if (typeof window === "undefined") return perfilVacio(); // SSR
    return sanear(window.localStorage.getItem(CLAVE));
  }

  async guardar(perfil: Perfil): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(perfil));
    } catch {
      // Cuota llena o modo privado: preferimos perder el aprendizaje antes que
      // romper la compra en curso.
    }
  }

  async borrar(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(CLAVE);
  }
}

// Para tests y para SSR. Misma interfaz, cero dependencias del navegador.
export class RepositorioMemoria implements RepositorioPerfil {
  private perfil: Perfil = perfilVacio();
  async cargar() {
    return this.perfil;
  }
  async guardar(p: Perfil) {
    this.perfil = p;
  }
  async borrar() {
    this.perfil = perfilVacio();
  }
}

// El resto de la app importa SOLO esto. Cambiar de almacenamiento = cambiar
// esta línea.
export const repositorioPerfil: RepositorioPerfil = new RepositorioLocalStorage();

// --- Historial de hechos -----------------------------------------------------
// Mismo puerto, misma disciplina: la app nunca toca localStorage directamente.
// Append-only por contrato: `agregar`, no `guardar`. No se edita ni se borra un
// hecho; un hecho ocurrió.

export interface RepositorioHistorial {
  cargar(): Promise<Historial>;
  agregar(hecho: Hecho): Promise<void>;
}

const CLAVE_HISTORIAL = "supercarrito.historial.v1";

export class HistorialLocalStorage implements RepositorioHistorial {
  async cargar(): Promise<Historial> {
    if (typeof window === "undefined") return historialVacio();
    try {
      const crudo = window.localStorage.getItem(CLAVE_HISTORIAL);
      if (!crudo) return historialVacio();
      const h = JSON.parse(crudo) as Historial;
      if (h?.version !== 1 || !Array.isArray(h.hechos)) return historialVacio();
      return h;
    } catch {
      return historialVacio();
    }
  }

  async agregar(hecho: Hecho): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const actual = await this.cargar();
      window.localStorage.setItem(
        CLAVE_HISTORIAL,
        JSON.stringify(registrar(actual, hecho))
      );
    } catch {
      // Registrar un hecho nunca puede romper la compra en curso.
    }
  }
}

export const repositorioHistorial: RepositorioHistorial = new HistorialLocalStorage();
