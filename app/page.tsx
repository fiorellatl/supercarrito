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

import { primeEnEnvio } from "@/lib/prime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  aprenderCantidad,
  aprenderDeCorreccion,
  contarPreguntasEvitadas,
  elegir,
  elegirDistrito,
  elegirTienda,
  perfilVacio,
  responderPago,
  preferenciaDe,
  clave,
  type Perfil,
  type Preferencia,
} from "@/lib/preferencias";
import { etiquetaUnitaria, formatearCantidad } from "@/lib/cantidades";
import {
  repositorioCarrito,
  repositorioCompras,
  repositorioHistorial,
  repositorioLibreta,
  repositorioListas,
  repositorioPerfil,
  type CompraCerrada,
  type ListaGuardada,
} from "@/lib/perfil-store";
import type { ItemResuelto } from "@/lib/carrito";
import { ahora } from "@/lib/historial";
import {
  anotar,
  aPedidos,
  deshacerUltimoBloque,
  lecturaDe,
  libretaVacia,
  marcarCompra,
  partir,
  quitar,
  type Libreta,
  type Linea,
} from "@/lib/libreta";
import type { LineaExtraida } from "@/lib/evidencia";
import type { ProductoWong } from "@/lib/catalog";
import type { ConTarjeta } from "@/lib/tarjetas";
import { entregaPorEnlace, unidadesDeVenta } from "@/lib/entrega";
import { cadenaDe, cadenasDisponibles } from "@/lib/cadenas";
import type { LineaAValorar, Tienda } from "@/lib/tienda";

import { casaVacia, crearCasa, monograma, saludo, tieneCasa, type Casa } from "@/lib/casa";
import { repositorioCasa } from "@/lib/perfil-store";

import { color, fuente, lapiz, plata, rotulo, soles } from "@/app/ui/sistema";
import Aviso from "@/app/ui/Aviso";
import EligeAqui from "@/app/ui/EligeAqui";
import Bienvenida from "@/app/ui/Bienvenida";
import Cabecera from "@/app/ui/Cabecera";
import Navegacion from "@/app/ui/Navegacion";
import Boton from "@/app/ui/Boton";
import Fila from "@/app/ui/Fila";
import Hoja from "@/app/ui/Hoja";
import HojaCantidad from "@/app/ui/HojaCantidad";
import HojaOpciones from "@/app/ui/HojaOpciones";
import EligeTienda, { ListaTiendas } from "@/app/ui/EligeTienda";
import EligePago from "@/app/ui/EligePago";
import { Compositor } from "@/app/ui/Libreta";
import LineaCarrito, { type EstadoLinea } from "@/app/ui/LineaCarrito";
import { Pantalla, Seccion, Vacio } from "@/app/ui/Pantalla";
import {
  Desplegable,
  FilaPago,
  HojaPago,
  HojaTottus,
  OTRO_DISTRITO,
  OtraTienda,
  TottusCard,
  TuTienda,
  type EstadoComparar,
  type EstadoTottus,
  type EstadoEnvio,
} from "@/app/ui/Revisar";
import type { LineaAComparar } from "@/lib/comparar";
import PantallaCalma from "@/app/ui/PantallaCalma";
import Papaya, { type Pepa } from "@/app/ui/Papaya";
import AsiFunciona from "@/app/ui/AsiFunciona";

// Rediseño del flujo (2026-11-26, PO): dos pasos y no cinco. La lista ES el
// carrito —cada línea se convierte en su producto al anotarla— y «pedir» es el
// único paso aparte. Desaparecen la revisión, la pantalla de tienda (ahora una
// hoja) y el carrito como lugar propio.
type Ruta = "lista" | "pedir" | "entregado" | "casa" | "boleta" | "milista";

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
  sinRespuesta?: string[];
};

// Qué tan adentro está cada lugar. Solo sirve para saber si un cambio de
// pantalla es entrar o salir; no ordena nada más.
const profundidad: Record<Ruta, number> = {
  lista: 0,
  casa: 0,
  boleta: 1,
  milista: 1,
  pedir: 1,
  entregado: 2,
};

// `ItemResuelto` vive en `lib/carrito.ts`: es un modelo que se GUARDA, y por eso
// ya no puede vivir dentro de una pantalla.

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
    // «pan» no dice cuál; «pan bimbo integral» sí. Si la marca del propuesto ya
    // está en lo que escribió, no hay nada que preguntar.
    const encontrados = candidatos.filter((c) => c.encontrado);
    const dijoLaMarca = !!elegido?.marca && clave(it.ingrediente).includes(clave(elegido.marca));
    const porElegir = !porPerfil && encontrados.length > 1 && !dijoLaMarca;

    if (porPerfil && candidatos.length > 1) evitadas++;

    const esPeso = (elegido?.unidadVenta ?? "un") === "kg";
    const veniaEnLaEvidencia = it.cantidadPedida != null && it.unidadPedida === "kg";
    if (esPeso && !veniaEnLaEvidencia && pref?.cantidadHabitual != null) evitadas++;

    return {
      ingrediente: it.ingrediente,
      candidatos,
      elegido,
      porPerfil,
      porElegir,
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
// Cuánto se ahorra pidiendo en la otra cadena, para ordenar las tarjetas.
function ahorroDe(e: EstadoComparar): number {
  if (e.tipo !== "listo" || e.origen.total == null || e.destino.total == null) return -Infinity;
  return e.origen.total - e.destino.total;
}

// El precio con tarjeta solo se enseña a quien dijo que la tiene.
function tarjetaDeLaFamilia(p: ProductoWong | undefined, perfil: Perfil): ConTarjeta | undefined {
  const suyas = perfil.pago?.tarjetas ?? [];
  return p?.conTarjeta?.filter((c) => suyas.includes(c.tarjeta)).sort((a, b) => a.precio - b.precio)[0];
}

function cantidadDe(it: ItemResuelto, perfil: Perfil): number | undefined {
  const unidad = it.elegido?.unidadVenta ?? "un";
  if (it.cantidadElegida != null) return it.cantidadElegida;
  if (it.cantidadPedida != null && it.unidadPedida === unidad) return it.cantidadPedida;
  // La familia pidió en otra unidad que la de venta: «2 kg de papa» y Wong la
  // vende en bolsas de 1 kg. Si la cuenta es exacta (2 bolsas) se usa, y se ve
  // en la línea como «2 × S/ 3.20 · 1 kg». Si no es exacta, NO se redondea ni
  // se cae a «1» en silencio: queda pendiente y la familia decide.
  // (Encontrado en la prueba de punta a punta, 2026-11-26.)
  if (it.cantidadPedida != null && it.unidadPedida && it.unidadPedida !== unidad) {
    if (it.unidadPedida === "kg" && unidad === "un") {
      const m = (it.elegido?.presentacion ?? it.elegido?.nombre ?? "").match(/(\d+(?:[.,]\d+)?)\s*(kg|g)\b/i);
      if (m) {
        const pesoKg = Number(m[1].replace(",", ".")) / (m[2].toLowerCase() === "g" ? 1000 : 1);
        const n = it.cantidadPedida / pesoKg;
        if (pesoKg > 0 && Math.abs(n - Math.round(n)) < 0.001 && Math.round(n) >= 1) return Math.round(n);
      }
    }
    return undefined;
  }

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
  if (it.porElegir) return undefined;
  const cantidad = cantidadDe(it, perfil);
  if (cantidad == null || p.precio == null) return undefined;
  return Math.round(p.precio * cantidad * 100) / 100;
}

// El total solo cuenta lo confirmado. Un total que aparenta estar completo
// cuando no lo está es el mismo pecado que un precio inexplicable, una escala
// más arriba. Lo que se dejó anotado no suma y tampoco cuenta como pendiente:
// ya no es una pregunta abierta, es una decisión tomada.
//
// Y hace falta saber CUÁNTOS productos aportan de verdad un monto. Un producto
// agotado suma cero —correcto: no se va a pagar— pero si todos lo están, la
// suma da 0 y la pantalla enseñaba «TOTAL S/ 0.00» con tres productos a la
// vista. Ese número no es un total, es la ausencia de uno, y presentarlo como
// total es la misma mentira que un monto inventado. La casa ya tiene la regla
// escrita en cada línea del carrito: lo que no sabemos vale un guion, jamás un
// cero.
function totalDe(items: ItemResuelto[], perfil: Perfil) {
  let total = 0;
  let pendientes = 0;
  let cuentan = 0;
  for (const it of items) {
    if (it.fuera) continue;
    const s = subtotalDe(it, perfil);
    if (s === undefined) pendientes++;
    else {
      total += s;
      if (s > 0) cuentan++;
    }
  }
  return { total: Math.round(total * 100) / 100, pendientes, cuentan };
}

function estadoDe(it: ItemResuelto, subtotal?: number): EstadoLinea {
  if (!it.elegido?.encontrado) return "sin-resultado";
  // Sin elegir no hay producto puesto: que el primero del catálogo esté agotado
  // no dice nada de la compra de la familia. Las opciones lo muestran una a una.
  if (it.porElegir) return "pendiente";
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
  // Un producto agotado se nombra con la tienda que lo dijo. "No hay" a secas es
  // una limitación nuestra; "no hay en tu Wong de Óvalo Gutiérrez" es un dato
  // del mundo, y además explica por qué su compra no suma lo que esperaba.
  if (estado === "agotado")
    return {
      tono: "problema",
      texto: perfil.tienda
        ? `no hay en ${perfil.tienda.nombre} · lo dejé anotado`
        : "lo dejé anotado igual",
    };
  if (estado === "pendiente" && it.porElegir)
    return { tono: "pendiente", texto: "la primera vez eliges tú" };
  if (estado === "pendiente") return { tono: "pendiente", texto: "pendiente de confirmar" };
  if (estado === "sin-resultado") return undefined;
  if (it.cantidadElegida != null) return { tono: "confirmado", texto: "lo acabas de confirmar" };
  if (it.recienElegido) return { tono: "confirmado", texto: "lo acabas de elegir" };
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
  const [ruta, setRuta] = useState<Ruta>("lista");

  const [libreta, setLibreta] = useState<Libreta>(libretaVacia());
  const [borrador, setBorrador] = useState("");

  const [casa, setCasa] = useState<Casa>(casaVacia());
  // Hasta que sepamos si esta casa ya existe no se pinta nada: enseñar la
  // bienvenida a alguien que lleva tres semanas usando el producto sería peor
  // que esperar 50 ms.
  const [listo, setListo] = useState(false);

  const [perfil, setPerfil] = useState<Perfil>(perfilVacio());
  const [compras, setCompras] = useState<CompraCerrada[]>([]);
  const [verCompra, setVerCompra] = useState<CompraCerrada | null>(null);
  // Listas con nombre (pedido de la PO, 2026-11-27). El nombre se pregunta
  // DESPUÉS del salto a Wong, sobre la compra que acaba de cruzar.
  const [listas, setListas] = useState<ListaGuardada[]>([]);
  const [verListaId, setVerListaId] = useState<string | null>(null);
  const [compraRecien, setCompraRecien] = useState<CompraCerrada | null>(null);
  const [nombreLista, setNombreLista] = useState("");
  const [renombrando, setRenombrando] = useState(false);
  const verLista = listas.find((l) => l.id === verListaId) ?? null;

  const [items, setItems] = useState<ItemResuelto[] | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; deshacer?: number; recuperar?: () => void } | null>(null);
  const [menus, setMenus] = useState<MenuResumen[]>([]);
  const [hojaMenus, setHojaMenus] = useState(false);
  const [hoja, setHoja] = useState<{ tipo: "cantidad" | "opciones"; ingrediente: string } | null>(null);
  const [ultimaCompra, setUltimaCompra] = useState<{ n: number; quedaron: number } | null>(null);

  // La tienda de la familia. `preciosDeTienda` es lo que decide si el carrito
  // enseña precios reales o referenciales, y hay que poder distinguir "todavía
  // no pregunté" de "pregunté y no me contestaron": callar la diferencia sería
  // enseñar un número sin decir de dónde viene.
  const [tiendas, setTiendas] = useState<Tienda[] | null>(null);
  const [preciosDeTienda, setPreciosDeTienda] = useState<boolean | null>(null);
  const [totalTienda, setTotalTienda] = useState<number | null>(null);
  // Para qué tienda ya contestó la valoración (bien o mal). Mientras la tienda
  // elegida no haya contestado, el total del pie NO se enseña: el de catálogo
  // cambiaba un segundo después al llegar el de la tienda (bitácora O2), y un
  // total que se mueve solo enseña a desconfiar del total.
  const [valoradaPara, setValoradaPara] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [envio, setEnvio] = useState<EstadoEnvio>({ tipo: "sin-distrito" });
  const [hojaPago, setHojaPago] = useState(false);
  // Una comparación por cada otra cadena, en el orden de lib/cadenas.ts.
  const [comparaciones, setComparaciones] = useState<{ id: string; estado: EstadoComparar }[]>([]);
  // Tottus, aparte: solo se compara (lib/tottus.ts).
  const [tottus, setTottus] = useState<EstadoTottus>({ tipo: "nada" });
  const [hojaTottus, setHojaTottus] = useState(false);
  const [marcadosTottus, setMarcadosTottus] = useState<string[]>([]);

  const compRef = useRef<HTMLInputElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const cargada = useRef(false);
  const carritoCargado = useRef(false);
  const rutaPrevia = useRef<Ruta>("lista");
  // Líneas que ya se le preguntaron a Wong y todavía no contestaron. El ref evita
  // preguntar dos veces lo mismo; el estado es para pintar «buscando…».
  const enVuelo = useRef(new Set<string>());
  const [buscandoIds, setBuscandoIds] = useState<Set<string>>(new Set());
  // Hasta tener la lista Y el carrito guardados no se resuelve nada: si no, una
  // línea que ya tenía su producto se volvería a emparejar al abrir.
  const [arrancado, setArrancado] = useState(false);
  const [hojaTienda, setHojaTienda] = useState(false);
  // «Así funciona»: solo justo después de elegir la tienda por primera vez.
  const [verAsiFunciona, setVerAsiFunciona] = useState(false);
  const [verPago, setVerPago] = useState(false);
  // «Una decisión a la vez»: al tocar Resolver, las hojas se suceden solas,
  // una por producto que espera algo de la familia, hasta que no queda nada.
  // `total` es cuántas había al empezar, para decir «2 de 3».
  const [cola, setCola] = useState<{ total: number } | null>(null);
  // Sin tienda no se entra a la lista (decisión de la PO, 2026-11-26). La única
  // excepción: Wong no devolvió sus tiendas y la familia eligió seguir sin ella.
  const [perfilListo, setPerfilListo] = useState(false);
  const [sinTiendaPorAhora, setSinTiendaPorAhora] = useState(false);
  const pideTienda = perfilListo && !perfil.tienda && !sinTiendaPorAhora;
  useEffect(() => {
    if (pideTienda && tiendas === null) void cargarTiendas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pideTienda, tiendas]);
  const [verRuido, setVerRuido] = useState(false);
  const [horaPrecios, setHoraPrecios] = useState<number | null>(null);
  // La cadena de la tienda elegida («Wong», «Metro»): todo lo que la pantalla
  // dice de «la tienda» la nombra así. Sin tienda, Wong, como siempre.
  const tuCadena = cadenaDe(perfil.tienda?.cadena).nombre;
  const perfilRef = useRef(perfil);
  perfilRef.current = perfil;

  // --- Persistencia. El trabajo no se pierde jamás: se guarda en cada cambio.
  useEffect(() => {
    void repositorioCasa.cargar().then((c) => {
      setCasa(c);
      setListo(true);
    });
    void repositorioPerfil.cargar().then((p) => {
      setPerfil(p);
      setPerfilListo(true);
    });
    void repositorioCompras.cargar().then(setCompras);
    void repositorioListas.cargar().then(setListas);
    // El carrito vuelve tal y como se dejó: los mismos productos, los mismos
    // SKU, las mismas cantidades. Los precios y el stock los volverá a preguntar
    // el efecto de la tienda —eso sí caduca—, pero nadie vuelve a decidir CUÁL
    // era el producto.
    void Promise.all([repositorioLibreta.cargar(), repositorioCarrito.cargar()]).then(
      ([l, c]) => {
        setLibreta(l);
        cargada.current = true;
        // Carritos guardados antes del rediseño no sabían de qué línea salía
        // cada producto. Se les devuelve su línea por el texto; lo que no
        // encaja se vuelve a buscar, nunca se inventa.
        const porTexto = new Map(l.lineas.map((x) => [clave(x.texto), x.id]));
        const conLinea = (c ?? [])
          .map((it) => (it.lineaId ? it : { ...it, lineaId: porTexto.get(clave(it.ingrediente)) }))
          .filter((it) => it.lineaId);
        if (conLinea.length > 0) setItems(conLinea);
        carritoCargado.current = true;
        setArrancado(true);
      }
    );
    fetch("/api/menus")
      .then((r) => r.json())
      .then((d) => setMenus(d.menus ?? []))
      .catch(() => setMenus([]));
  }, []);

  useEffect(() => {
    if (cargada.current) void repositorioLibreta.guardar(libreta);
  }, [libreta]);

  useEffect(() => {
    if (carritoCargado.current) void repositorioCarrito.guardar(items);
  }, [items]);

  // El cursor ya está puesto: abrir y escribir son el mismo gesto.
  useEffect(() => {
    // El cursor se pone solo cuando ya hay algo empezado: volver a añadir una
    // línea es el gesto más frecuente y no debe costar un toque. Pero en una
    // compra vacía NO se enfoca —abrir el teclado de golpe convertiría escribir
    // en el camino principal, y escribir, pegar, importar y cargar un menú son
    // formas equivalentes de empezar (decisión de la PO, 2026-08-02).
    if (ruta === "lista" && libreta.lineas.length > 0)
      compRef.current?.focus({ preventScroll: true });
  }, [ruta, libreta.lineas.length]);

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

  const { total, pendientes, cuentan } = useMemo(
    () => totalDe(items ?? [], perfil),
    [items, perfil]
  );

  // --- Los precios de SU tienda ----------------------------------------------
  // Lo que la familia ve tiene que ser lo que va a pagar. El catálogo público no
  // tiene tienda —devuelve un precio único y "hay de todo"—, así que antes de
  // pintar el carrito le preguntamos a la suya.

  // Se pregunta en dos grupos, y la diferencia importa:
  //
  //   · `aCobrar` — lo que ya tiene cantidad. Va con las unidades de venta
  //     exactas que viajarán en el enlace, y de ahí sale EL TOTAL. Preguntar por
  //     otras cantidades daría un número que luego no cuadraría con el carrito de
  //     Wong, que es justo lo que venimos a arreglar.
  //   · `aTantear` — lo que todavía no tiene cantidad. Se pregunta por una
  //     unidad, solo para saber su precio y si lo hay. Su respuesta NO suma:
  //     enseñar el precio de catálogo de un producto pendiente sería seguir
  //     mintiendo en pequeño, y encima en el sitio donde la familia va a decidir
  //     cuánto lleva.
  const { aCobrar, aTantear } = useMemo(() => {
    const cobrar: LineaAValorar[] = [];
    const tantear: LineaAValorar[] = [];
    for (const it of items ?? []) {
      if (it.fuera) continue;
      const p = it.elegido;
      if (!p?.encontrado || !p.sku) continue;
      const c = cantidadDe(it, perfil);
      if (c != null) cobrar.push({ sku: p.sku, unidades: unidadesDeVenta(c, p) });
      else tantear.push({ sku: p.sku, unidades: 1 });
    }
    return { aCobrar: cobrar, aTantear: tantear };
  }, [items, perfil]);

  // Firma de lo que se va a preguntar. Si no cambia, no se vuelve a preguntar:
  // cambiar de producto o de cantidad sí, repintar no.
  const firmaValorar = useMemo(
    () =>
      [...aCobrar, ...aTantear].map((l) => `${l.sku}:${l.unidades}`).join("|"),
    [aCobrar, aTantear]
  );

  const idTienda = perfil.tienda?.id;

  // La misma compra en la otra cadena (bloque B). Solo con tienda elegida, solo
  // en «Revisar y pedir» y solo con lo que tiene cantidad: lo mismo que viajaría.
  const aComparar = useMemo(() => {
    const ls: LineaAComparar[] = [];
    for (const it of items ?? []) {
      const p = it.elegido;
      if (it.fuera || !p?.encontrado || !p.sku) continue;
      const c = cantidadDe(it, perfil);
      if (c == null) continue;
      ls.push({
        sku: p.sku,
        ean: p.ean,
        unidades: unidadesDeVenta(c, p),
        nombre: p.nombre ?? it.ingrediente,
        marca: p.marca,
        unidadVenta: p.unidadVenta,
        cantidadMinima: p.cantidadMinima,
      });
    }
    return ls;
  }, [items, perfil]);
  const firmaComparar = aComparar.map((l) => `${l.sku}:${l.unidades}`).join("|");
  const hayOtraCadena = cadenasDisponibles().length > 1;
  useEffect(() => {
    if (ruta !== "pedir" || !perfil.tienda || !hayOtraCadena || aComparar.length === 0) {
      setComparaciones([]);
      setTottus({ tipo: "nada" });
      return;
    }
    let vivo = true;
    const otras = cadenasDisponibles().filter((c) => c.id !== cadenaDe(perfil.tienda?.cadena).id);
    setComparaciones(otras.map((c) => ({ id: c.id, estado: { tipo: "cargando" } })));
    const poner = (id: string, estado: EstadoComparar) =>
      vivo && setComparaciones((xs) => xs.map((x) => (x.id === id ? { id, estado } : x)));
    setTottus({ tipo: "cargando" });
    fetch("/api/comparar-tottus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tienda: perfil.tienda, lineas: aComparar }),
    })
      .then((r) => r.json())
      .then((d) => vivo && setTottus(d.ok ? { tipo: "listo", ...d } : { tipo: "sin-respuesta" }))
      .catch(() => vivo && setTottus({ tipo: "sin-respuesta" }));
    for (const c of otras) {
      fetch("/api/comparar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tienda: perfil.tienda, lineas: aComparar, distrito: perfil.envio?.distrito, destino: c.id }),
      })
        .then((r) => r.json())
        .then((d) => poner(c.id, d.ok ? { tipo: "listo", ...d } : { tipo: "sin-respuesta" }))
        .catch(() => poner(c.id, { tipo: "sin-respuesta" }));
    }
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta, firmaComparar, idTienda, perfil.envio?.distrito, hayOtraCadena]);

  // El envío, preguntado a la tienda solo en «Revisar y pedir» y solo con lo
  // que de verdad va a viajar. Es SU tarifa para el distrito: no se calcula.
  const distritoEnvio = perfil.envio?.distrito;
  const firmaEnvio = aCobrar.map((l) => `${l.sku}:${l.unidades}`).join("|");
  useEffect(() => {
    if (ruta !== "pedir") return;
    if (!distritoEnvio || distritoEnvio === OTRO_DISTRITO) {
      setEnvio({ tipo: "sin-distrito" });
      return;
    }
    if (aCobrar.length === 0) {
      setEnvio({ tipo: "sin-respuesta" });
      return;
    }
    let vivo = true;
    setEnvio({ tipo: "cargando" });
    fetch("/api/envio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tienda: perfil.tienda, lineas: aCobrar, distrito: distritoEnvio }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return;
        if (!d.ok) setEnvio({ tipo: "sin-respuesta" });
        else if (!d.hay || typeof d.precio !== "number") setEnvio({ tipo: "no-llega" });
        else
          setEnvio({
            tipo: "listo",
            precio: d.precio,
            precioMaximo: d.precioMaximo,
            desde: d.desde,
            hasta: d.hasta,
          });
      })
      .catch(() => vivo && setEnvio({ tipo: "sin-respuesta" }));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruta, distritoEnvio, firmaEnvio, idTienda]);

  useEffect(() => {
    if (!perfil.tienda || firmaValorar === "") return;
    let vivo = true;
    (async () => {
      try {
        const preguntar = (lineas: LineaAValorar[]) =>
          fetch("/api/precios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tienda: perfil.tienda, lineas }),
          }).then((r) => r.json());

        // Las dos preguntas van en paralelo: la del total y la de tanteo.
        const [cobro, tanteo] = await Promise.all([
          aCobrar.length > 0 ? preguntar(aCobrar) : Promise.resolve({ ok: true, lineas: [] }),
          aTantear.length > 0 ? preguntar(aTantear) : Promise.resolve({ ok: true, lineas: [] }),
        ]);
        if (!vivo) return;
        setValoradaPara(perfil.tienda?.id ?? null);
        setHoraPrecios(Date.now());
        if (!cobro.ok || !tanteo.ok) {
          setPreciosDeTienda(false);
          return;
        }
        setPreciosDeTienda(true);
        // El total sale SOLO de lo que tiene cantidad. El tanteo no suma.
        setTotalTienda(typeof cobro.total === "number" ? cobro.total : null);
        const data = { lineas: [...(cobro.lineas ?? []), ...(tanteo.lineas ?? [])] };

        // El precio y la disponibilidad de la tienda SUSTITUYEN a los del
        // catálogo sobre el mismo producto. Se aplican aquí, una sola vez, para
        // que el resto de la pantalla —subtotales, estados, entrega— siga
        // funcionando igual sin saber que existe una tienda.
        type Dato = { sku: string; precio?: number; disponible: boolean; conTarjeta?: ConTarjeta[] };
        const porSku = new Map<string, Dato>((data.lineas ?? []).map((l: Dato) => [l.sku, l]));
        setItems((xs) =>
          (xs ?? []).map((it) => {
            const p = it.elegido;
            const dato = p?.sku ? porSku.get(p.sku) : undefined;
            if (!p || !dato) return it;
            return {
              ...it,
              elegido: {
                ...p,
                // Un precio de cero no es un precio: es la tienda diciendo que
                // no tiene nada que cobrar por ese SKU hoy. Se conserva el que
                // ya sabíamos —un producto nunca "pierde" su precio— y quien
                // dice lo que pasa es `disponible`.
                precio: dato.precio != null && dato.precio > 0 ? dato.precio : p.precio,
                disponible: dato.disponible,
                // Sin dato de tarjeta (el catálogo no contestó) se conserva el
                // que ya había; una lista vacía es «hoy no hay».
                conTarjeta: dato.conTarjeta
                  ? dato.conTarjeta.length
                    ? dato.conTarjeta
                    : undefined
                  : p.conTarjeta,
              },
            };
          })
        );
      } catch {
        if (vivo) {
          setValoradaPara(perfil.tienda?.id ?? null);
          setPreciosDeTienda(false);
        }
      }
    })();
    return () => {
      vivo = false;
    };
    // Las listas cambian de identidad en cada render; su contenido es `firmaValorar`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmaValorar, idTienda]);

  // La entrega se deriva del carrito, no se guarda: no hay un segundo estado
  // que se pueda desincronizar de lo que la familia está viendo.
  const entrega = useMemo(() => {
    const vivos = (items ?? []).filter((it) => !it.fuera);
    const decididos = vivos.filter(
      (it) => it.elegido?.encontrado && cantidadDe(it, perfil) != null
    );
    const listos = new Set(decididos.map((it) => it.ingrediente));

    const preparada = entregaPorEnlace(cadenaDe(perfil.tienda?.cadena)).preparar(
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
          : `no lo encontré en ${tuCadena}`,
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

  // Lo que la tienda descontaría con la tarjeta de la familia, producto a
  // producto (cantidad × diferencia por unidad). No se resta del total: la
  // tienda lo descuenta al pagar con ella. Se enseña aparte y con su cuenta.
  const conTuTarjeta = useMemo(() => {
    const porIngrediente = new Map((items ?? []).map((it) => [it.ingrediente, it.elegido]));
    const porTarjeta = new Map<string, { tarjeta: string; ahorro: number; productos: number }>();
    for (const v of entrega.viajan) {
      const p = porIngrediente.get(v.ingrediente);
      const tc = tarjetaDeLaFamilia(p, perfil);
      if (!tc || p?.precio == null) continue;
      const t = porTarjeta.get(tc.tarjeta) ?? { tarjeta: tc.tarjeta, ahorro: 0, productos: 0 };
      t.ahorro += (p.precio - tc.precio) * v.cantidadQueCruza;
      t.productos += 1;
      porTarjeta.set(tc.tarjeta, t);
    }
    const mejor = [...porTarjeta.values()].sort((a, b) => b.ahorro - a.ahorro)[0];
    return mejor && mejor.ahorro >= 0.01 ? { ...mejor, ahorro: Math.round(mejor.ahorro * 100) / 100 } : undefined;
  }, [entrega, items, perfil]);

  // El de la tienda manda, pero un cero no es un total: la simulación devuelve
  // `Items: 0` cuando todo lo que le preguntamos está sin stock, y repetirlo
  // como monto sería enseñar que la compra vale cero.
  const montoDeTienda = totalTienda != null && totalTienda > 0 ? totalTienda : null;
  const montoEntrega = montoDeTienda ?? totalEntrega;

  // ¿Estamos esperando a que la tienda elegida diga sus precios?
  const esperandoTienda =
    !!perfil.tienda && firmaValorar !== "" && valoradaPara !== perfil.tienda.id;

  // --- Hacia dónde va cada cambio de pantalla --------------------------------
  // Entrar y volver no pueden sentirse igual. Cada lugar tiene una profundidad y
  // el movimiento la respeta: hacia dentro entra desde la derecha, hacia fuera
  // desde la izquierda. Es lo único que le dice a la familia si está avanzando o
  // deshaciendo, y se dice sin una palabra.
  //
  // Entre lugares de la misma profundidad —las tres pestañas— cuenta como
  // avanzar: no hay jerarquía entre ellos, así que tampoco hay marcha atrás.
  const sentido = profundidad[ruta] >= profundidad[rutaPrevia.current] ? "adelante" : "atras";
  useEffect(() => {
    rutaPrevia.current = ruta;
  }, [ruta]);

  const ir = (r: Ruta) => setRuta(r);

  // --- Las cuatro puertas ----------------------------------------------------

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
    pegarConversacion(texto);
  }

  function pegarConversacion(texto: string) {
    const n = anotarTexto(texto, "pegada");
    setBorrador("");
    // Entra tal cual: con emojis, con "mami" y con faltas. No se toca nada.
    setAviso({ texto: "Pegado. Separé lo que es compra de la conversación.", deshacer: n });
  }

  // El botón «Pegar WhatsApp» pega de verdad. Si el navegador no deja leer el
  // portapapeles (o está vacío), deja la caja lista para pegar a mano.
  async function pegarDelPortapapeles() {
    let texto = "";
    try {
      texto = (await navigator.clipboard?.readText?.()) ?? "";
    } catch {
      texto = "";
    }
    if (texto.trim()) {
      pegarConversacion(texto);
      return;
    }
    compRef.current?.focus();
    setAviso({ texto: "Mantén presionada la caja y elige «Pegar». Yo separo lo que es compra." });
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

  async function cargarTiendas() {
    if (tiendas && tiendas.length > 0) return;
    try {
      const res = await fetch("/api/tiendas");
      const data = await res.json();
      setTiendas(data.tiendas ?? []);
    } catch {
      setTiendas([]);
    }
  }

  // La tienda se elige en una hoja, sobre la propia lista. Es una preferencia
  // de compra, del mismo rango que la marca: cambiarla revalora lo que ya hay.
  function abrirTienda() {
    void cargarTiendas();
    setHojaTienda(true);
  }

  function tomarTienda(t: Tienda) {
    // Cambiar de cadena es cambiar de catálogo: los productos se vuelven a
    // buscar en la nueva (la lista y lo aprendido —marcas, tamaños— se quedan).
    // Cambiar de tienda dentro de la misma cadena solo revalora precios.
    const otraCadena = cadenaDe(perfilRef.current.tienda?.cadena).id !== cadenaDe(t.cadena).id;
    perfilRef.current = elegirTienda(perfilRef.current, t);
    actualizarPerfil((p) => elegirTienda(p, t));
    if (otraCadena) setItems(null);
    setHojaTienda(false);
  }

  // «Pedir en Metro» desde la comparación: cambia la tienda y se lleva los
  // MISMOS productos que se compararon (no los vuelve a buscar: lo comparado es
  // lo que se pide). Las líneas con algo que no entró en la comparación se
  // vuelven a buscar enteras en la nueva cadena. Cantidades y lo aprendido, igual.
  function pedirAlla(destino: Tienda, equivalentes: Record<string, ProductoWong>) {
    perfilRef.current = elegirTienda(perfilRef.current, destino);
    actualizarPerfil((p) => elegirTienda(p, destino));
    setItems((xs) => {
      const lista = xs ?? [];
      const incompletas = new Set(
        lista
          .filter((it) => !it.elegido?.sku || !equivalentes[it.elegido.sku])
          .map((it) => it.lineaId)
      );
      const quedan = lista
        .filter((it) => !incompletas.has(it.lineaId))
        .map((it) => {
          const eq = equivalentes[it.elegido.sku!];
          const elegido = { ...eq, ingrediente: it.elegido.ingrediente };
          return { ...it, elegido, candidatos: [elegido] };
        });
      return quedan.length > 0 ? quedan : null;
    });
  }

  // Una línea, una pregunta a Wong. Cada línea sabe qué productos salieron de
  // ella (`lineaId`): así quitarla o corregirla toca exactamente lo suyo, y un
  // menú que se abre en seis ingredientes sigue siendo una sola línea.
  async function resolverLinea(l: Linea) {
    if (enVuelo.current.has(l.id)) return;
    enVuelo.current.add(l.id);
    setBuscandoIds((s) => new Set(s).add(l.id));
    const sinProducto = (nota: string): ItemResuelto => ({
      ingrediente: l.texto,
      candidatos: [],
      elegido: { ingrediente: l.texto, encontrado: false, motivo: nota, degradado: true },
      porPerfil: false,
      lineaId: l.id,
    });
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineas: aPedidos({ version: 1, lineas: [l] }),
          cadena: perfilRef.current.tienda?.cadena,
        }),
      });
      const data = await res.json();
      let nuevos: ItemResuelto[];
      if (!data.ok || !Array.isArray(data.items) || data.items.length === 0) {
        nuevos = [
          {
            ...sinProducto("no lo entendí"),
            elegido: { ingrediente: l.texto, encontrado: false, motivo: "no lo entendí" },
          },
        ];
      } else {
        const r = resolver(data as CarritoApi, perfilRef.current);
        nuevos = r.items.map((it) => ({ ...it, lineaId: l.id }));
        // Lo que se acaba de escribir y ya quedó puesto se celebra una vez
        // (PO, 2026-11-28). Lo que espera una elección no: ahí aún falta algo.
        const puestos = nuevos.filter((n) => n.elegido?.encontrado && !n.porElegir).length;
        if (l.origen === "escrita" && Date.now() - l.ts < 20000 && puestos > 0)
          setAviso({ texto: `¡${puestos} ${puestos === 1 ? "producto agregado" : "productos agregados"}! Vamos bien.` });
        if (r.evitadas > 0) actualizarPerfil((p) => contarPreguntasEvitadas(p, r.evitadas));
        void repositorioHistorial.agregar({
          tipo: "escribio",
          ts: ahora(),
          texto: l.texto,
          propuestas: r.items.map((it) => ({
            ingrediente: it.ingrediente,
            nombre: it.elegido?.nombre,
            marca: it.elegido?.marca,
            precio: it.elegido?.precio,
            porPerfil: it.porPerfil,
            origen: { proveedor: it.elegido?.proveedor, sku: it.elegido?.sku },
          })),
        });
      }
      setItems((xs) => {
        const otros = (xs ?? []).filter((x) => x.lineaId !== l.id);
        // Lo mismo dos veces (un «arroz» suelto y el arroz de un menú) es
        // memoria repetida, no dos compras: se queda el que ya estaba.
        const ya = new Set(otros.map((x) => clave(x.ingrediente)));
        const skus = new Set(otros.map((x) => x.elegido?.sku).filter(Boolean));
        const propios = nuevos.filter(
          (n) => !ya.has(clave(n.ingrediente)) && !(n.elegido?.sku && skus.has(n.elegido.sku))
        );
        // Si TODO lo de esta línea ya estaba, se dice: la línea se leyó y no
        // trae nada nuevo. Nunca se compra dos veces lo mismo por accidente.
        return [
          ...otros,
          ...(propios.length > 0
            ? propios
            : [
                {
                  ...sinProducto("ya está en tu lista"),
                  elegido: { ingrediente: l.texto, encontrado: false, motivo: "ya está en tu lista" },
                },
              ]),
        ];
      });
    } catch {
      setItems((xs) => [
        ...(xs ?? []).filter((x) => x.lineaId !== l.id),
        sinProducto(`no pude preguntarle a ${tuCadena}`),
      ]);
    } finally {
      enVuelo.current.delete(l.id);
      setBuscandoIds((s) => {
        const n = new Set(s);
        n.delete(l.id);
        return n;
      });
    }
  }

  // La lista manda: lo que es compra y aún no tiene producto se busca solo; lo
  // que ya no está en la lista (o dejó de ser compra) se va del carrito.
  useEffect(() => {
    if (!arrancado) return;
    const compraIds = new Set(
      libreta.lineas.filter((l) => lecturaDe(l).naturaleza === "compra").map((l) => l.id)
    );
    const conItems = new Set((items ?? []).map((i) => i.lineaId));
    for (const l of libreta.lineas)
      if (compraIds.has(l.id) && !conItems.has(l.id)) void resolverLinea(l);
    if ((items ?? []).some((i) => !i.lineaId || !compraIds.has(i.lineaId)))
      setItems((xs) => {
        const quedan = (xs ?? []).filter((i) => i.lineaId && compraIds.has(i.lineaId));
        return quedan.length > 0 ? quedan : null;
      });
    // resolverLinea es estable en lo que importa: lee el perfil por ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrancado, libreta, items]);

  // Volver a preguntar por una línea: se borran sus productos y el efecto de
  // arriba la busca de nuevo.
  function reintentar(lineaId: string) {
    setItems((xs) => {
      const quedan = (xs ?? []).filter((x) => x.lineaId !== lineaId);
      return quedan.length > 0 ? quedan : null;
    });
  }

  // «Repetir esta compra»: lo que cruzó la última vez vuelve a la lista con su
  // cantidad, como líneas nuevas. Se busca por el nombre exacto del producto,
  // que es la búsqueda que mejor acierta en Wong.
  function repetir(c: { lineas: { nombre: string; cantidad?: number; unidad?: "kg" | "un" }[] }) {
    const ya = new Set(libreta.lineas.map((l) => clave(l.texto)));
    const nuevas = c.lineas.filter((x) => !ya.has(clave(x.nombre)));
    if (nuevas.length === 0) {
      setAviso({ texto: "Todo eso ya está en tu lista." });
      ir("lista");
      return;
    }
    setLibreta((lb) =>
      nuevas.reduce(
        (acc, x) =>
          anotar(
            acc,
            x.nombre,
            "repetida",
            x.cantidad != null ? { cantidad: x.cantidad, unidad: x.unidad } : undefined
          ),
        lb
      )
    );
    setAviso({
      texto: `Puse ${nuevas.length} ${nuevas.length === 1 ? "producto" : "productos"} de tu compra anterior.`,
    });
    ir("lista");
  }

  function cambiarListas(f: (ls: ListaGuardada[]) => ListaGuardada[]) {
    setListas((ls) => {
      const nuevas = f(ls);
      void repositorioListas.guardar(nuevas);
      return nuevas;
    });
  }

  function guardarLista(c: CompraCerrada, nombre: string) {
    const lista: ListaGuardada = {
      id: `l${c.ts}`,
      nombre: nombre.trim(),
      creada: Date.now(),
      desdeCompra: c.ts,
      lineas: c.lineas.map((x) => ({ nombre: x.nombre, cantidad: x.cantidad, unidad: x.unidad, activa: true })),
    };
    cambiarListas((ls) => [lista, ...ls.filter((l) => l.id !== lista.id)]);
    setCompraRecien(null);
    setAviso({ texto: `Guardé «${lista.nombre}». La encuentras en Mis compras.` });
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
    const antes = items?.find((it) => it.ingrediente === ingrediente);
    const candidatos = antes?.candidatos ?? [];
    if (antes?.porElegir && !cola) setAviso({ texto: "¡1 producto agregado! Vamos bien." });
    setItems((xs) =>
      (xs ?? []).map((it) =>
        it.ingrediente === ingrediente ? { ...it, elegido: nuevo, porPerfil: true, porElegir: false, recienElegido: true } : it
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
      tienda: perfil.tienda?.nombre ?? tuCadena,
      total: totalEntrega,
      lineas: entrega.viajan.map((v) => ({
        nombre: v.nombre,
        cuenta: `${formatearCantidad(v.cantidadQueCruza, v.unidad)} × ${soles(
          v.precio ?? 0
        )}${etiquetaUnitaria(v.unidad)}`,
        monto: v.subtotalQueCruza ?? 0,
        cantidad: v.cantidadQueCruza,
        unidad: v.unidad,
      })),
    };
    void repositorioCompras.agregar(compra);
    setCompras((cs) => [compra, ...cs]);
    setCompraRecien(compra);
    setNombreLista("");

    // La lista no se vacía: se resuelve. Se va la línea cuyos productos
    // cruzaron todos; sobrevive lo demás, marcado «quedó de la vez pasada». La
    // conversación pegada (saludos, horas) ya cumplió y se va con la compra.
    const hechas = new Set(
      libreta.lineas
        .filter((l) => {
          const suyos = (items ?? []).filter((i) => i.lineaId === l.id);
          return suyos.length > 0 && suyos.every((i) => cruzaron.has(i.ingrediente));
        })
        .map((l) => l.id)
    );
    const nueva: Libreta = {
      ...libreta,
      lineas: libreta.lineas
        .filter((l) => !hechas.has(l.id) && lecturaDe(l).naturaleza !== "contexto")
        .map((l) => (lecturaDe(l).naturaleza === "compra" ? { ...l, quedo: true } : l)),
    };
    setLibreta(nueva);
    setUltimaCompra({ n: comprados.length, quedaron: nueva.lineas.length });

    // Lo que no cruzó sigue siendo exactamente el producto que la familia ya
    // vio. El «lo dejé anotado» no sobrevive: fue una decisión sobre ESTA
    // compra, no sobre la próxima.
    const quedan = (items ?? [])
      .filter((it) => !cruzaron.has(it.ingrediente))
      .map((it) => (it.fuera ? { ...it, fuera: false } : it));
    setItems(quedan.length > 0 ? quedan : null);
    ir("entregado");
  }

  // ---------------------------------------------------------------------------

  const nPrefs = Object.keys(perfil.preferencias).length;
  const vacia = libreta.lineas.length === 0;
  // Lo que NO se busca no desaparece —se enseña aparte, con el motivo—, porque una línea
  // que se ignora en silencio es indistinguible de una línea que se perdió.
  const noSeBusca = libreta.lineas
    .map((l) => ({ linea: l, lectura: lecturaDe(l) }))
    .filter(({ lectura }) => lectura.naturaleza !== "compra");
  const itemHoja = hoja ? items?.find((it) => it.ingrediente === hoja.ingrediente) : undefined;

  // Lo que hay en la lista para comprar, en el orden en que se escribió.
  const lineasCompra = libreta.lineas.filter((l) => lecturaDe(l).naturaleza === "compra");
  const vivos = (items ?? []).filter((i) => !i.fuera && i.elegido?.encontrado);
  // Lo que espera una decisión de la familia: cuánto lleva, o qué lleva en vez
  // de lo que hoy no hay. Ni una cosa más: la marca ya la propusimos nosotros.
  const porDecidir = vivos.filter((it) => {
    const e = estadoDe(it, subtotalDe(it, perfil));
    return e === "pendiente" || e === "agotado";
  });
  const siguiente = porDecidir[0];

  // «¿Qué tan papaya está tu compra?» Cuatro condiciones que se pueden comprobar
  // con lo que ya sabemos; ninguna promete ahorro. Mientras Wong esté contestando
  // no se opina: un veredicto que cambia solo un segundo después enseña a no creerle.
  const nombrar = (lista: ItemResuelto[]) =>
    lista.length === 1 ? lista[0].ingrediente : `${lista.length} cosas`;
  const activos = (items ?? []).filter((i) => !i.fuera);
  const sinEncontrar = activos.filter((i) => !i.elegido?.encontrado);
  const agotados = vivos.filter((i) => !i.porElegir && i.elegido?.disponible === false);
  const sinCantidad = vivos.filter((i) => estadoDe(i, subtotalDe(i, perfil)) === "pendiente");
  const sinElegir = sinCantidad.filter((i) => i.porElegir);
  const preciosSuyos = preciosDeTienda === true && !esperandoTienda;
  const pepas: Pepa[] = [
    {
      ok: sinCantidad.length === 0,
      texto: "Todo elegido y con cantidad",
      falta:
        sinCantidad.length > 1
          ? `elegir ${sinCantidad.length} productos`
          : sinElegir.length === 1
            ? `elegir tu ${sinElegir[0].ingrediente}`
            : `decir cuánto ${sinCantidad[0]?.ingrediente ?? ""}`,
    },
    {
      ok: sinEncontrar.length === 0,
      texto: `Todo encontrado en ${tuCadena}`,
      falta: `no encontré ${nombrar(sinEncontrar)}`,
    },
    {
      ok: agotados.length === 0,
      texto: "Nada agotado en tu tienda",
      falta: agotados.length === 1 ? `${agotados[0].ingrediente} está agotado` : `${agotados.length} cosas agotadas`,
    },
    {
      ok: preciosSuyos,
      texto: `Precios de hoy de ${perfil.tienda?.nombre ?? `tu ${tuCadena}`}`,
      falta: `tu ${tuCadena} no contestó: son precios aproximados`,
    },
  ];
  const opinaPapaya = vivos.length > 0 && buscandoIds.size === 0 && !esperandoTienda && preciosDeTienda !== null;

  useEffect(() => {
    if (!cola || hoja) return;
    if (!siguiente) {
      setCola(null);
      setAviso({ texto: "Listo: todo lo de tu lista ya suma." });
      return;
    }
    setHoja({
      tipo:
        siguiente.porElegir || estadoDe(siguiente, subtotalDe(siguiente, perfil)) === "agotado"
          ? "opciones"
          : "cantidad",
      ingrediente: siguiente.ingrediente,
    });
  }, [cola, hoja, siguiente, perfil]);

  const pasoCola = cola
    ? `${Math.min(cola.total, Math.max(1, cola.total - porDecidir.length + 1))} de ${cola.total}`
    : undefined;
  const cerrarHoja = () => {
    setHoja(null);
    setCola(null);
  };

  async function copiarEnlace() {
    const url = entrega.url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Sin permiso de portapapeles: el truco de toda la vida.
      const t = document.createElement("textarea");
      t.value = url;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      document.body.removeChild(t);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 4000);
  }

  // Una línea de producto dentro de la lista. Las acciones son las tres
  // decisiones que la familia sigue teniendo en la mano: cuánto, cuál, y si va.
  function renderItem(it: ItemResuelto, l: Linea, deLaLinea: number, i: number) {
    const subtotal = subtotalDe(it, perfil);
    const estado = estadoDe(it, subtotal);
    const key = `${l.id}:${it.ingrediente}`;
    const quitarLinea = () => setLibreta((lb) => quitar(lb, l.id));

    if (estado === "sin-resultado") {
      const repetida = it.elegido?.motivo === "ya está en tu lista";
      const nota = it.elegido?.degradado
        ? `${tuCadena} no contestó · sigue en tu lista`
        : repetida
          ? "ya está en tu lista"
          : it.elegido?.motivo === "no lo entendí"
          ? "no entendí qué buscar"
          : `no lo encontré tal cual en ${tuCadena}`;
      // La Yuca solo cuando de verdad no está; la Piña cuando Wong no contestó.
      // Una repetida o una línea que no entendimos no es un problema de nadie.
      const personaje: "yuca" | "pina" | undefined = it.elegido?.degradado
        ? "pina"
        : repetida || it.elegido?.motivo === "no lo entendí"
          ? undefined
          : "yuca";
      const acciones = [
        ...(it.elegido?.degradado
          ? [{ texto: "Intentar de nuevo", onClick: () => reintentar(l.id) }]
          : repetida
            ? []
            : [
              {
                texto: "Escribirlo distinto",
                onClick: () => {
                  setBorrador(l.texto);
                  quitarLinea();
                  compRef.current?.focus();
                },
              },
            ]),
        { texto: "Quitar", onClick: quitarLinea },
      ];
      return (
        <LineaCarrito
          key={key}
          cadena={tuCadena}
          ingrediente={deLaLinea > 1 ? it.ingrediente : l.texto}
          estado="sin-resultado"
          nota={nota}
          personaje={personaje}
          acciones={acciones}
          orden={i}
        />
      );
    }

    // Escrito sin marca y sin memoria: las opciones se ven en la lista misma y
    // se toca una (PO, 2026-11-28). Nada puesto de antemano.
    if (estado === "pendiente" && it.porElegir && !it.fuera) {
      const fuera = () =>
        setItems((xs) =>
          (xs ?? []).map((x) => (x.lineaId === l.id && x.ingrediente === it.ingrediente ? { ...x, fuera: true } : x))
        );
      const sacar = deLaLinea === 1 ? quitarLinea : fuera;
      return (
        <EligeAqui
          key={key}
          ingrediente={it.ingrediente}
          opciones={it.candidatos.filter((c) => c.encontrado)}
          orden={i}
          onElegir={(p) => corregir(it.ingrediente, p)}
          onNinguno={() => {
            sacar();
            setBorrador(`${it.ingrediente} `);
            compRef.current?.focus();
            setAviso({ texto: `Escribe la marca junto a «${it.ingrediente}» y lo busco así.` });
          }}
          onQuitar={sacar}
        />
      );
    }

    const otras = it.candidatos.filter((c) => c.sku !== it.elegido?.sku && c.encontrado);
    const acciones: { texto: string; onClick: () => void }[] = [];
    // La única decisión que la línea espera, en su cartelito amarillo.
    const decision =
      it.fuera
        ? undefined
        : estado === "pendiente" && it.porElegir
          ? { texto: "Elegir", onClick: () => setHoja({ tipo: "opciones" as const, ingrediente: it.ingrediente }) }
        : estado === "pendiente"
          ? { texto: "¿Cuánto?", onClick: () => setHoja({ tipo: "cantidad" as const, ingrediente: it.ingrediente }) }
          : estado === "agotado"
            ? { texto: "Elige otro", onClick: () => setHoja({ tipo: "opciones" as const, ingrediente: it.ingrediente }) }
            : undefined;
    if (estado !== "agotado" && otras.length > 0)
      acciones.push({
        texto: `Ver otras (${otras.length})`,
        onClick: () => setHoja({ tipo: "opciones", ingrediente: it.ingrediente }),
      });
    if (deLaLinea === 1) acciones.push({ texto: "Quitar", onClick: quitarLinea });
    else
      acciones.push({
        texto: it.fuera ? "Volver a ponerlo" : "No llevar",
        onClick: () =>
          setItems((xs) =>
            (xs ?? []).map((x) =>
              x.lineaId === l.id && x.ingrediente === it.ingrediente ? { ...x, fuera: !x.fuera } : x
            )
          ),
      });

    return (
      <LineaCarrito
        key={key}
        cadena={tuCadena}
        ingrediente={deLaLinea > 1 ? it.ingrediente : l.texto}
        producto={it.elegido}
        estado={estado}
        faltaElegir={!!it.porElegir}
        cantidad={cantidadDe(it, perfil)}
        subtotal={it.fuera ? undefined : subtotal}
        confianza={it.fuera ? undefined : confianzaDe(it, perfil, estado)}
        acciones={acciones}
        atenuada={it.fuera}
        decision={decision}
        orden={i}
        mostrarPara={!nombreDice(it.elegido?.nombre, deLaLinea > 1 ? it.ingrediente : l.texto)}
        conTarjeta={it.fuera ? undefined : tarjetaDeLaFamilia(it.elegido, perfil)}
        onCantidad={
          estado === "confirmado" && !it.fuera
            ? {
                menos: () => moverCantidad(it, -1),
                mas: () => moverCantidad(it, 1),
                abrir: () => setHoja({ tipo: "cantidad", ingrediente: it.ingrediente }),
              }
            : undefined
        }
      />
    );
  }

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
  if (!listo) return <main className="sc-papel sc-marco" style={marco} />;

  // La puerta. Solo la ve quien nunca ha entrado aquí.
  if (!tieneCasa(casa))
    return (
      <main className="sc-papel sc-marco" style={marco}>
        <Bienvenida
          onEntrar={(nombre) => {
            const nueva = crearCasa(nombre);
            setCasa(nueva);
            void repositorioCasa.guardar(nueva);
            void cargarTiendas();
            // Sin foco automático: al entrar por primera vez, las cuatro formas
            // de empezar tienen que verse antes que un teclado abierto.
          }}
        />
      </main>
    );

  if (pideTienda)
    return (
      <main className="sc-papel sc-marco" style={marco}>
        <EligeTienda
          tiendas={tiendas}
          onElegir={(t) => {
            tomarTienda(t);
            setVerPago(true);
          }}
          onReintentar={() => {
            setTiendas(null);
            void (async () => {
              try {
                const data = await (await fetch("/api/tiendas")).json();
                setTiendas(data.tiendas ?? []);
              } catch {
                setTiendas([]);
              }
            })();
          }}
          onSeguirSin={() => setSinTiendaPorAhora(true)}
        />
      </main>
    );

  if (verPago)
    return (
      <main className="sc-papel sc-marco" style={marco}>
        <EligePago
          cadena={tuCadena}
          pago={perfil.pago}
          onElegir={(t, otra) => {
            actualizarPerfil((p) => responderPago(p, t, otra));
            setVerPago(false);
            setVerAsiFunciona(true);
          }}
          onSaltar={() => {
            setVerPago(false);
            setVerAsiFunciona(true);
          }}
        />
      </main>
    );

  if (verAsiFunciona)
    return (
      <main className="sc-papel sc-marco" style={marco}>
        <AsiFunciona tienda={perfil.tienda?.nombre} cadena={tuCadena} onSeguir={() => setVerAsiFunciona(false)} />
      </main>
    );

  return (
    <main className="sc-papel sc-marco" style={marco}>
      {ruta === "lista" && (
        <Pantalla
          sentido={sentido}
          encabezado={
            <Cabecera
              monograma={monograma(casa)}
              nombre={casa.nombre}
              titulo={vacia ? "Arma tu lista" : `Tu lista, ${saludo(casa)}`}
              cuenta={vivos.length || undefined}
              tienda={perfil.tienda?.nombre}
              tarjeta={
                [...(perfil.pago?.tarjetas ?? []).filter((t) => t !== "Ninguna"), ...(perfil.pago?.otra ? [perfil.pago.otra] : [])]
                  .join(" · ") || undefined
              }
              cadena={tuCadena}
              onTienda={abrirTienda}
              onCasa={() => ir("casa")}
              onMarchaBlanca={() =>
                setAviso({
                  texto:
                    `SuperCarrito recién empieza. Los precios los confirma tu ${tuCadena} antes de pagar; si algo sale raro, cuéntanos y lo arreglamos.`,
                })
              }
            />
          }
          navegacion={
            <Navegacion
              activo="lista"
              cuantos={vivos.length || undefined}
              onIr={(l) => ir(l === "lista" ? "lista" : "casa")}
            />
          }
          cuerpo={
            <>
<div style={{ height: 16 }} />

              {/* La caja es la puerta principal: una línea o un WhatsApp
                  entero, como salga. */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 6px 6px 14px",
                  borderRadius: 999,
                  border: `2px solid ${color.tinta}`,
                  background: color.blanco,
                }}
              >
                <Compositor
                  ref={compRef}
                  valor={borrador}
                  marcador={vacia ? "leche, pan, 2 kg de papa…" : "agrega algo más…"}
                  onEscribir={setBorrador}
                  onEnter={() => {
                    if (anotarTexto(borrador)) setBorrador("");
                  }}
                  onPegar={alPegar}
                />
                <Boton
                  variante="lleno"
                  chico
                  disabled={!borrador.trim()}
                  onClick={() => {
                    if (anotarTexto(borrador)) setBorrador("");
                    compRef.current?.focus();
                  }}
                >
                  Buscar
                </Boton>
              </div>

              <Atajos
                atajos={[
                  {
                    clave: "pegar",
                    texto: "Pegar WhatsApp",
                    onClick: () => void pegarDelPortapapeles(),
                  },
                  { clave: "captura", texto: "Foto o captura", onClick: () => archivoRef.current?.click() },
                  { clave: "menu", texto: "Menú de la semana", onClick: () => setHojaMenus(true) },
                  ...(compras[0]
                    ? [
                        {
                          clave: "repetir",
                          texto: `Repetir compra de ${cuando(compras[0].ts).toLowerCase()}`,
                          onClick: () => repetir(compras[0]),
                        },
                      ]
                    : []),
                ]}
              />

              {vacia && (
                <p style={{ ...lapiz, margin: "18px 0 0", maxWidth: "34ch" }}>
                  Cada cosa que anotes se convierte al momento en su producto de
                  {` ${tuCadena}`}, con foto y precio. Tú decides marca, tamaño y cantidad.
                </p>
              )}

              {/* La lista ES el carrito. Cada línea, en el orden en que la
                  familia la escribió, con sus productos debajo. */}
              <div style={{ marginTop: vacia ? 0 : 14 }}>
                {lineasCompra.map((l) => {
                  const suyos = (items ?? []).filter((i) => i.lineaId === l.id);
                  if (buscandoIds.has(l.id) || suyos.length === 0)
                    return (
                      <LineaCarrito key={l.id} ingrediente={l.texto} estado="buscando" cadena={tuCadena} />
                    );
                  if (suyos.length === 1) return renderItem(suyos[0], l, 1, 0);
                  // Un menú o una receta: una línea que se abrió en varios
                  // productos. Se ve de dónde salieron y se quita de una vez.
                  return (
                    <div key={l.id} style={{ marginTop: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          gap: 10,
                        }}
                      >
                        <span style={{ ...rotulo }}>{l.texto}</span>
                        <button
                          onClick={() => setLibreta((lb) => quitar(lb, l.id))}
                          style={{ ...enlaceTexto, fontSize: 12.5, minHeight: 32 }}
                        >
                          Quitar todo
                        </button>
                      </div>
                      {suyos.map((it, i) => renderItem(it, l, suyos.length, i))}
                    </div>
                  );
                })}
              </div>

              {/* Lo que no se busca no desaparece: se pliega, con su motivo, y
                  una salida para decir «sí es compra». */}
              {noSeBusca.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <button
                    onClick={() => setVerRuido((v) => !v)}
                    className="sc-boton"
                    style={{
                      background: "none",
                      border: "none",
                      padding: "8px 0",
                      font: "inherit",
                      color: color.lapiz,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {verRuido ? "▾" : "▸"} {noSeBusca.length}{" "}
                    {noSeBusca.length === 1 ? "línea no parecía compra" : "líneas no parecían compra"}
                  </button>
                  {verRuido &&
                    noSeBusca.map(({ linea, lectura }) => (
                      <Fila
                        key={linea.id}
                        titulo={linea.texto}
                        nota={lectura.motivo}
                        derecha={
                          <span style={{ display: "flex", gap: 6 }}>
                            <Boton
                              variante="fantasma"
                              chico
                              onClick={() => setLibreta((lb) => marcarCompra(lb, linea.id, true))}
                            >
                              Sí es compra
                            </Boton>
                            <Boton
                              variante="fantasma"
                              chico
                              onClick={() => setLibreta((lb) => quitar(lb, linea.id))}
                            >
                              Quitar
                            </Boton>
                          </span>
                        }
                      />
                    ))}
                </div>
              )}
            </>
          }
          pie={
            vivos.length > 0 ? (
              <>
                {opinaPapaya && <Papaya pepas={pepas} nadaSuma={cuentan === 0 && sinCantidad.length === 0} />}
                {perfil.tienda && preciosDeTienda === false && (
                  <div style={{ ...lapiz, marginBottom: 8 }}>
                    {perfil.tienda.nombre} no me contestó: estos precios son
                    aproximados, no los de tu tienda.
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                  <span>
                    <span style={{ ...rotulo, display: "block" }}>
                      {esperandoTienda
                        ? `Preguntando a ${perfil.tienda?.nombre ?? `tu ${tuCadena}`}…`
                        : cuentan === 0
                          ? porDecidir.length > 0
                            ? "Falta elegir"
                            : "Aún no suma"
                          : pendientes > 0
                            ? `Suman ${cuentan} de ${vivos.length}`
                            : `${cuentan} ${cuentan === 1 ? "producto" : "productos"}`}
                    </span>
                    <span
                      key={esperandoTienda ? "esperando" : cuentan === 0 ? "vacio" : total}
                      className="sc-monto"
                      style={{ ...plata, fontSize: 25, letterSpacing: "-0.03em", display: "block" }}
                    >
                      {esperandoTienda || cuentan === 0 ? "S/ —" : soles(total)}
                    </span>
                  </span>
                  {porDecidir.length > 0 ? (
                    <Boton variante="lleno" style={{ whiteSpace: "nowrap" }} onClick={() => setCola({ total: porDecidir.length })}>
                      {porDecidir.length === 1 ? "Elegir 1 producto" : `Elegir ${porDecidir.length} productos`}
                    </Boton>
                  ) : (
                    <Boton
                      variante="lleno"
                      onClick={() => ir("pedir")}
                      disabled={buscandoIds.size > 0 && cuentan === 0}
                    >
                      Revisar y pedir
                    </Boton>
                  )}
                </div>
                {/* La salida abierta: decidir es una ayuda, no un peaje. */}
                {porDecidir.length > 0 && (
                  <button
                    onClick={() => ir("pedir")}
                    style={{ ...enlaceTexto, fontSize: 12.5, minHeight: 32, marginTop: 4 }}
                  >
                    Seguir sin elegirlos
                  </button>
                )}
              </>
            ) : undefined
          }
        />
      )}

      {/* Paso 3. NO es un checkout: es el traspaso. Aquí se enseña qué cruza y
          qué no ANTES de saltar, porque descubrirlo del otro lado —en Wong, con
          la compra ya empezada— es donde se pierde la confianza. */}
      {ruta === "pedir" && (
        <Pantalla
          sentido={sentido}
          titulo="Revisar y pedir"
          onVolver={() => ir("lista")}
          cuerpo={
            <>
              <Pasos actual={2} cadena={tuCadena} />
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", margin: "10px 0 10px", color: color.tinta }}>
                ¿Dónde lo pides?
              </h2>
              <div style={{ display: "grid", gap: 10 }}>
                <TuTienda
                  tienda={perfil.tienda}
                  cadena={tuCadena}
                  actualizado={horaPrecios ? hora(horaPrecios) : undefined}
                  productos={entrega.viajan.length}
                  monto={montoEntrega}
                  precioDeTienda={!!perfil.tienda && montoDeTienda != null}
                  distrito={perfil.envio?.distrito}
                  onDistrito={(d) => actualizarPerfil((p) => elegirDistrito(p, d))}
                  envio={envio}
                  conTarjeta={conTuTarjeta}
                  prime={primeEnEnvio(perfil.tienda?.cadena, perfil.pago?.tarjetas, montoEntrega)}
                  onCambiarTienda={abrirTienda}
                />
                {/* La que más ahorra, primero. Cada una con SU lista de iguales. */}
                {[...comparaciones]
                  .sort((a, b) => ahorroDe(b.estado) - ahorroDe(a.estado))
                  .map(({ id, estado }) => (
                    <OtraTienda
                      key={id}
                      estado={estado}
                      conDistrito={!!perfil.envio?.distrito && perfil.envio.distrito !== OTRO_DISTRITO}
                      nombreCadena={(t) => cadenaDe(t.cadena).nombre}
                      tarjetas={perfil.pago?.tarjetas}
                      onPedirAlla={() => {
                        if (estado.tipo === "listo") pedirAlla(estado.destino.tienda, estado.equivalentes);
                      }}
                    />
                  ))}
                <TottusCard
                  estado={tottus}
                  nombreOrigen={tuCadena}
                  conCmr={
                    (perfil.pago?.tarjetas ?? []).some((t) => /cmr/i.test(t)) || /cmr/i.test(perfil.pago?.otra ?? "")
                  }
                  onPasoAPaso={() => {
                    try {
                      setMarcadosTottus(JSON.parse(localStorage.getItem("sc-tottus-marcados") ?? "[]"));
                    } catch {
                      setMarcadosTottus([]);
                    }
                    setHojaTottus(true);
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                <Desplegable
                  titulo="Va a tu carrito"
                  resumen={[
                    `${entrega.viajan.length}`,
                    ajustes.length > 0 && `${ajustes.length} con otra cantidad`,
                    entrega.sequedan.length > 0 && `${entrega.sequedan.length} se ${entrega.sequedan.length === 1 ? "queda" : "quedan"} en tu lista`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  {entrega.viajan.map((v) => (
                    <div
                      key={v.ingrediente + v.nombre}
                      style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "5px 0", fontSize: 13.5, color: color.tinta, fontVariantNumeric: "tabular-nums" }}
                    >
                      <span style={{ minWidth: 0 }}>
                        {v.nombre}
                        <span style={{ ...lapiz, display: "block" }}>
                          {formatearCantidad(v.cantidadQueCruza, v.unidad)}
                          {v.precio != null ? ` × ${soles(v.precio)}` : ""}
                          {v.cantidadQueCruza !== v.cantidad
                            ? ` · pediste ${formatearCantidad(v.cantidad, v.unidad)}, ${tuCadena} lo vende así`
                            : ""}
                        </span>
                      </span>
                      <span style={{ whiteSpace: "nowrap" }}>
                        {v.subtotalQueCruza != null ? soles(v.subtotalQueCruza) : ""}
                      </span>
                    </div>
                  ))}
                  {entrega.sequedan.map((q) => (
                    <p key={q.nombre} style={{ ...lapiz, margin: "6px 0 0" }}>
                      Se queda en tu lista: {q.nombre} · {q.motivo}.
                    </p>
                  ))}
                </Desplegable>
                <FilaPago pago={perfil.pago} onAbrir={() => setHojaPago(true)} />
              </div>
            </>
          }
          pie={
            entrega.url ? (
              <>
                <a
                  href={entrega.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={entregar}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <Boton variante="lleno" style={{ width: "100%" }}>
                    Abrir mi carrito en {tuCadena}
                  </Boton>
                </a>
                {/* En Android la app de Wong se come el enlace: la copia es el
                    único camino, y tiene que estar ANTES del salto. */}
                <p style={{ ...lapiz, margin: "8px 0 0", textAlign: "center" }}>
                  Pagas en {tuCadena} con tu cuenta
                  {perfil.tienda ? `; elige ${perfil.tienda.nombre} para el mismo precio` : ""}.{" "}
                  {/* En Android la app se come el enlace: la copia tiene que estar ANTES del salto. */}
                  <button onClick={copiarEnlace} style={{ ...enlaceTexto, minHeight: 32 }}>
                    {copiado ? "✓ Enlace copiado" : "¿Se abrió la app vacía? Copia el enlace"}
                  </button>
                </p>
              </>
            ) : (
              <p style={{ ...lapiz, textAlign: "center" }}>
                Todavía no hay nada que llevar: dime cuánto llevas de algo en tu lista.
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
          sello
          titulo={`Tu compra está en ${tuCadena}: ${ultimaCompra?.n ?? 0} ${
            ultimaCompra?.n === 1 ? "producto" : "productos"
          }.`}
          texto={
            (ultimaCompra?.quedaron ?? 0) > 0
              ? "Termina el pago allá. Lo que no cruzó sigue anotado aquí para la próxima."
              : "Solo te falta pagar allá. Tu lista quedó limpia."
          }
          accion={{ texto: "Volver a mi lista", onClick: () => ir("lista") }}
        >
          {compraRecien && compraRecien.lineas.length > 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (nombreLista.trim()) guardarLista(compraRecien, nombreLista);
              }}
              style={{ width: "100%", maxWidth: 340, display: "grid", gap: 8, marginTop: 6, textAlign: "left" }}
            >
              <label htmlFor="nombre-lista" style={{ fontSize: 15, fontWeight: 600, color: color.tinta }}>
                ¿Le pones nombre para repetirla?
              </label>
              <input
                id="nombre-lista"
                value={nombreLista}
                onChange={(e) => setNombreLista(e.target.value)}
                placeholder="Compra del domingo"
                maxLength={40}
                style={{
                  font: "inherit",
                  fontSize: 16,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: `1.5px solid ${color.renglon}`,
                  background: color.papel,
                  color: color.tinta,
                }}
              />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Boton variante="lleno" chico disabled={!nombreLista.trim()}>
                  Guardar
                </Boton>
                <button
                  type="button"
                  onClick={() => setCompraRecien(null)}
                  style={{ ...enlaceTexto, fontSize: 13.5, minHeight: 40 }}
                >
                  Ahora no
                </button>
              </div>
            </form>
          )}
        </PantallaCalma>
      )}

      {ruta === "casa" && (
        <Pantalla
          sentido={sentido}
          titulo={`Mis compras · ${casa.nombre}`}
          onVolver={() => ir("lista")}
          navegacion={
            <Navegacion
              activo="casa"
              cuantos={vivos.length || undefined}
              onIr={(l) => ir(l === "lista" ? "lista" : "casa")}
            />
          }
          cuerpo={
            nPrefs === 0 && compras.length === 0 && !perfil.tienda ? (
              <Vacio
                titulo="Todavía no sé nada de tu casa."
                texto="Aquí irán apareciendo tu tienda, tus marcas y tus compras, solo de verte comprar. No hay nada que llenar."
              />
            ) : (
              <>
                {perfil.tienda && (
                  <>
                    <Seccion>Dónde compras</Seccion>
                    <Fila
                      titulo={perfil.tienda.nombre}
                      nota={`${perfil.tienda.distrito ? perfil.tienda.distrito + " · " : ""}precios y productos de esta tienda`}
                      derecha={
                        <Boton onClick={abrirTienda}>Cambiar</Boton>
                      }
                    />
                  </>
                )}

                {nPrefs > 0 && (
                  <>
                    <Seccion>Lo que ya sé de tu casa</Seccion>
                    {Object.entries(perfil.preferencias).map(([clave, pref]) => (
                      <Fila key={clave} titulo={fraseDe(clave, pref)} nota={motivoDe(pref)} />
                    ))}
                  </>
                )}

                {listas.length > 0 && (
                  <>
                    <Seccion>Tus listas</Seccion>
                    {listas.map((l) => {
                      const activas = l.lineas.filter((x) => x.activa).length;
                      return (
                        <Fila
                          key={l.id}
                          titulo={l.nombre}
                          nota={`${activas} ${activas === 1 ? "cosa" : "cosas"}${
                            activas < l.lineas.length ? ` de ${l.lineas.length}` : ""
                          }`}
                          derecha={<span style={{ ...lapiz, fontSize: 18 }}>›</span>}
                          onTocar={() => {
                            setVerListaId(l.id);
                            setRenombrando(false);
                            ir("milista");
                          }}
                        />
                      );
                    })}
                  </>
                )}

                {compras.length > 0 && (
                  <>
                    <Seccion>Tus compras</Seccion>
                    {compras.map((c) => (
                      <Fila
                        key={c.ts}
                        titulo={cuando(c.ts)}
                        nota={`${c.lineas.length} ${c.lineas.length === 1 ? "cosa" : "cosas"} · ${c.tienda ?? "Wong"}`}
                        derecha={
                          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ ...plata, fontSize: 14 }}>{soles(c.total)}</span>
                            <Boton
                              variante="fantasma"
                              chico
                              onClick={(e?: React.MouseEvent) => {
                                e?.stopPropagation();
                                repetir(c);
                              }}
                            >
                              Repetir
                            </Boton>
                          </span>
                        }
                        onTocar={() => {
                          setVerCompra(c);
                          ir("boleta");
                        }}
                      />
                    ))}
                  </>
                )}

              </>
            )
          }
        />
      )}

      {ruta === "milista" && verLista && (
        <Pantalla
          sentido={sentido}
          titulo={verLista.nombre}
          onVolver={() => ir("casa")}
          cuerpo={
            <>
              {renombrando ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const n = nombreLista.trim();
                    if (!n) return;
                    cambiarListas((ls) => ls.map((l) => (l.id === verLista.id ? { ...l, nombre: n } : l)));
                    setRenombrando(false);
                  }}
                  style={{ display: "flex", gap: 8, margin: "4px 0 12px" }}
                >
                  <input
                    id="renombrar-lista"
                    aria-label="Nombre de la lista"
                    value={nombreLista}
                    onChange={(e) => setNombreLista(e.target.value)}
                    maxLength={40}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      font: "inherit",
                      fontSize: 16,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: `1.5px solid ${color.renglon}`,
                      background: color.papel,
                      color: color.tinta,
                    }}
                  />
                  <Boton variante="lleno" chico disabled={!nombreLista.trim()}>
                    Listo
                  </Boton>
                </form>
              ) : (
                <p style={{ ...lapiz, margin: "0 0 10px" }}>
                  Marca lo que llevas esta vez. Lo que desmarques queda así para la próxima.{" "}
                  <button
                    onClick={() => {
                      setNombreLista(verLista.nombre);
                      setRenombrando(true);
                    }}
                    style={{ ...enlaceTexto, fontSize: 12.5 }}
                  >
                    Renombrar
                  </button>
                </p>
              )}
              {verLista.lineas.map((x, i) => (
                <label
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 2px",
                    borderBottom: `1px solid ${color.renglon}`,
                    cursor: "pointer",
                    opacity: x.activa ? 1 : 0.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={x.activa}
                    onChange={() =>
                      cambiarListas((ls) =>
                        ls.map((l) =>
                          l.id === verLista.id
                            ? { ...l, lineas: l.lineas.map((y, j) => (j === i ? { ...y, activa: !y.activa } : y)) }
                            : l
                        )
                      )
                    }
                    style={{ width: 20, height: 20, accentColor: color.pino, flex: "0 0 auto" }}
                  />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: color.tinta }}>{x.nombre}</span>
                  <span style={{ ...lapiz, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
                    {x.cantidad != null ? `× ${formatearCantidad(x.cantidad, x.unidad ?? "un")}` : "sin cantidad"}
                  </span>
                </label>
              ))}
              <button
                onClick={() => {
                  const borrada = verLista;
                  cambiarListas((ls) => ls.filter((l) => l.id !== borrada.id));
                  setAviso({
                    texto: `Borré «${borrada.nombre}». Tus compras siguen guardadas.`,
                    recuperar: () => cambiarListas((ls) => [borrada, ...ls]),
                  });
                  ir("casa");
                }}
                style={{ ...enlaceTexto, fontSize: 12.5, color: color.ladrillo, marginTop: 4 }}
              >
                Borrar esta lista
              </button>
            </>
          }
          pie={(() => {
            const activas = verLista.lineas.filter((x) => x.activa);
            return (
              <Boton
                variante="lleno"
                disabled={activas.length === 0}
                onClick={() => repetir({ lineas: activas })}
                style={{ width: "100%" }}
              >
                {activas.length === 0
                  ? "Marca algo para llevar"
                  : `Poner ${activas.length} en mi lista`}
              </Boton>
            );
          })()}
        />
      )}

      {ruta === "boleta" && verCompra && (
        <Pantalla
          sentido={sentido}
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

      {hojaPago && (
        <HojaPago
          pago={perfil.pago}
          cadena={tuCadena}
          onPago={(t, otra) => actualizarPerfil((p) => responderPago(p, t, otra))}
          onCerrar={() => setHojaPago(false)}
        />
      )}

      {hojaTottus && tottus.tipo === "listo" && (
        <HojaTottus
          lineas={tottus.lineas}
          marcados={marcadosTottus}
          onMarcar={(sku) =>
            setMarcadosTottus((xs) => {
              const nuevos = xs.includes(sku) ? xs.filter((x) => x !== sku) : [...xs, sku];
              try {
                localStorage.setItem("sc-tottus-marcados", JSON.stringify(nuevos));
              } catch {
                // sin almacenamiento, la casilla vale mientras la hoja esté abierta
              }
              return nuevos;
            })
          }
          onCerrar={() => setHojaTottus(false)}
        />
      )}

      {hojaTienda && (
        <Hoja
          titulo="¿Dónde compras?"
          sub="Cada tienda tiene sus precios y sus productos. Con la tuya, ves los precios de hoy de tu tienda."
          onCerrar={() => {
            setHojaTienda(false);
          }}
        >
          {tiendas === null ? (
            <p style={lapiz}>Buscando las tiendas…</p>
          ) : tiendas.length === 0 ? (
            <p style={lapiz}>
              No pude traer la lista de tiendas. Puedes seguir sin elegir: los
              precios serán aproximados.
            </p>
          ) : (
<ListaTiendas tiendas={tiendas} elegidaId={perfil.tienda?.id} onElegir={tomarTienda} />
          )}
          <p style={{ ...lapiz, marginTop: 12 }}>
            No me conecto a tu cuenta ni veo tus datos. Es solo saber dónde compras.
          </p>
        </Hoja>
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
          onCerrar={cerrarHoja}
          paso={pasoCola}
        />
      )}

      {hoja?.tipo === "opciones" && itemHoja && (
        <HojaOpciones
          ingrediente={itemHoja.ingrediente}
          opciones={itemHoja.candidatos.filter((c) => c.encontrado)}
          elegidaSku={itemHoja.porElegir ? undefined : itemHoja.elegido?.sku}
          primeraVez={!!itemHoja.porElegir}
          agotado={
            itemHoja.elegido?.disponible === false
              ? { nombre: itemHoja.elegido.nombre ?? itemHoja.ingrediente, tienda: perfil.tienda?.nombre }
              : undefined
          }
          onElegir={(p) => corregir(itemHoja.ingrediente, p)}
          onCerrar={cerrarHoja}
          paso={pasoCola}
        />
      )}

      {aviso && (
        <Aviso
          texto={aviso.texto}
          onDeshacer={
            aviso.recuperar
              ? () => {
                  aviso.recuperar!();
                  setAviso(null);
                }
              : aviso.deshacer
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

function hora(ts: number): string {
  return new Date(ts).toLocaleTimeString("es-PE", { hour: "numeric", minute: "2-digit" });
}

// ¿El nombre del producto ya dice lo que pidió la familia? Si sí, «para leche»
// debajo de «Leche Gloria» es ruido; si no, es la señal de que pudimos fallar.
function nombreDice(nombre: string | undefined, pedido: string): boolean {
  if (!nombre) return true;
  const plano = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const n = plano(nombre);
  const palabras = plano(pedido)
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["kilo", "kilos", "para", "con", "del", "las", "los", "una", "uno"].includes(w));
  if (palabras.length === 0) return true;
  return palabras.some((w) => n.includes(w.replace(/s$/, "")));
}



const enlaceTexto: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  font: "inherit",
  color: color.tinta,
  textDecoration: "underline",
  cursor: "pointer",
};

// Los tres pasos, siempre a la vista. La familia sabe dónde está y qué falta,
// sin que nadie se lo explique.
function Pasos({ actual, cadena = "Wong" }: { actual: 1 | 2 | 3; cadena?: string }) {
  const pasos = ["Arma tu lista", "Revisa", `Pide en ${cadena}`];
  return (
    <ol
      aria-label="Pasos"
      style={{
        listStyle: "none",
        display: "flex",
        gap: 6,
        padding: 0,
        margin: "0 0 12px",
        fontFamily: fuente,
      }}
    >
      {pasos.map((p, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const on = n === actual;
        const hecho = n < actual;
        return (
          <li
            key={p}
            aria-current={on ? "step" : undefined}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 8px",
              borderRadius: 10,
              border: `1px solid ${on ? color.tinta : color.renglon}`,
              background: on ? color.blanco : "transparent",
              color: on || hecho ? color.tinta : color.lapiz,
              fontSize: 11.5,
              fontWeight: on ? 600 : 500,
              lineHeight: 1.2,
              minWidth: 0,
            }}
          >
            <span
              aria-hidden
              style={{
                flex: "0 0 auto",
                width: 18,
                height: 18,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                fontSize: 10.5,
                fontWeight: 600,
                background: on ? color.tinta : hecho ? color.renglon : "transparent",
                color: on ? color.blanco : color.tinta,
                border: on || hecho ? "none" : `1px solid ${color.renglon}`,
              }}
            >
              {hecho ? "✓" : n}
            </span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{p}</span>
          </li>
        );
      })}
    </ol>
  );
}

// Formas de empezar, en pequeño y debajo de la caja: la caja es la puerta
// principal, estas son atajos.
function Atajos({ atajos }: { atajos: { clave: string; texto: string; onClick: () => void }[] }) {
  return (
    <div
      className="sc-scroll"
      style={{ display: "flex", gap: 7, margin: "10px -22px 0", padding: "0 22px", overflowX: "auto" }}
    >
      {atajos.map((a) => (
        <button
          key={a.clave}
          type="button"
          onClick={a.onClick}
          className="sc-boton"
          style={{
            flex: "0 0 auto",
            whiteSpace: "nowrap",
            minHeight: 36,
            padding: "0 13px",
            borderRadius: 999,
            border: 0,
            background: color.papel2,
            color: color.tinta,
            fontFamily: fuente,
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {a.texto}
        </button>
      ))}
    </div>
  );
}
