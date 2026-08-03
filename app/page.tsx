"use client";

// SuperCarrito — la aplicación.
//
// Este archivo ORQUESTA. Todo lo que se ve vive en `app/ui/`, una sola vez cada
// pieza; aquí solo hay estado, reglas y quién habla con quién. Si algo de esta
// pantalla necesita un color, un tamaño o un tiempo, está mal: lo pide al
// sistema.
//
// ARQUITECTURA (ARQ-3): tres lugares y cuatro gestos.
//   · Libreta — el Home. 95 % del uso. Se abre aquí, con el cursor puesto.
//   · Compra  — el carrito honesto. Una vez por semana. Cuelga de la libreta.
//   · Casa    — lo aprendido y las compras anteriores. Detrás del monograma.
// Las cuatro puertas (escribir · pegar · foto · menú) NO son pestañas: son
// gestos sobre la libreta. La familia nunca clasifica su evidencia.
//
// Lo que esta pantalla NO hace, por principio: fotos o precios dentro de la
// libreta · barra de pestañas · badges · contadores de progreso · pedir cuenta
// antes de comprar · sumar al total algo cuya cantidad no conocemos.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  aprenderCantidad,
  aprenderDeCorreccion,
  contarPreguntasEvitadas,
  elegir,
  perfilVacio,
  preferenciaDe,
  type Perfil,
  type Preferencia,
} from "@/lib/preferencias";
import { etiquetaUnitaria, formatearCantidad } from "@/lib/cantidades";
import {
  repositorioCompras,
  repositorioHistorial,
  repositorioLibreta,
  repositorioPerfil,
  type CompraCerrada,
} from "@/lib/perfil-store";
import { ahora } from "@/lib/historial";
import {
  anotar,
  aPedidos,
  deshacerUltimoBloque,
  editar,
  libretaVacia,
  origenLegible,
  partir,
  quitar,
  resolverCompra,
  type Libreta,
} from "@/lib/libreta";
import type { LineaExtraida } from "@/lib/evidencia";
import type { ProductoWong } from "@/lib/catalog";

import { color, lapiz, plata, rotulo, soles } from "@/app/ui/sistema";
import Aviso from "@/app/ui/Aviso";
import Boton from "@/app/ui/Boton";
import Campo from "@/app/ui/Campo";
import Fila from "@/app/ui/Fila";
import Hoja from "@/app/ui/Hoja";
import HojaCantidad from "@/app/ui/HojaCantidad";
import HojaOpciones from "@/app/ui/HojaOpciones";
import { Compositor, Lapiz, LineaLibreta, Puertas } from "@/app/ui/Libreta";
import LineaCarrito, { type EstadoLinea } from "@/app/ui/LineaCarrito";
import { Pantalla, Seccion, Vacio } from "@/app/ui/Pantalla";
import PantallaCalma from "@/app/ui/PantallaCalma";

type Ruta = "libreta" | "revision" | "compra" | "confirmar" | "hecho" | "casa" | "boleta";

type Item = ProductoWong & {
  alternativa: boolean;
  terminoUsado: string;
  cantidadPedida?: number;
  unidadPedida?: "kg" | "un";
};

type CarritoApi = {
  menu: string;
  titulo?: string;
  platos: string[];
  items: Item[];
  total: number;
  pendientes: number;
  faltantes: string[];
};

type ItemResuelto = {
  ingrediente: string;
  candidatos: ProductoWong[];
  elegido: ProductoWong;
  porPerfil: boolean;
  cantidadPedida?: number;
  unidadPedida?: "kg" | "un";
  cantidadElegida?: number;
  fuera?: boolean; // "dejarlo anotado": sigue a la vista y no compra
};

type MenuResumen = { numero: string; nombre: string; platos: string[] };

// --- Reglas puras -------------------------------------------------------------
// El servidor propone candidatos; quien elige es la memoria de la familia. Cada
// ambigüedad que el perfil resuelve es una pregunta que no hicimos.

function resolver(data: CarritoApi, perfil: Perfil) {
  let evitadas = 0;

  const items: ItemResuelto[] = data.items.map((it) => {
    const { alternativas, ...defecto } = it;
    const candidatos = [defecto as ProductoWong, ...(alternativas ?? [])];
    const pref = preferenciaDe(perfil, it.ingrediente);
    const { elegido, porPerfil } = elegir(candidatos, pref);

    if (porPerfil && candidatos.length > 1) evitadas++;

    const esPeso = (elegido?.unidadVenta ?? "un") === "kg";
    const veniaEnLaEvidencia = it.cantidadPedida != null && it.unidadPedida === "kg";
    if (esPeso && !veniaEnLaEvidencia && pref?.cantidadHabitual != null) evitadas++;

    return {
      ingrediente: it.ingrediente,
      candidatos,
      elegido,
      porPerfil,
      cantidadPedida: it.cantidadPedida,
      unidadPedida: it.unidadPedida,
    };
  });

  return { items, evitadas };
}

// Orden de prioridad, del más fuerte al más débil: lo que acaba de responder ·
// lo que traía la evidencia (si habla la misma unidad) · lo que ya sabemos de
// esta casa · nada, y entonces el producto queda PENDIENTE.
function cantidadDe(it: ItemResuelto, perfil: Perfil): number | undefined {
  const unidad = it.elegido?.unidadVenta ?? "un";
  if (it.cantidadElegida != null) return it.cantidadElegida;
  if (unidad === "un") return 1;
  if (it.cantidadPedida != null && it.unidadPedida === "kg") return it.cantidadPedida;
  return preferenciaDe(perfil, it.ingrediente)?.cantidadHabitual;
}

function subtotalDe(it: ItemResuelto, perfil: Perfil): number | undefined {
  const p = it.elegido;
  if (!p?.encontrado || p.disponible === false) return 0;
  const cantidad = cantidadDe(it, perfil);
  if (cantidad == null || p.precio == null) return undefined;
  return Math.round(p.precio * cantidad * 100) / 100;
}

// El total solo cuenta lo confirmado. Un total que aparenta estar completo
// cuando no lo está es el mismo pecado que un precio inexplicable, una escala
// más arriba. Lo que se dejó anotado no suma y tampoco cuenta como pendiente:
// ya no es una pregunta abierta, es una decisión tomada.
function totalDe(items: ItemResuelto[], perfil: Perfil) {
  let total = 0;
  let pendientes = 0;
  for (const it of items) {
    if (it.fuera) continue;
    const s = subtotalDe(it, perfil);
    if (s === undefined) pendientes++;
    else total += s;
  }
  return { total: Math.round(total * 100) / 100, pendientes };
}

function estadoDe(it: ItemResuelto, subtotal?: number): EstadoLinea {
  if (!it.elegido?.encontrado) return "sin-resultado";
  if (it.elegido.disponible === false) return "agotado";
  if (subtotal === undefined) return "pendiente";
  return "confirmado";
}

// La interfaz comunica GRADO DE CONFIANZA, nunca origen técnico. No "del
// perfil" sino "el de siempre" / "lo acabas de confirmar".
function confianzaDe(
  it: ItemResuelto,
  perfil: Perfil,
  estado: EstadoLinea
): { tono: "confirmado" | "sabido" | "pendiente" | "problema"; texto: string } | undefined {
  if (estado === "agotado") return { tono: "problema", texto: "lo dejé anotado igual" };
  if (estado === "pendiente") return { tono: "pendiente", texto: "pendiente de confirmar" };
  if (estado === "sin-resultado") return undefined;
  if (it.cantidadElegida != null) return { tono: "confirmado", texto: "lo acabas de confirmar" };
  if (it.porPerfil) {
    const veces = preferenciaDe(perfil, it.ingrediente)?.vecesConfirmada ?? 0;
    return veces >= 3
      ? { tono: "confirmado", texto: "el de siempre" }
      : { tono: "sabido", texto: "basado en tu compra anterior" };
  }
  return undefined;
}

function leerBase64(archivo: File): Promise<string> {
  return new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => {
      const url = String(lector.result);
      ok(url.slice(url.indexOf(",") + 1));
    };
    lector.onerror = () => mal(new Error("no se pudo leer el archivo"));
    lector.readAsDataURL(archivo);
  });
}

// =============================================================================

export default function App() {
  const [ruta, setRuta] = useState<Ruta>("libreta");

  const [libreta, setLibreta] = useState<Libreta>(libretaVacia());
  const [borrador, setBorrador] = useState("");
  // Qué línea se está corrigiendo y con qué texto. El texto vive AQUÍ y no en la
  // libreta mientras se escribe: si aplicáramos cada tecla, vaciar el campo para
  // reescribir —el gesto más normal del mundo— borraría la línea a media
  // corrección y se llevaría por delante lo que la familia estaba escribiendo.
  // El trabajo del usuario no se pierde jamás: se guarda al cerrar, no al teclear.
  const [editando, setEditando] = useState<{ id: string; texto: string } | null>(null);

  const [perfil, setPerfil] = useState<Perfil>(perfilVacio());
  const [compras, setCompras] = useState<CompraCerrada[]>([]);
  const [verCompra, setVerCompra] = useState<CompraCerrada | null>(null);

  const [items, setItems] = useState<ItemResuelto[] | null>(null);
  const [faltantes, setFaltantes] = useState<string[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; deshacer?: number } | null>(null);
  const [menus, setMenus] = useState<MenuResumen[]>([]);
  const [hojaMenus, setHojaMenus] = useState(false);
  const [hoja, setHoja] = useState<{ tipo: "cantidad" | "opciones"; ingrediente: string } | null>(null);
  const [ultimaCompra, setUltimaCompra] = useState<{ n: number; quedaron: number } | null>(null);

  const compRef = useRef<HTMLInputElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const cargada = useRef(false);

  // --- Persistencia. El trabajo no se pierde jamás: se guarda en cada cambio.
  useEffect(() => {
    void repositorioPerfil.cargar().then(setPerfil);
    void repositorioCompras.cargar().then(setCompras);
    void repositorioLibreta.cargar().then((l) => {
      setLibreta(l);
      cargada.current = true;
    });
    fetch("/api/menus")
      .then((r) => r.json())
      .then((d) => setMenus(d.menus ?? []))
      .catch(() => setMenus([]));
  }, []);

  useEffect(() => {
    if (cargada.current) void repositorioLibreta.guardar(libreta);
  }, [libreta]);

  // El cursor ya está puesto: abrir y escribir son el mismo gesto.
  useEffect(() => {
    if (ruta === "libreta" && !editando) compRef.current?.focus({ preventScroll: true });
  }, [ruta, editando]);

  // Los avisos caducan solos: nunca se acumulan como una bandeja.
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5200);
    return () => clearTimeout(t);
  }, [aviso]);

  const actualizarPerfil = useCallback((fn: (p: Perfil) => Perfil) => {
    setPerfil((actual) => {
      const nuevo = fn(actual);
      void repositorioPerfil.guardar(nuevo);
      return nuevo;
    });
  }, []);

  const { total, pendientes } = useMemo(() => totalDe(items ?? [], perfil), [items, perfil]);

  const ir = (r: Ruta) => setRuta(r);

  // --- Las cuatro puertas ----------------------------------------------------

  // Cerrar una corrección: recién aquí se toca la libreta. Vaciar el campo y
  // confirmar sí quita la línea — eso es una intención clara, no un descuido a
  // media escritura.
  function cerrarEdicion() {
    if (editando) setLibreta((lb) => editar(lb, editando.id, editando.texto));
    setEditando(null);
  }

  function anotarTexto(texto: string, origen: Parameters<typeof anotar>[2] = "escrita") {
    const cuantas = partir(texto).length;
    if (!cuantas) return 0;
    setLibreta((l) => anotar(l, texto, origen));
    return cuantas;
  }

  function alPegar(e: React.ClipboardEvent<HTMLInputElement>) {
    const texto = e.clipboardData.getData("text");
    if (!texto || partir(texto).length < 2) return; // una línea suelta: pegado normal
    e.preventDefault();
    const n = anotarTexto(texto, "pegada");
    setBorrador("");
    // Entra tal cual: con emojis, con "mami" y con faltas. No se toca nada.
    setAviso({ texto: "Pegado tal cual. Yo lo ordeno cuando compres.", deshacer: n });
  }

  async function subirCaptura(archivo: File) {
    setLeyendo(true);
    try {
      const base64 = await leerBase64(archivo);
      const res = await fetch("/api/importar-captura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType: archivo.type, base64 }),
      });
      const data = await res.json();
      if (!data.ok || !data.reconocida || !data.lineas?.length) {
        // El producto asume la falla en primera persona y no borra nada.
        setAviso({ texto: "No pude leerla. Prueba con otra captura." });
        return;
      }
      const lineas = data.lineas as LineaExtraida[];
      setLibreta((l) =>
        lineas.reduce(
          (acc, x) => anotar(acc, x.producto, "captura", { cantidad: x.cantidad, unidad: x.unidad }),
          l
        )
      );
      setAviso({ texto: `Leí ${lineas.length} líneas. Nada tuyo se pierde.` });
    } catch {
      setAviso({ texto: "No pude leerla. Revisa tu conexión." });
    } finally {
      setLeyendo(false);
    }
  }

  // --- La compra -------------------------------------------------------------

  async function buscarPrecios() {
    if (buscando || libreta.lineas.length === 0) return;
    setBuscando(true);
    ir("compra");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineas: aPedidos(libreta) }),
      });
      const data = await res.json();
      if (!data.ok) {
        setAviso({ texto: "No pude armar el carrito. Intenta de nuevo." });
        ir("libreta");
        return;
      }
      const { items: resueltos, evitadas } = resolver(data as CarritoApi, perfil);
      setItems(resueltos);
      setFaltantes(data.faltantes ?? []);
      if (evitadas > 0) actualizarPerfil((p) => contarPreguntasEvitadas(p, evitadas));

      void repositorioHistorial.agregar({
        tipo: "escribio",
        ts: ahora(),
        texto: libreta.lineas.map((l) => l.texto).join(" · "),
        propuestas: resueltos.map((it) => ({
          ingrediente: it.ingrediente,
          nombre: it.elegido?.nombre,
          marca: it.elegido?.marca,
          precio: it.elegido?.precio,
          porPerfil: it.porPerfil,
          origen: { proveedor: it.elegido?.proveedor, sku: it.elegido?.sku },
        })),
      });
    } catch {
      setAviso({ texto: "No pude armar el carrito. Intenta de nuevo." });
      ir("libreta");
    } finally {
      setBuscando(false);
    }
  }

  function responderCantidad(ingrediente: string, cantidad: number) {
    setItems((xs) =>
      (xs ?? []).map((it) => (it.ingrediente === ingrediente ? { ...it, cantidadElegida: cantidad } : it))
    );
    actualizarPerfil((p) => aprenderCantidad(p, ingrediente, cantidad));
    setHoja(null);
  }

  // La captura de señal: corregir es el mecanismo de aprendizaje, no un fallo.
  function corregir(ingrediente: string, nuevo: ProductoWong) {
    const candidatos = items?.find((it) => it.ingrediente === ingrediente)?.candidatos ?? [];
    setItems((xs) =>
      (xs ?? []).map((it) =>
        it.ingrediente === ingrediente ? { ...it, elegido: nuevo, porPerfil: true } : it
      )
    );
    setHoja(null);

    void repositorioHistorial.agregar({
      tipo: "eligio",
      ts: ahora(),
      ingrediente,
      nombre: nuevo.nombre,
      marca: nuevo.marca,
      presentacion: nuevo.presentacion,
      precio: nuevo.precio,
      origen: { proveedor: nuevo.proveedor, sku: nuevo.sku },
      candidatos: candidatos.map((c) => ({ nombre: c.nombre, marca: c.marca, precio: c.precio })),
    });
    actualizarPerfil((p) => aprenderDeCorreccion(p, ingrediente, nuevo, candidatos));
  }

  function comprar() {
    const vivos = (items ?? []).filter((it) => !it.fuera);
    const comprados = vivos.filter(
      (it) => subtotalDe(it, perfil) !== undefined && it.elegido?.encontrado
    );

    const compra: CompraCerrada = {
      ts: Date.now(),
      total,
      lineas: comprados.map((it) => {
        const u = it.elegido?.unidadVenta ?? "un";
        const c = cantidadDe(it, perfil) ?? 1;
        return {
          nombre: it.elegido?.nombre ?? it.ingrediente,
          cuenta: `${formatearCantidad(c, u)} × ${soles(it.elegido?.precio ?? 0)}${etiquetaUnitaria(u)}`,
          monto: subtotalDe(it, perfil) ?? 0,
        };
      }),
    };
    void repositorioCompras.agregar(compra);
    setCompras((cs) => [compra, ...cs]);

    // La libreta no se vacía: se resuelve. Sobrevive lo que no se compró.
    const nueva = resolverCompra(libreta, comprados.map((it) => it.ingrediente));
    setLibreta(nueva);
    setUltimaCompra({ n: comprados.length, quedaron: nueva.lineas.length });
    setItems(null);
    ir("hecho");
  }

  // ---------------------------------------------------------------------------

  const nPrefs = Object.keys(perfil.preferencias).length;
  const vacia = libreta.lineas.length === 0;
  // Una libreta vacía la primera vez y una vacía porque acabas de comprar no son
  // el mismo vacío: una necesita que le enseñen el gesto, la otra es un logro.
  const primeraVez = vacia && compras.length === 0 && nPrefs === 0;
  const itemHoja = hoja ? items?.find((it) => it.ingrediente === hoja.ingrediente) : undefined;

  return (
    <main
      className="sc-papel"
      style={{
        maxWidth: 460,
        margin: "0 auto",
        minHeight: "100dvh",
        padding: "0 22px",
        boxSizing: "border-box",
        background: color.papel,
      }}
    >
      {ruta === "libreta" && (
        <Pantalla
          titulo="Casa"
          casa={() => ir("casa")}
          cuerpo={
            <>
              {libreta.lineas.map((l) =>
                editando?.id === l.id ? (
                  <Compositor
                    key={l.id}
                    valor={editando.texto}
                    onEscribir={(texto) => setEditando({ id: l.id, texto })}
                    onEnter={cerrarEdicion}
                    onSalir={cerrarEdicion}
                    onPegar={() => {}}
                  />
                ) : (
                  <LineaLibreta
                    key={l.id}
                    texto={l.texto}
                    ts={l.ts}
                    pegada={l.origen === "pegada"}
                    quedo={l.quedo}
                    onTocar={() => setEditando({ id: l.id, texto: l.texto })}
                  />
                )
              )}

              <Compositor
                ref={compRef}
                valor={borrador}
                marcador={primeraVez ? "lo que se te acabó" : undefined}
                onEscribir={setBorrador}
                onEnter={() => {
                  if (anotarTexto(borrador)) setBorrador("");
                }}
                onPegar={alPegar}
              />

              {/* Vaciar la libreta comprando no es lo mismo que no haber
                  empezado nunca. Aquí el vacío es un logro, y se dice una vez.
                  El único emoji de la aplicación; el chiste está en el "por
                  ahora". */}
              {vacia && !primeraVez && <Lapiz>todo comprado 🎉 por ahora</Lapiz>}

              {/* Las cuatro puertas, siempre. Estaban solo cuando la libreta
                  estaba vacía, y eso dejaba `foto` y `menú` **inalcanzables** en
                  cuanto se escribía una línea: no era una decisión de estilo,
                  era una capacidad que se perdía. Siguen en lápiz y siguen sin
                  navegar a ningún sitio: describen qué acepta este lienzo. */}
              <Puertas
                puertas={[
                  { texto: "escribe", onClick: () => compRef.current?.focus() },
                  {
                    texto: "pega",
                    onClick: () => {
                      compRef.current?.focus();
                      setAviso({ texto: "Pega aquí lo que sea: un WhatsApp, una lista, un menú." });
                    },
                  },
                  { texto: "foto", onClick: () => archivoRef.current?.click() },
                  { texto: "menú", onClick: () => setHojaMenus(true) },
                ]}
              />

              {/* El eco iría aquí cuando exista. Hoy no existe y no se finge. */}
            </>
          }
          pie={
            <>
              {/* El labio. Dice el estado real de la casa —una compra a medias,
                  o cuándo fue la última— y si no hay nada que decir, calla.
                  Nunca cuenta cuántas cosas hay anotadas: un número que sube es
                  lo más parecido a una evaluación que puede tener esta pantalla. */}
              {items ? (
                <button
                  onClick={() => ir("compra")}
                  className="sc-boton"
                  style={{
                    ...lapiz,
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    border: 0,
                    background: "none",
                    padding: "0 0 8px",
                    minHeight: 32,
                    cursor: "pointer",
                    font: "inherit",
                    color: color.lapiz,
                  }}
                >
                  tu compra está a medias · seguir donde la dejaste
                </button>
              ) : compras.length > 0 ? (
                <div style={{ ...lapiz, paddingBottom: 8 }}>
                  la última compra fue {cuando(compras[0].ts).toLowerCase()}
                </div>
              ) : null}

              {/* ⚠️ Fantasma, jamás verde. Comprar no es un CTA: si el botón
                  grita, el producto deja de acompañar y empieza a empujar. */}
              <Boton
                variante="fantasma"
                onClick={() => ir("revision")}
                disabled={vacia}
                style={{ width: "100%" }}
              >
                Hacer la compra
              </Boton>
            </>
          }
        />
      )}

      {ruta === "revision" && (
        <Pantalla
          titulo="Antes de comprar"
          onVolver={() => ir("libreta")}
          cuerpo={
            <>
              <p style={{ ...lapiz, margin: "0 0 12px" }}>
                Esto es lo que voy a buscar. Quita lo que no quieras; nada se ha comprado todavía.
              </p>
              {libreta.lineas.map((l) => (
                <Fila
                  key={l.id}
                  titulo={l.texto}
                  nota={origenLegible(l.origen)}
                  derecha={
                    <Boton variante="fantasma" chico onClick={() => setLibreta((lb) => quitar(lb, l.id))}>
                      Quitar
                    </Boton>
                  }
                />
              ))}
              {vacia && (
                <Vacio titulo="Quitaste todo." texto="La libreta te espera igual." />
              )}
            </>
          }
          pie={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ ...lapiz, flex: 1 }}>
                {libreta.lineas.length} {libreta.lineas.length === 1 ? "cosa" : "cosas"}
              </span>
              <Boton variante="lleno" onClick={buscarPrecios} disabled={vacia}>
                Buscar precios
              </Boton>
            </div>
          }
        />
      )}

      {ruta === "compra" && (
        <Pantalla
          titulo="Tu compra"
          onVolver={() => ir(items ? "revision" : "libreta")}
          cuerpo={
            buscando ? (
              <PantallaCalma
                estado="esperando"
                titulo="Buscando precios en Wong"
                texto="Tarda unos segundos. Puedes seguir escribiendo mientras tanto."
              />
            ) : !items ? (
              <Vacio
                titulo="Aquí verás tu compra cuando la hagas."
                texto="Se arma sola con lo que anotes en la libreta."
                accion={
                  <Boton variante="fantasma" onClick={() => ir("libreta")}>
                    Ir a la libreta
                  </Boton>
                }
              />
            ) : (
              <>
                <p style={{ ...lapiz, margin: "0 0 8px" }}>Wong · precios de hoy</p>
                {items.map((it) => {
                  const subtotal = subtotalDe(it, perfil);
                  const estado = estadoDe(it, subtotal);
                  const otras = it.candidatos.filter(
                    (c) => c.sku !== it.elegido?.sku && c.encontrado
                  );

                  const acciones: { texto: string; onClick: () => void }[] = [];
                  if (estado === "pendiente")
                    acciones.push({
                      texto: "¿Cuánto llevas?",
                      onClick: () => setHoja({ tipo: "cantidad", ingrediente: it.ingrediente }),
                    });
                  if (estado === "agotado")
                    acciones.push({
                      texto: "Ver qué sí hay",
                      onClick: () => setHoja({ tipo: "opciones", ingrediente: it.ingrediente }),
                    });
                  else if (otras.length > 0)
                    acciones.push({
                      texto: `Prefiero otra (${otras.length})`,
                      onClick: () => setHoja({ tipo: "opciones", ingrediente: it.ingrediente }),
                    });
                  if (estado !== "sin-resultado")
                    acciones.push({
                      texto: it.fuera ? "Volver a ponerlo" : "Dejarlo anotado",
                      onClick: () =>
                        setItems((xs) =>
                          (xs ?? []).map((x) =>
                            x.ingrediente === it.ingrediente ? { ...x, fuera: !x.fuera } : x
                          )
                        ),
                    });

                  return (
                    <LineaCarrito
                      key={it.ingrediente}
                      ingrediente={it.ingrediente}
                      producto={it.elegido}
                      estado={estado}
                      cantidad={cantidadDe(it, perfil)}
                      subtotal={it.fuera ? undefined : subtotal}
                      confianza={it.fuera ? undefined : confianzaDe(it, perfil, estado)}
                      acciones={acciones}
                      atenuada={it.fuera}
                    />
                  );
                })}

                {faltantes.length > 0 && (
                  <p style={{ ...lapiz, marginTop: 14 }}>
                    No encontré en Wong: {faltantes.join(", ")}. Sigue anotado.
                  </p>
                )}
              </>
            )
          }
          pie={
            items && !buscando ? (
              <>
                {pendientes > 0 && (
                  <div style={{ ...lapiz, marginBottom: 8 }}>
                    {pendientes === 1
                      ? "Un producto todavía no suma: falta saber cuánto llevas."
                      : `${pendientes} productos todavía no suman: falta saber cuánto llevas.`}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <span>
                    <span style={{ ...rotulo, display: "block" }}>
                      {pendientes > 0 ? "Subtotal confirmado" : "Total"}
                    </span>
                    <span style={{ ...plata, fontSize: 25, letterSpacing: "-0.03em" }}>
                      {soles(total)}
                    </span>
                  </span>
                  <Boton variante="lleno" onClick={() => ir("confirmar")}>
                    Comprar
                  </Boton>
                </div>
              </>
            ) : undefined
          }
        />
      )}

      {ruta === "confirmar" && (
        <Pantalla
          titulo="Confirmar"
          onVolver={() => ir("compra")}
          cuerpo={
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  margin: "4px 0 18px",
                }}
              >
                <span style={rotulo}>Total</span>
                <span style={{ ...plata, fontSize: 25, letterSpacing: "-0.03em" }}>{soles(total)}</span>
              </div>
              <Campo etiqueta="¿A dónde te lo llevamos?" placeholder="Av. Primavera 1234, Surco" />
              <Campo etiqueta="¿Cuándo?" defecto="jueves, 9–11 h" />
              <Campo etiqueta="Tu correo, para la boleta" tipo="email" placeholder="rosa@correo.com" />
              <p style={{ ...lapiz, lineHeight: 1.55 }}>
                Con esto queda creada tu cuenta. No te pedimos nada antes porque no hacía falta.
              </p>
            </>
          }
          pie={
            <Boton variante="lleno" onClick={comprar} style={{ width: "100%" }}>
              Comprar
            </Boton>
          }
        />
      )}

      {ruta === "hecho" && (
        <PantallaCalma
          estado="listo"
          titulo={`Listo. Compraste ${ultimaCompra?.n ?? 0} ${
            ultimaCompra?.n === 1 ? "cosa" : "cosas"
          }.`}
          texto={
            (ultimaCompra?.quedaron ?? 0) > 0
              ? "Lo que no compraste sigue anotado para la próxima. Tu libreta te espera igual."
              : "Tu libreta quedó limpia."
          }
          accion={{ texto: "Volver a la libreta", onClick: () => ir("libreta") }}
        />
      )}

      {ruta === "casa" && (
        <Pantalla
          titulo="La casa"
          onVolver={() => ir("libreta")}
          cuerpo={
            nPrefs === 0 && compras.length === 0 ? (
              <Vacio
                titulo="Todavía no sé nada de ustedes."
                texto="Después de la primera compra empiezo a aprender cómo compran. No hay nada que rellenar."
              />
            ) : (
              <>
                {nPrefs > 0 && (
                  <>
                    <Seccion>Lo que aprendí de ustedes</Seccion>
                    {Object.entries(perfil.preferencias).map(([clave, pref]) => (
                      <Fila key={clave} titulo={fraseDe(clave, pref)} nota={motivoDe(pref)} />
                    ))}
                  </>
                )}

                {compras.length > 0 && (
                  <>
                    <Seccion>Sus compras</Seccion>
                    {compras.map((c) => (
                      <Fila
                        key={c.ts}
                        titulo={cuando(c.ts)}
                        nota={`${c.lineas.length} ${c.lineas.length === 1 ? "cosa" : "cosas"} · Wong`}
                        derecha={<span style={{ ...plata, fontSize: 14 }}>{soles(c.total)}</span>}
                        onTocar={() => {
                          setVerCompra(c);
                          ir("boleta");
                        }}
                      />
                    ))}
                  </>
                )}

                {perfil.metricas?.preguntasEvitadas ? (
                  <p style={{ ...lapiz, paddingTop: 16 }}>
                    {perfil.metricas.preguntasEvitadas}{" "}
                    {perfil.metricas.preguntasEvitadas === 1 ? "pregunta" : "preguntas"} que ya no hizo
                    falta hacerles.
                  </p>
                ) : null}
              </>
            )
          }
        />
      )}

      {ruta === "boleta" && verCompra && (
        <Pantalla
          titulo={cuando(verCompra.ts)}
          onVolver={() => ir("casa")}
          cuerpo={
            <>
              {/* Sin fotos: aquí ya no se está eligiendo, y la foto sirve para
                  decidir, no para archivar. Cada línea conserva su cuenta. */}
              {verCompra.lineas.map((l, i) => (
                <Fila
                  key={i}
                  titulo={l.nombre}
                  nota={<span style={{ fontVariantNumeric: "tabular-nums" }}>{l.cuenta}</span>}
                  derecha={<span style={{ ...plata, fontSize: 13.5 }}>{soles(l.monto)}</span>}
                />
              ))}
            </>
          }
          pie={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={rotulo}>Total</span>
              <span style={{ ...plata, fontSize: 25, letterSpacing: "-0.03em" }}>
                {soles(verCompra.total)}
              </span>
            </div>
          }
        />
      )}

      {/* El selector de archivo vive fuera de las rutas: lo dispara cualquier
          puerta y no debe desmontarse al navegar. */}
      <input
        ref={archivoRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void subirCaptura(f);
        }}
      />

      {/* --- superpuestos --- */}

      {leyendo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 35,
            background: color.papel,
            display: "grid",
            placeItems: "center",
          }}
        >
          <PantallaCalma
            estado="esperando"
            titulo="Leyendo tu captura"
            texto="Sin prisa. Tu captura se queda aquí pase lo que pase."
          />
        </div>
      )}

      {hojaMenus && (
        <Hoja
          titulo="Los menús de la semana"
          sub="Se anota como una línea más. Lo abro en ingredientes al comprar."
          onCerrar={() => setHojaMenus(false)}
        >
          {menus.map((m) => (
            <button
              key={m.numero}
              onClick={() => {
                anotarTexto(`menú ${m.numero}`, "menu");
                setHojaMenus(false);
              }}
              className="sc-boton"
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "12px 14px",
                marginBottom: 9,
                minHeight: 44,
                borderRadius: 15,
                border: `1px solid ${color.renglon}`,
                background: color.blanco,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 500, color: color.tinta }}>
                {m.nombre}
              </span>
              <span style={{ ...lapiz, display: "block", fontSize: 11.5, marginTop: 2 }}>
                {m.platos.join(" · ")}
              </span>
            </button>
          ))}
          {menus.length === 0 && <p style={lapiz}>Todavía no hay menús guardados.</p>}
        </Hoja>
      )}

      {hoja?.tipo === "cantidad" && itemHoja && (
        <HojaCantidad
          ingrediente={itemHoja.ingrediente}
          producto={itemHoja.elegido}
          onResponder={(c) => responderCantidad(itemHoja.ingrediente, c)}
          onCerrar={() => setHoja(null)}
        />
      )}

      {hoja?.tipo === "opciones" && itemHoja && (
        <HojaOpciones
          ingrediente={itemHoja.ingrediente}
          opciones={itemHoja.candidatos.filter((c) => c.encontrado)}
          elegidaSku={itemHoja.elegido?.sku}
          onElegir={(p) => corregir(itemHoja.ingrediente, p)}
          onCerrar={() => setHoja(null)}
        />
      )}

      {aviso && (
        <Aviso
          texto={aviso.texto}
          onDeshacer={
            aviso.deshacer
              ? () => {
                  setLibreta((l) => deshacerUltimoBloque(l, aviso.deshacer!));
                  setAviso(null);
                }
              : undefined
          }
        />
      )}
    </main>
  );
}

// --- texto -------------------------------------------------------------------
// El perfil es opinión derivada, y una opinión se escribe en frases de casa.
// Si esto pareciera una base de datos, la familia dejaría de sentirlo suyo.

function fraseDe(clave: string, pref: Preferencia): string {
  const cosa = clave.charAt(0).toUpperCase() + clave.slice(1);
  if (pref.marca && pref.formato) return `${cosa} es ${pref.marca}, ${pref.formato}`;
  if (pref.marca) return `${cosa} es ${pref.marca}`;
  if (pref.sensibilidadPrecio === "mas_barato") return `${cosa}, siempre lo más barato`;
  if (pref.cantidadHabitual != null) return `${cosa}, ${pref.cantidadHabitual} de siempre`;
  return cosa;
}

function motivoDe(pref: Preferencia): string {
  if (pref.vecesConfirmada >= 3) return `${pref.vecesConfirmada} compras seguidas`;
  if (pref.vecesConfirmada > 1) return `${pref.vecesConfirmada} veces seguidas`;
  return "lo elegiste así";
}

// El tiempo, en el idioma de la casa. Nunca una fecha dentro de su texto.
function cuando(ts: number): string {
  const dias = Math.floor((Date.now() - ts) / 86_400_000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 14) return "La semana pasada";
  return `Hace ${Math.floor(dias / 7)} semanas`;
}
