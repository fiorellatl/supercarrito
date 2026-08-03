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
import { libretaVacia, type Libreta } from "@/lib/libreta";
import { casaVacia, type Casa } from "@/lib/casa";

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

// --- La libreta --------------------------------------------------------------
// Mismo puerto, misma disciplina. Aquí importa más que en ningún otro sitio:
// "el trabajo del usuario no se pierde jamás" (§4) deja de ser una intención de
// diseño y pasa a ser esta clase. Se guarda en cada cambio, no al salir.

export interface RepositorioLibreta {
  cargar(): Promise<Libreta>;
  guardar(libreta: Libreta): Promise<void>;
}

const CLAVE_LIBRETA = "supercarrito.libreta.v1";

export class LibretaLocalStorage implements RepositorioLibreta {
  async cargar(): Promise<Libreta> {
    if (typeof window === "undefined") return libretaVacia();
    try {
      const crudo = window.localStorage.getItem(CLAVE_LIBRETA);
      if (!crudo) return libretaVacia();
      const l = JSON.parse(crudo) as Libreta;
      if (l?.version !== 1 || !Array.isArray(l.lineas)) return libretaVacia();
      return l;
    } catch {
      return libretaVacia();
    }
  }

  async guardar(libreta: Libreta): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CLAVE_LIBRETA, JSON.stringify(libreta));
    } catch {
      // Nada que hacer, pero tampoco se rompe lo que está en pantalla: la
      // familia sigue viendo su texto aunque no hayamos podido persistirlo.
    }
  }
}

export const repositorioLibreta: RepositorioLibreta = new LibretaLocalStorage();

// --- Las compras cerradas ----------------------------------------------------
// Lo mínimo para que "Casa" sea real y no una maqueta: qué se compró, cuándo y
// por cuánto, con la multiplicación de cada línea conservada. Append-only como
// el historial — una compra ocurrió.

export type CompraCerrada = {
  ts: number;
  total: number;
  lineas: { nombre: string; cuenta: string; monto: number }[];
};

export interface RepositorioCompras {
  cargar(): Promise<CompraCerrada[]>;
  agregar(compra: CompraCerrada): Promise<void>;
}

const CLAVE_COMPRAS = "supercarrito.compras.v1";

export class ComprasLocalStorage implements RepositorioCompras {
  async cargar(): Promise<CompraCerrada[]> {
    if (typeof window === "undefined") return [];
    try {
      const crudo = window.localStorage.getItem(CLAVE_COMPRAS);
      const c = crudo ? JSON.parse(crudo) : [];
      return Array.isArray(c) ? c : [];
    } catch {
      return [];
    }
  }

  async agregar(compra: CompraCerrada): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const actual = await this.cargar();
      window.localStorage.setItem(
        CLAVE_COMPRAS,
        JSON.stringify([compra, ...actual].slice(0, 50))
      );
    } catch {
      // Guardar el recuerdo de una compra nunca puede romper la siguiente.
    }
  }
}

export const repositorioCompras: RepositorioCompras = new ComprasLocalStorage();

// --- La casa: quién entra ----------------------------------------------------
// Mismo puerto, misma disciplina. Sin contraseñas y sin servidor: hoy es un
// nombre en este navegador. El día que haya cuentas de verdad, esto se convierte
// en `CasaApi` y ni la UI ni el modelo cambian una línea.

export interface RepositorioCasa {
  cargar(): Promise<Casa>;
  guardar(casa: Casa): Promise<void>;
}

const CLAVE_CASA = "supercarrito.casa.v1";

export class CasaLocalStorage implements RepositorioCasa {
  async cargar(): Promise<Casa> {
    if (typeof window === "undefined") return casaVacia();
    try {
      const crudo = window.localStorage.getItem(CLAVE_CASA);
      if (!crudo) return casaVacia();
      const c = JSON.parse(crudo) as Casa;
      if (c?.version !== 1 || typeof c.nombre !== "string") return casaVacia();
      return c;
    } catch {
      return casaVacia();
    }
  }

  async guardar(casa: Casa): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CLAVE_CASA, JSON.stringify(casa));
    } catch {
      // Si no se puede guardar el nombre, se entra igual: la identidad nunca
      // puede ser un muro entre la familia y su compra.
    }
  }
}

export const repositorioCasa: RepositorioCasa = new CasaLocalStorage();
