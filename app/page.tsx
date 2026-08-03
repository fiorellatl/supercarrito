"use client";

// SuperCarrito — la aplicación.
//
// Este archivo ORQUESTA. Todo lo que se ve vive en `app/ui/`, una sola vez cada
// pieza; aquí solo hay estado, reglas y quién habla con quién. Si algo de esta
// pantalla necesita un color, un tamaño o un tiempo, está mal: lo pide al
// sistema.
//
// ARQUITECTURA: tres lugares y cuatro formas de empezar.
//   · Mi compra — el Home. Donde se prepara. 95 % del uso.
//   · Carrito   — la compra ya con precios de Wong. Una vez por semana.
//   · Mi casa   — lo aprendido y las compras anteriores.
//
// 🗣 VOCABULARIO (decisión de la PO, 2026-08-02): de cara a la familia esto es
// **su compra**, nunca "la libreta". La libreta es cómo está hecho por dentro
// —`lib/libreta.ts`, la ruta `"libreta"`— y ese nombre no sale a pantalla: nadie
// abre una aplicación pensando "voy a usar mi libreta".
//
// ⚖️ NINGÚN CAMINO ES EL PRINCIPAL. Escribir, pegar un WhatsApp, importar una
// compra y cargar un menú son equivalentes: mismo peso visual, ningún "también
// puedes" que subordine, y el cursor NO se pone solo en una compra vacía.
//
// Lo que esta pantalla NO hace, por principio: fotos o precios mientras se
// prepara · badges · contadores de progreso · pedir cuenta antes de comprar ·
// sumar al total algo cuya cantidad no conocemos · sugerir que hay una forma
// correcta de escribir.

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
  lecturaDe,
  libretaVacia,
  marcarCompra,
  origenLegible,
  partir,
  quitar,
  resolverCompra,
  type Libreta,
} from "@/lib/libreta";
import type { LineaExtraida } from "@/lib/evidencia";
import type { ProductoWong } from "@/lib/catalog";
import { wongDeepLink } from "@/lib/entrega";

import { casaVacia, crearCasa, monograma, saludo, tieneCasa, type Casa } from "@/lib/casa";
import { repositorioCasa } from "@/lib/perfil-store";

import { color, lapiz, plata, rotulo, soles } from "@/app/ui/sistema";
import Acciones from "@/app/ui/Acciones";
import Aviso from "@/app/ui/Aviso";
import Bienvenida from "@/app/ui/Bienvenida";
import Cabecera from "@/app/ui/Cabecera";
import Navegacion from "@/app/ui/Navegacion";
import Resumen from "@/app/ui/Resumen";
import Boton from "@/app/ui/Boton";
import Fila from "@/app/ui/Fila";
import Hoja from "@/app/ui/Hoja";
import HojaCantidad from "@/app/ui/HojaCantidad";
import HojaOpciones from "@/app/ui/HojaOpciones";
import { Compositor, Lapiz, LineaLibreta } from "@/app/ui/Libreta";
import LineaCarrito, { type EstadoLinea } from "@/app/ui/LineaCarrito";
import { Pantalla, Seccion, Vacio } from "@/app/ui/Pantalla";
import PantallaCalma from "@/app/ui/PantallaCalma";

type Ruta = "libreta" | "revision" | "compra" | "entregar" | "entregado" | "casa" | "boleta";

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
//
// Lo envasado ya no está clavado en 1. Antes esta función devolvía 1 para todo
// lo que no fuera peso, y esa línea convertía "cuánto llevo" en una decisión que
// el producto tomaba por la familia: nadie compra un solo yogur. Ahora 1 es solo
// el último recurso —el valor por defecto más honesto— y se puede cambiar.
function cantidadDe(it: ItemResuelto, perfil: Perfil): number | undefined {
  const unidad = it.elegido?.unidadVenta ?? "un";
  if (it.cantidadElegida != null) return it.cantidadElegida;
  if (it.cantidadPedida != null && it.unidadPedida === unidad) return it.cantidadPedida;

  const pref = preferenciaDe(perfil, it.ingrediente);
  const habitual = pref?.cantidadHabitual;

  // El hábito se guarda en la unidad de venta del producto con el que se
  // aprendió. Si hoy el producto se vende de otra forma, "0,4" unidades no es
  // una cantidad: es un dato traído de otro mundo. Preferimos no usarlo.
  // (Los perfiles antiguos no guardaban la unidad: ahí se deduce por la forma
  // del número, que para unidades solo puede ser un entero.)
  const otraUnidad = pref?.unidadHabitual != null && pref.unidadHabitual !== unidad;
  if (otraUnidad) return unidad === "un" ? 1 : undefined;

  if (unidad === "un") return Number.isInteger(habitual) && habitual! >= 1 ? habitual : 1;
  return habitual;
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

  const [casa, setCasa] = useState<Casa>(casaVacia());
  // Hasta que sepamos si esta casa ya existe no se pinta nada: enseñar la
  // bienvenida a alguien que lleva tres semanas usando el producto sería peor
  // que esperar 50 ms.
  const [listo, setListo] = useState(false);

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
    void repositorioCasa.cargar().then((c) => {
      setCasa(c);
      setListo(true);
    });
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
    // El cursor se pone solo cuando ya hay algo empezado: volver a añadir una
    // línea es el gesto más frecuente y no debe costar un toque. Pero en una
    // compra vacía NO se enfoca —abrir el teclado de golpe convertiría escribir
    // en el camino principal, y escribir, pegar, importar y cargar un menú son
    // formas equivalentes de empezar (decisión de la PO, 2026-08-02).
    if (ruta === "libreta" && !editando && libreta.lineas.length > 0)
      compRef.current?.focus({ preventScroll: true });
  }, [ruta, editando, libreta.lineas.length]);

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

  // La entrega se deriva del carrito, no se guarda: no hay un segundo estado
  // que se pueda desincronizar de lo que la familia está viendo.
  const entrega = useMemo(() => {
    const vivos = (items ?? []).filter((it) => !it.fuera);
    const decididos = vivos.filter(
      (it) => it.elegido?.encontrado && cantidadDe(it, perfil) != null
    );
    const listos = new Set(decididos.map((it) => it.ingrediente));

    const preparada = wongDeepLink.preparar(
      decididos.map((it) => ({
        ingrediente: it.ingrediente,
        producto: it.elegido!,
        cantidad: cantidadDe(it, perfil)!,
      }))
    );

    // Lo que no llegó ni a la puerta: nunca lo encontramos, o sigue sin
    // cantidad. Se dice aquí y no del otro lado.
    const nuncaLlegaron = vivos
      .filter((it) => !listos.has(it.ingrediente))
      .map((it) => ({
        nombre: it.elegido?.nombre ?? it.ingrediente,
        motivo: it.elegido?.encontrado
          ? "falta saber cuánto llevas"
          : "no lo encontré en Wong",
      }));

    return { ...preparada, sequedan: [...nuncaLlegaron, ...preparada.sequedan] };
  }, [items, perfil]);

  // Wong vende en múltiplos: 500 g de trucha que se vende de 400 en 400 son 800.
  // Si la cantidad cambia, se enseña antes de saltar. Nunca en silencio.
  const ajustes = useMemo(
    () =>
      entrega.viajan
        .filter((v) => v.cantidadQueCruza !== v.cantidad)
        .map((v) => ({
          nombre: v.nombre,
          pedida: formatearCantidad(v.cantidad, v.unidad),
          cruza: formatearCantidad(v.cantidadQueCruza, v.unidad),
        })),
    [entrega]
  );

  // El total de la entrega NO es el del carrito: es el de lo que de verdad
  // cruza. Cuando hay redondeo son distintos, y el que vale es este.
  const totalEntrega = useMemo(
    () =>
      Math.round(
        entrega.viajan.reduce((s, v) => s + (v.subtotalQueCruza ?? 0), 0) * 100
      ) / 100,
    [entrega]
  );

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
    const unidad = items?.find((it) => it.ingrediente === ingrediente)?.elegido?.unidadVenta;
    actualizarPerfil((p) => aprenderCantidad(p, ingrediente, cantidad, unidad));
    setHoja(null);
  }

  // Restar y sumar con los pasos reales de la tienda. Nunca baja de un paso:
  // "cero" no es una cantidad, es "dejarlo anotado", y para eso ya hay un gesto
  // con su propio nombre.
  function moverCantidad(it: ItemResuelto, direccion: 1 | -1) {
    const unidad = it.elegido?.unidadVenta ?? "un";
    const paso =
      unidad === "kg" && it.elegido?.cantidadMinima && it.elegido.cantidadMinima > 0
        ? it.elegido.cantidadMinima
        : 1;
    const actual = cantidadDe(it, perfil) ?? paso;
    const nueva = Math.round((actual + paso * direccion) * 1000) / 1000;
    if (nueva < paso) return;
    responderCantidad(it.ingrediente, nueva);
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

  // El salto ocurrió: la compra pasa a ser un hecho del historial y la libreta
  // se resuelve. Lo registramos al ABRIR el enlace, que es lo último que
  // podemos observar: si paga o no, ya no es asunto nuestro y no lo fingimos.
  function entregar() {
    // Se compró lo que CRUZÓ, ni uno más. Antes dábamos por comprado todo lo
    // que sumaba al total; ahora la única fuente de verdad es el enlace que la
    // familia acaba de abrir. Lo que no cruzó no se resuelve de la libreta.
    const cruzaron = new Set(entrega.viajan.map((v) => v.ingrediente));
    const comprados = (items ?? []).filter((it) => cruzaron.has(it.ingrediente));

    // El historial es HECHO, y el hecho es lo que cruzó: cantidades y montos de
    // la entrega, no los del carrito. Si Wong vendió 800 g donde pediste 500,
    // lo que pasó fueron 800 g — guardar 500 sería inventarle un recuerdo.
    const compra: CompraCerrada = {
      ts: Date.now(),
      total: totalEntrega,
      lineas: entrega.viajan.map((v) => ({
        nombre: v.nombre,
        cuenta: `${formatearCantidad(v.cantidadQueCruza, v.unidad)} × ${soles(
          v.precio ?? 0
        )}${etiquetaUnitaria(v.unidad)}`,
        monto: v.subtotalQueCruza ?? 0,
      })),
    };
    void repositorioCompras.agregar(compra);
    setCompras((cs) => [compra, ...cs]);

    // La libreta no se vacía: se resuelve. Sobrevive lo que no cruzó.
    const nueva = resolverCompra(libreta, comprados.map((it) => it.ingrediente));
    setLibreta(nueva);
    setUltimaCompra({ n: comprados.length, quedaron: nueva.lineas.length });
    setItems(null);
    ir("entregado");
  }

  // ---------------------------------------------------------------------------

  const nPrefs = Object.keys(perfil.preferencias).length;
  const vacia = libreta.lineas.length === 0;
  // Lo que se va a buscar de verdad: la libreta menos la conversación. Lo que no
  // se busca no desaparece —se enseña aparte, con el motivo—, porque una línea
  // que se ignora en silencio es indistinguible de una línea que se perdió.
  const aBuscar = libreta.lineas.filter((l) => lecturaDe(l).naturaleza === "compra");
  const noSeBusca = libreta.lineas
    .map((l) => ({ linea: l, lectura: lecturaDe(l) }))
    .filter(({ lectura }) => lectura.naturaleza !== "compra");
  // Una libreta vacía la primera vez y una vacía porque acabas de comprar no son
  // el mismo vacío: una necesita que le enseñen el gesto, la otra es un logro.
  const primeraVez = vacia && compras.length === 0 && nPrefs === 0;
  const itemHoja = hoja ? items?.find((it) => it.ingrediente === hoja.ingrediente) : undefined;

  const marco: React.CSSProperties = {
    maxWidth: 460,
    margin: "0 auto",
    minHeight: "100dvh",
    padding: "0 22px",
    boxSizing: "border-box",
    background: color.papel,
  };

  // Antes de saber quién entra no se pinta nada. El papel ya está, así que no
  // hay parpadeo ni spinner: simplemente todavía no hay contenido.
  if (!listo) return <main className="sc-papel" style={marco} />;

  // La puerta. Solo la ve quien nunca ha entrado aquí.
  if (!tieneCasa(casa))
    return (
      <main className="sc-papel" style={marco}>
        <Bienvenida
          onEntrar={(nombre) => {
            const nueva = crearCasa(nombre);
            setCasa(nueva);
            void repositorioCasa.guardar(nueva);
            // Sin foco automático: al entrar por primera vez, las cuatro formas
            // de empezar tienen que verse antes que un teclado abierto.
          }}
        />
      </main>
    );

  return (
    <main className="sc-papel" style={marco}>
      {ruta === "libreta" && (
        <Pantalla
          encabezado={
            <Cabecera monograma={monograma(casa)} nombre={casa.nombre} onCasa={() => ir("casa")} />
          }
          navegacion={
            <Navegacion
              activo="lista"
              cuantos={items?.filter((i) => !i.fuera).length}
              onIr={(l) => ir(l === "lista" ? "libreta" : l)}
            />
          }
          cuerpo={
            <>
              {/* ¿Qué es esto? · ¿Qué pasó desde la última vez? */}
              <Resumen
                nombre={saludo(casa)}
                primeraVez={primeraVez}
                novedad={{
                  ultimaCompra: compras.length ? cuando(compras[0].ts).toLowerCase() : undefined,
                  quedaron: libreta.lineas.filter((l) => l.quedo).length || undefined,
                  aMedias: !!items,
                  anotadas: libreta.lineas.length || undefined,
                }}
              />

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

              {/* La caja no prescribe un formato. "Escribe aquí tu lista de
                  compras" hacía sentir que existe una forma correcta de
                  escribir; el normalizador ya se encarga de interpretar, así que
                  la interfaz no tiene por qué pedir nada. */}
              <Compositor
                ref={compRef}
                valor={borrador}
                marcador={vacia ? "escribe o pega lo que sea" : undefined}
                onEscribir={setBorrador}
                onEnter={() => {
                  if (anotarTexto(borrador)) setBorrador("");
                }}
                onPegar={alPegar}
              />

              {/* Comprarlo todo no es lo mismo que no haber empezado nunca.
                  Aquí el vacío es un logro, y se dice una vez. El único emoji de
                  la aplicación; el chiste está en el "por ahora". */}
              {vacia && !primeraVez && <Lapiz>todo comprado 🎉 por ahora</Lapiz>}

              {/* Cuatro formas EQUIVALENTES de empezar. Ninguna es la principal:
                  escribir aparece entre las otras tres y con el mismo peso, y no
                  las encabeza ningún "también puedes" que las subordine. Las
                  cuatro desembocan en la misma compra — cambia el gesto, no la
                  tarea. */}
              <Acciones
                titulo={vacia ? "Puedes empezar por donde quieras:" : undefined}
                acciones={[
                  {
                    clave: "escribir",
                    icono: "✎",
                    nombre: "Escribir",
                    onClick: () => compRef.current?.focus(),
                  },
                  {
                    clave: "pegar",
                    icono: "⌘",
                    nombre: "Pegar un mensaje",
                    onClick: () => {
                      compRef.current?.focus();
                      setAviso({ texto: "Pega aquí lo que sea: un WhatsApp, una lista, un menú." });
                    },
                  },
                  {
                    clave: "foto",
                    icono: "◫",
                    nombre: "Importar una compra",
                    onClick: () => archivoRef.current?.click(),
                  },
                  {
                    clave: "menu",
                    icono: "☰",
                    nombre: "Cargar un menú",
                    onClick: () => setHojaMenus(true),
                  },
                ]}
              />

              {/* El eco iría aquí cuando exista. Hoy no existe y no se finge. */}
            </>
          }
          pie={
            <>
              {/* ¿Cuál es el siguiente paso natural? Uno solo, y con el nombre
                  de lo que va a pasar. Si hay una compra a medias, seguirla es
                  el paso — volver a "hacer la compra" perdería las correcciones
                  que ya hizo. */}
              {items && (
                <Boton
                  variante="fantasma"
                  onClick={() => ir("compra")}
                  style={{ width: "100%", marginBottom: 8 }}
                >
                  Seguir con mi carrito
                </Boton>
              )}

              {/* ⚠️ Fantasma, jamás verde. Comprar no es un CTA: si el botón
                  grita, el producto deja de acompañar y empieza a empujar. */}
              <Boton
                variante="fantasma"
                onClick={() => ir("revision")}
                disabled={aBuscar.length === 0}
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
              {/* Aquí solo aparece lo que de verdad se va a buscar. El «Mami» y
                  el «lista del mercado» del mensaje siguen escritos en la
                  libreta —son suyos— pero prometer que los buscamos sería
                  mentir, y una sola línea así delata al producto entero. */}
              {aBuscar.map((l) => (
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
              {/* La otra mitad de la honestidad: enseñar lo que NO vamos a
                  buscar, decir por qué, y dejar la puerta abierta. Preferimos
                  preguntar por una línea rara a devolver un sofá cama porque
                  alguien escribió «gracias». */}
              {noSeBusca.length > 0 && (
                <div style={{ marginTop: 26 }}>
                  <p style={{ ...rotulo, margin: "0 0 8px" }}>ESTO NO PARECE COMPRA</p>
                  <p style={{ ...lapiz, margin: "0 0 12px" }}>
                    Lo dejo anotado sin buscarlo. Si me equivoqué, dímelo.
                  </p>
                  {noSeBusca.map(({ linea, lectura }) => (
                    <Fila
                      key={linea.id}
                      titulo={linea.texto}
                      nota={lectura.motivo}
                      derecha={
                        <Boton
                          variante="fantasma"
                          chico
                          onClick={() => setLibreta((lb) => marcarCompra(lb, linea.id, true))}
                        >
                          Sí es compra
                        </Boton>
                      }
                    />
                  ))}
                </div>
              )}
              {vacia && (
                <Vacio titulo="Quitaste todo." texto="Tu compra te espera igual." />
              )}
            </>
          }
          pie={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ ...lapiz, flex: 1 }}>
                {aBuscar.length} {aBuscar.length === 1 ? "cosa" : "cosas"}
              </span>
              <Boton variante="lleno" onClick={buscarPrecios} disabled={aBuscar.length === 0}>
                Buscar precios
              </Boton>
            </div>
          }
        />
      )}

      {ruta === "compra" && (
        <Pantalla
          titulo="El carrito"
          onVolver={() => ir(items ? "revision" : "libreta")}
          navegacion={
            <Navegacion
              activo="compra"
              cuantos={items?.filter((i) => !i.fuera).length}
              onIr={(l) => ir(l === "lista" ? "libreta" : l)}
            />
          }
          cuerpo={
            buscando ? (
              <PantallaCalma
                estado="esperando"
                titulo="Buscando precios en Wong"
                texto="Tarda unos segundos. Puedes seguir escribiendo mientras tanto."
              />
            ) : !items ? (
              <Vacio
                titulo="Aquí verás tu carrito cuando busques precios."
                texto="Se arma sola con lo que vayas anotando."
                accion={
                  <Boton variante="fantasma" onClick={() => ir("libreta")}>
                    Ir a mi compra
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
                      onCantidad={
                        estado === "confirmado" && !it.fuera
                          ? {
                              menos: () => moverCantidad(it, -1),
                              mas: () => moverCantidad(it, 1),
                              abrir: () =>
                                setHoja({ tipo: "cantidad", ingrediente: it.ingrediente }),
                            }
                          : undefined
                      }
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
                  <Boton variante="lleno" onClick={() => ir("entregar")}>
                    Llevar a Wong
                  </Boton>
                </div>
              </>
            ) : undefined
          }
        />
      )}

      {/* La entrega. NO es un checkout: es el traspaso. Aquí se enseña qué cruza
          y qué no ANTES de saltar, porque descubrirlo del otro lado —en la web
          de Wong, con la compra ya empezada— es donde se pierde la confianza. */}
      {ruta === "entregar" && (
        <Pantalla
          titulo="Llevar a Wong"
          onVolver={() => ir("compra")}
          cuerpo={
            <>
              {/* Volvemos a prometer el carrito, pero ahora está comprobado: el
                  enlace lleva el canal de venta real de la tienda (sc=70) y se
                  verificó leyendo el carrito, no fiándose de la respuesta. */}
              <p style={{ lineHeight: 1.55, margin: "2px 0 10px", color: color.tinta }}>
                Abro tu carrito en Wong con {entrega.viajan.length}{" "}
                {entrega.viajan.length === 1 ? "producto" : "productos"} dentro. Pagas
                allá, con tu cuenta de siempre. Nosotros no tocamos tu tarjeta.
              </p>

              {/* Avisar del login ANTES de saltar. Wong pedirá la sesión cuando
                  le apetezca, y eso no lo controlamos; lo que sí controlamos es
                  que no parezca que fallamos nosotros. Una familia advertida
                  inicia sesión; una familia sorprendida cierra la pestaña.
                  Se dice como posibilidad —«si te pide»— porque prometer que
                  ocurrirá, o que no, sería inventarnos lo que hará Wong. */}
              <p style={{ ...lapiz, margin: "0 0 16px" }}>
                Si Wong te pide iniciar sesión, es normal: el carrito se arma
                dentro de tu cuenta, no de la nuestra.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  paddingBottom: 14,
                  marginBottom: 14,
                  borderBottom: `1px solid ${color.renglon}`,
                }}
              >
                <span>
                  <span style={{ ...rotulo, display: "block" }}>Lo que llevas</span>
                  <span style={{ ...lapiz, fontSize: 12 }}>
                    precios de la web de Wong · el total lo confirma tu tienda
                  </span>
                </span>
                <span style={{ ...plata, fontSize: 25, letterSpacing: "-0.03em" }}>
                  {soles(totalEntrega)}
                </span>
              </div>

              {/* Redondeos a la vista. Wong vende la trucha de 400 en 400 g: si
                  pediste 500, cruzan 800. Siempre hacia arriba —quedarse corto
                  no se arregla en la cocina— y jamás en silencio. */}
              {ajustes.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <Seccion>Lo que subí para que Wong pueda venderlo</Seccion>
                  {ajustes.map((a) => (
                    <p key={a.nombre} style={{ ...lapiz, margin: "4px 0" }}>
                      {a.nombre}: pediste {a.pedida} · van {a.cruza} (Wong lo vende
                      así)
                    </p>
                  ))}
                </div>
              )}

              {entrega.sequedan.length > 0 && (
                <div>
                  <Seccion>Esto no cruza</Seccion>
                  {entrega.sequedan.map((s) => (
                    <p key={s.nombre} style={{ ...lapiz, margin: "4px 0" }}>
                      {s.nombre} — {s.motivo}. Sigue anotado.
                    </p>
                  ))}
                </div>
              )}
            </>
          }
          pie={
            entrega.url ? (
              // Un enlace de verdad, no un onClick: el salto lo da la familia y
              // el navegador lo abre con SU sesión de Wong —su tienda, su zona,
              // su login—.
              //
              // El enlace SÍ fija el canal de venta (sc=70). Antes no lo hacía,
              // con el razonamiento de que heredar el contexto de la familia era
              // más respetuoso que imponerle uno; sonaba bien y era falso: sin
              // `sc` la petición devuelve 500 y no entrega nada. El canal es de
              // la tienda, no de la familia.
              <a
                href={entrega.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={entregar}
                style={{ textDecoration: "none", display: "block" }}
              >
                <Boton variante="lleno" style={{ width: "100%" }}>
                  Abrir mi carrito en Wong
                </Boton>
              </a>
            ) : (
              <p style={{ ...lapiz, textAlign: "center" }}>
                Todavía no hay nada que llevar.
              </p>
            )
          }
        />
      )}

      {/* Ya no decimos "compraste": no compró nada aquí. Decimos dónde está su
          compra ahora y qué le falta hacer. El final del recorrido está en Wong,
          no en esta pantalla. */}
      {ruta === "entregado" && (
        <PantallaCalma
          estado="listo"
          titulo={`Tu compra está en Wong: ${ultimaCompra?.n ?? 0} ${
            ultimaCompra?.n === 1 ? "producto" : "productos"
          }.`}
          texto={
            (ultimaCompra?.quedaron ?? 0) > 0
              ? "Termina el pago allá. Lo que no cruzó sigue anotado aquí para la próxima."
              : "Solo te falta pagar allá. Tu libreta quedó limpia."
          }
          accion={{ texto: "Volver a mi compra", onClick: () => ir("libreta") }}
        />
      )}

      {ruta === "casa" && (
        <Pantalla
          titulo={casa.nombre}
          onVolver={() => ir("libreta")}
          navegacion={
            <Navegacion
              activo="casa"
              cuantos={items?.filter((i) => !i.fuera).length}
              onIr={(l) => ir(l === "lista" ? "libreta" : l)}
            />
          }
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
  if (pref.cantidadHabitual != null)
    return `${cosa}, ${formatearCantidad(
      pref.cantidadHabitual,
      pref.unidadHabitual ?? "un"
    )} de siempre`;
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
