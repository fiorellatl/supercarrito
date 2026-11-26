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
  elegirTienda,
  perfilVacio,
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
  repositorioPerfil,
  type CompraCerrada,
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
import { wongDeepLink, unidadesDeVenta } from "@/lib/entrega";
import type { LineaAValorar, Tienda } from "@/lib/tienda";

import { casaVacia, crearCasa, monograma, saludo, tieneCasa, type Casa } from "@/lib/casa";
import { repositorioCasa } from "@/lib/perfil-store";

import { color, fuente, lapiz, plata, rotulo, soles } from "@/app/ui/sistema";
import Aviso from "@/app/ui/Aviso";
import Bienvenida from "@/app/ui/Bienvenida";
import Cabecera from "@/app/ui/Cabecera";
import Navegacion from "@/app/ui/Navegacion";
import Boton from "@/app/ui/Boton";
import Fila from "@/app/ui/Fila";
import Hoja from "@/app/ui/Hoja";
import HojaCantidad from "@/app/ui/HojaCantidad";
import HojaOpciones from "@/app/ui/HojaOpciones";
import { Compositor } from "@/app/ui/Libreta";
import LineaCarrito, { type EstadoLinea } from "@/app/ui/LineaCarrito";
import { Pantalla, Seccion, Vacio } from "@/app/ui/Pantalla";
import PantallaCalma from "@/app/ui/PantallaCalma";

// Rediseño del flujo (2026-11-26, PO): dos pasos y no cinco. La lista ES el
// carrito —cada línea se convierte en su producto al anotarla— y «pedir» es el
// único paso aparte. Desaparecen la revisión, la pantalla de tienda (ahora una
// hoja) y el carrito como lugar propio.
type Ruta = "lista" | "pedir" | "entregado" | "casa" | "boleta";

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

  const [items, setItems] = useState<ItemResuelto[] | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; deshacer?: number } | null>(null);
  const [menus, setMenus] = useState<MenuResumen[]>([]);
  const [hojaMenus, setHojaMenus] = useState(false);
  const [hoja, setHoja] = useState<{ tipo: "cantidad" | "opciones"; ingrediente: string } | null>(null);
  const [ultimaCompra, setUltimaCompra] = useState<{ n: number; quedaron: number } | null>(null);

  // La tienda de la familia. `preciosDeTienda` es lo que decide si el carrito
  // enseña precios reales o referenciales, y hay que poder distinguir "todavía
  // no pregunté" de "pregunté y no me contestaron": callar la diferencia sería
  // enseñar un número sin decir de dónde viene.
  const [tiendas, setTiendas] = useState<Tienda[] | null>(null);
  const [filtroTienda, setFiltroTienda] = useState("");
  const [preciosDeTienda, setPreciosDeTienda] = useState<boolean | null>(null);
  const [totalTienda, setTotalTienda] = useState<number | null>(null);
  // Para qué tienda ya contestó la valoración (bien o mal). Mientras la tienda
  // elegida no haya contestado, el total del pie NO se enseña: el de catálogo
  // cambiaba un segundo después al llegar el de la tienda (bitácora O2), y un
  // total que se mueve solo enseña a desconfiar del total.
  const [valoradaPara, setValoradaPara] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

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
  const [verRuido, setVerRuido] = useState(false);
  const [horaPrecios, setHoraPrecios] = useState<number | null>(null);
  const perfilRef = useRef(perfil);
  perfilRef.current = perfil;

  // --- Persistencia. El trabajo no se pierde jamás: se guarda en cada cambio.
  useEffect(() => {
    void repositorioCasa.cargar().then((c) => {
      setCasa(c);
      setListo(true);
    });
    void repositorioPerfil.cargar().then(setPerfil);
    void repositorioCompras.cargar().then(setCompras);
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
        const porSku = new Map<string, { precio?: number; disponible: boolean }>(
          (data.lineas ?? []).map((l: { sku: string; precio?: number; disponible: boolean }) => [
            l.sku,
            l,
          ])
        );
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
    const n = anotarTexto(texto, "pegada");
    setBorrador("");
    // Entra tal cual: con emojis, con "mami" y con faltas. No se toca nada.
    setAviso({ texto: "Pegado. Separé lo que es compra de la conversación.", deshacer: n });
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
    actualizarPerfil((p) => elegirTienda(p, t));
    setFiltroTienda("");
    setHojaTienda(false);
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
        body: JSON.stringify({ lineas: aPedidos({ version: 1, lineas: [l] }) }),
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
        sinProducto("no pude preguntarle a Wong"),
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
  function repetir(c: CompraCerrada) {
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
            "pegada",
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
        cantidad: v.cantidadQueCruza,
        unidad: v.unidad,
      })),
    };
    void repositorioCompras.agregar(compra);
    setCompras((cs) => [compra, ...cs]);

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
        ? "Wong no contestó · sigue en tu lista"
        : repetida
          ? "ya está en tu lista"
          : it.elegido?.motivo === "no lo entendí"
          ? "no entendí qué buscar"
          : "no lo encontré en Wong";
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
          ingrediente={deLaLinea > 1 ? it.ingrediente : l.texto}
          estado="sin-resultado"
          nota={nota}
          acciones={acciones}
          orden={i}
        />
      );
    }

    const otras = it.candidatos.filter((c) => c.sku !== it.elegido?.sku && c.encontrado);
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
        texto: `Otra marca o tamaño (${otras.length})`,
        onClick: () => setHoja({ tipo: "opciones", ingrediente: it.ingrediente }),
      });
    if (deLaLinea === 1) acciones.push({ texto: "Quitar", onClick: quitarLinea });
    else
      acciones.push({
        texto: it.fuera ? "Volver a ponerlo" : "Sin esto",
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
        ingrediente={deLaLinea > 1 ? it.ingrediente : l.texto}
        producto={it.elegido}
        estado={estado}
        cantidad={cantidadDe(it, perfil)}
        subtotal={it.fuera ? undefined : subtotal}
        confianza={it.fuera ? undefined : confianzaDe(it, perfil, estado)}
        acciones={acciones}
        atenuada={it.fuera}
        orden={i}
        mostrarPara={!nombreDice(it.elegido?.nombre, deLaLinea > 1 ? it.ingrediente : l.texto)}
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
      {ruta === "lista" && (
        <Pantalla
          sentido={sentido}
          encabezado={
            <Cabecera
              monograma={monograma(casa)}
              nombre={casa.nombre}
              onCasa={() => ir("casa")}
              onMarchaBlanca={() =>
                setAviso({
                  texto:
                    "SuperCarrito recién empieza. Los precios los confirma tu Wong antes de pagar; si algo sale raro, cuéntanos y lo arreglamos.",
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
              <h1 style={tituloHome}>
                {vacia ? "Arma tu lista" : `Tu lista, ${saludo(casa)}`}
              </h1>

              {/* Dónde estás en el camino. Tres pasos que se leen de un
                  vistazo: la familia siempre sabe qué falta para terminar. */}
              <Pasos actual={vivos.length > 0 ? 2 : 1} />

              {/* La tienda vive aquí arriba, sobre la lista: de ella salen los
                  precios que se ven debajo. Elegirla no es un paso: es un dato. */}
              <BarraTienda
                tienda={perfil.tienda?.nombre}
                distrito={perfil.tienda?.distrito}
                onCambiar={abrirTienda}
              />

              {/* La caja es la puerta principal: una línea o un WhatsApp
                  entero, como salga. */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 6px 6px 14px",
                  borderRadius: 14,
                  border: `1.5px solid ${color.tinta}`,
                  background: color.blanco,
                }}
              >
                <Compositor
                  ref={compRef}
                  valor={borrador}
                  marcador={vacia ? "leche, pan, 2 kg de papa…" : "añade algo más…"}
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
                  Añadir
                </Boton>
              </div>

              <Atajos
                atajos={[
                  {
                    clave: "pegar",
                    texto: "Pegar WhatsApp",
                    onClick: () => {
                      compRef.current?.focus();
                      setAviso({ texto: "Pega aquí tu mensaje tal cual. Yo separo lo que es compra." });
                    },
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
                  Wong, con foto y precio. Tú decides marca, tamaño y cantidad.
                </p>
              )}

              {/* La lista ES el carrito. Cada línea, en el orden en que la
                  familia la escribió, con sus productos debajo. */}
              <div style={{ marginTop: vacia ? 0 : 14 }}>
                {lineasCompra.map((l) => {
                  const suyos = (items ?? []).filter((i) => i.lineaId === l.id);
                  if (buscandoIds.has(l.id) || suyos.length === 0)
                    return (
                      <LineaCarrito key={l.id} ingrediente={l.texto} estado="buscando" />
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
                {pendientes > 0 && (
                  <div style={{ ...lapiz, marginBottom: 8 }}>
                    {pendientes === 1
                      ? "Un producto todavía no suma: falta saber cuánto llevas."
                      : `${pendientes} productos todavía no suman: falta saber cuánto llevas.`}
                  </div>
                )}
                {perfil.tienda && preciosDeTienda === false && (
                  <div style={{ ...lapiz, marginBottom: 8 }}>
                    {perfil.tienda.nombre} no me contestó: estos son precios
                    referenciales, no los suyos.
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
                  <span>
                    <span style={{ ...rotulo, display: "block" }}>
                      {esperandoTienda
                        ? `Preguntando a ${perfil.tienda?.nombre ?? "tu Wong"}…`
                        : cuentan === 0
                          ? "Aún no suma"
                          : pendientes > 0
                            ? `${cuentan} ${cuentan === 1 ? "producto" : "productos"} · subtotal`
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
                  <Boton
                    variante="lleno"
                    onClick={() => ir("pedir")}
                    disabled={buscandoIds.size > 0 && cuentan === 0}
                  >
                    Revisar y pedir
                  </Boton>
                </div>
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
              <Pasos actual={3} />
              <p style={{ lineHeight: 1.55, margin: "6px 0 4px", color: color.tinta, fontWeight: 500 }}>
                {perfil.tienda ? `Tu compra en ${perfil.tienda.nombre}` : "Tu compra en Wong"}
              </p>
              <p style={{ ...lapiz, margin: "0 0 14px" }}>
                {perfil.tienda && montoDeTienda != null
                  ? `Precios de tu tienda${horaPrecios ? `, hoy ${hora(horaPrecios)}` : ""}.`
                  : "Precios referenciales: el total lo confirma tu tienda."}{" "}
                {!perfil.tienda && (
                  <button onClick={abrirTienda} style={enlaceTexto}>
                    Elegir mi tienda
                  </button>
                )}
              </p>

              <Renglon
                izquierda={`${entrega.viajan.length} ${entrega.viajan.length === 1 ? "producto" : "productos"}`}
                derecha={montoEntrega > 0 ? soles(montoEntrega) : "S/ —"}
              />
              <Renglon izquierda="Delivery" derecha="lo confirma Wong al pagar" suave />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  padding: "12px 0 14px",
                  marginBottom: 6,
                  borderBottom: `1px solid ${color.renglon}`,
                }}
              >
                <span style={rotulo}>Lo que llevas</span>
                <span
                  key={montoEntrega}
                  className="sc-monto"
                  style={{ ...plata, fontSize: 25, letterSpacing: "-0.03em" }}
                >
                  {montoEntrega > 0 ? soles(montoEntrega) : "S/ —"}
                </span>
              </div>

              {/* Redondeos a la vista. Siempre hacia arriba y jamás en silencio. */}
              {ajustes.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <Seccion>Ajustado para que Wong pueda venderlo</Seccion>
                  {ajustes.map((a) => (
                    <p key={a.nombre} style={{ ...lapiz, margin: "4px 0" }}>
                      {a.nombre}: pediste {a.pedida} · van {a.cruza}
                    </p>
                  ))}
                </div>
              )}

              {entrega.sequedan.length > 0 && (
                <div>
                  <Seccion>No va esta vez</Seccion>
                  {entrega.sequedan.map((s) => (
                    <p key={s.nombre} style={{ ...lapiz, margin: "4px 0" }}>
                      {s.nombre} — {s.motivo}. Sigue en tu lista.
                    </p>
                  ))}
                </div>
              )}

              <p style={{ ...lapiz, margin: "16px 0 0" }}>
                Abro tu carrito en Wong con todo dentro. Pagas allá, con tu cuenta
                de siempre; nosotros no tocamos tu tarjeta. Si Wong te pide
                iniciar sesión, es normal.
              </p>
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
                    Abrir mi carrito en Wong
                  </Boton>
                </a>
                {/* En Android la app de Wong se come el enlace: la copia es el
                    único camino, y tiene que estar ANTES del salto. */}
                <Boton style={{ width: "100%", marginTop: 8 }} onClick={copiarEnlace}>
                  {copiado ? "✓ Copiado — pégalo en tu navegador" : "Copiar el enlace"}
                </Boton>
                <p style={{ ...lapiz, marginTop: 8, textAlign: "center" }}>
                  Si se abre la app de Wong con el carrito vacío, usa el enlace.
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
          titulo={`Tu compra está en Wong: ${ultimaCompra?.n ?? 0} ${
            ultimaCompra?.n === 1 ? "producto" : "productos"
          }.`}
          texto={
            (ultimaCompra?.quedaron ?? 0) > 0
              ? "Termina el pago allá. Lo que no cruzó sigue anotado aquí para la próxima."
              : "Solo te falta pagar allá. Tu lista quedó limpia."
          }
          accion={{ texto: "Volver a mi lista", onClick: () => ir("lista") }}
        />
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
                titulo="Todavía no sé nada de ustedes."
                texto="Aquí van a ir apareciendo su tienda, sus marcas y sus compras — solo de verlos comprar. No hay nada que rellenar."
              />
            ) : (
              <>
                {perfil.tienda && (
                  <>
                    <Seccion>Dónde compran</Seccion>
                    <Fila
                      titulo={perfil.tienda.nombre}
                      nota={`${perfil.tienda.distrito ? perfil.tienda.distrito + " · " : ""}precios y stock de esta tienda`}
                      derecha={
                        <Boton onClick={abrirTienda}>Cambiar</Boton>
                      }
                    />
                  </>
                )}

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

      {hojaTienda && (
        <Hoja
          titulo="¿Cuál es tu Wong?"
          sub="Cada tienda tiene sus precios y su stock. Con la tuya, lo que veas será lo que pagas."
          onCerrar={() => setHojaTienda(false)}
        >
          {tiendas === null ? (
            <p style={lapiz}>Buscando las tiendas…</p>
          ) : tiendas.length === 0 ? (
            <p style={lapiz}>
              No pude traer la lista de tiendas. Puedes seguir sin elegir: los
              precios serán referenciales.
            </p>
          ) : (
            <select
              className="sc-campo"
              value={filtroTienda}
              onChange={(e) => {
                setFiltroTienda(e.target.value);
                const t = tiendas.find((x) => x.id === e.target.value);
                if (t) tomarTienda(t);
              }}
              style={{ width: "100%" }}
            >
              <option value="">Elige tu tienda…</option>
              {tiendas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                  {t.distrito ? ` · ${t.distrito}` : ""}
                </option>
              ))}
            </select>
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

const tituloHome: React.CSSProperties = {
  fontFamily: fuente,
  fontSize: 23,
  fontWeight: 600,
  color: color.tinta,
  letterSpacing: "-0.03em",
  lineHeight: 1.22,
  margin: "2px 0 10px",
};

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
function Pasos({ actual }: { actual: 1 | 2 | 3 }) {
  const pasos = ["Arma tu lista", "Revisa", "Pide en Wong"];
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

// De dónde salen los precios que se ven debajo. Siempre a la vista y siempre
// cambiable: la tienda es un dato de la familia, no un paso del flujo.
function BarraTienda({
  tienda,
  distrito,
  onCambiar,
}: {
  tienda?: string;
  distrito?: string;
  onCambiar: () => void;
}) {
  return (
    <button
      onClick={onCambiar}
      className="sc-boton"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 12px",
        margin: "0 0 12px",
        borderRadius: 12,
        border: `1px solid ${color.renglon}`,
        background: color.blanco,
        cursor: "pointer",
        fontFamily: fuente,
        textAlign: "left",
        minHeight: 44,
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11, color: color.lapiz }}>
          {tienda ? "Precios y stock de" : "¿Dónde compras?"}
        </span>
        <span
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: color.tinta,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {tienda ? `${tienda}${distrito ? ` · ${distrito}` : ""}` : "Elige tu Wong para ver tus precios"}
        </span>
      </span>
      <span style={{ fontSize: 12.5, color: color.tinta, textDecoration: "underline", flex: "0 0 auto" }}>
        {tienda ? "Cambiar" : "Elegir"}
      </span>
    </button>
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
            border: `1px solid ${color.renglon}`,
            background: color.blanco,
            color: color.tinta,
            fontFamily: fuente,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {a.texto}
        </button>
      ))}
    </div>
  );
}

// Un renglón de la cuenta: concepto a la izquierda, monto a la derecha.
function Renglon({ izquierda, derecha, suave }: { izquierda: string; derecha: string; suave?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "6px 0",
        fontSize: 14,
        color: suave ? color.lapiz : color.tinta,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span>{izquierda}</span>
      <span style={{ textAlign: "right" }}>{derecha}</span>
    </div>
  );
}
