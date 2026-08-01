"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  aprenderCantidad,
  aprenderDeCorreccion,
  contarPreguntasEvitadas,
  elegir,
  perfilVacio,
  preferenciaDe,
  type Perfil,
} from "@/lib/preferencias";
import { etiquetaUnitaria, formatearCantidad, opcionesDeCantidad } from "@/lib/cantidades";
import { repositorioPerfil, repositorioHistorial } from "@/lib/perfil-store";
import { ahora } from "@/lib/historial";
import RevisionCaptura from "@/app/RevisionCaptura";
import type { LineaExtraida } from "@/lib/evidencia";
import type { ProductoWong } from "@/lib/catalog";

type Item = ProductoWong & {
  alternativa: boolean; // se encontró con un término más genérico
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

// Un ingrediente ya resuelto contra el perfil de la familia.
type ItemResuelto = {
  ingrediente: string;
  candidatos: ProductoWong[]; // [lo que propone el catálogo, ...alternativas]
  elegido: ProductoWong;
  porPerfil: boolean; // lo eligió la familia, no el catálogo

  // Lo que pedía la evidencia, sin contrastar. Se conserva porque al cambiar de
  // producto puede cambiar la unidad de venta.
  cantidadPedida?: number;
  unidadPedida?: "kg" | "un";

  // Lo que el usuario respondió aquí mismo a "¿cuánto compras normalmente?".
  cantidadElegida?: number;
};

type Carrito = Omit<CarritoApi, "items" | "total" | "pendientes"> & {
  items: ItemResuelto[];
};

type Mensaje = { autor: "user" | "bot"; texto?: string; data?: Carrito };

type MenuResumen = { numero: string; nombre: string; platos: string[] };

// --- Resolver el carrito con el perfil ---------------------------------------
// Ciclo 5: el servidor propone candidatos; quien elige es la memoria de la
// familia. Cada ambigüedad que el perfil resuelve es una pregunta que no hicimos.

function resolver(data: CarritoApi, perfil: Perfil) {
  let evitadas = 0;

  const items: ItemResuelto[] = data.items.map((it) => {
    const { alternativas, ...defecto } = it;
    const candidatos = [defecto as ProductoWong, ...(alternativas ?? [])];
    const pref = preferenciaDe(perfil, it.ingrediente);
    const { elegido, porPerfil } = elegir(candidatos, pref);

    // Solo cuenta si de verdad había algo que decidir.
    if (porPerfil && candidatos.length > 1) evitadas++;

    // Recordar cuánto compra esta familia también es una pregunta que no
    // hicimos — y es la más literal de todas, porque la habríamos hecho en
    // pantalla. Sin esto el indicador mentiría por defecto.
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

  return { carrito: { ...data, items } as Carrito, evitadas };
}

// --- La cantidad que vamos a comprar -----------------------------------------
// Se decide en el cliente y no en el servidor porque depende del perfil, que
// vive en el navegador. Orden de prioridad, del más fuerte al más débil:
//   1. lo que el usuario acaba de responder aquí,
//   2. lo que traía la evidencia (solo si habla la misma unidad),
//   3. lo que ya sabemos de esta familia,
//   4. nada — y entonces el producto queda PENDIENTE.
// Un producto por pieza es siempre 1: no hay ambigüedad que resolver.
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
// más arriba.
function totalDe(items: ItemResuelto[], perfil: Perfil) {
  let total = 0;
  let pendientes = 0;
  for (const it of items) {
    const s = subtotalDe(it, perfil);
    if (s === undefined) pendientes++;
    else total += s;
  }
  return { total: Math.round(total * 100) / 100, pendientes };
}

// El archivo se lee en el navegador y se manda en base64. La clave de la API
// vive solo en el servidor: el cliente nunca habla con ningún proveedor.
function leerBase64(archivo: File): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => {
      const url = String(lector.result);
      resolver(url.slice(url.indexOf(",") + 1)); // quita "data:image/png;base64,"
    };
    lector.onerror = () => rechazar(new Error("no se pudo leer el archivo"));
    lector.readAsDataURL(archivo);
  });
}

export default function Home() {
  const [input, setInput] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [menus, setMenus] = useState<MenuResumen[]>([]);
  const [perfil, setPerfil] = useState<Perfil>(perfilVacio());
  const [revision, setRevision] = useState<LineaExtraida[] | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorCaptura, setErrorCaptura] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);

  // El perfil vive en el navegador (decisión de la PO: sin login todavía).
  // Se carga por el repositorio, nunca leyendo localStorage directamente.
  useEffect(() => {
    repositorioPerfil.cargar().then(setPerfil);
  }, []);

  // Siempre sobre el perfil MÁS RECIENTE, nunca sobre el del closure: dos
  // correcciones seguidas no pueden pisarse. Perder aprendizaje = perder el activo.
  const actualizarPerfil = useCallback((fn: (p: Perfil) => Perfil) => {
    setPerfil((actual) => {
      const nuevo = fn(actual);
      void repositorioPerfil.guardar(nuevo);
      return nuevo;
    });
  }, []);

  useEffect(() => {
    fetch("/api/menus")
      .then((r) => r.json())
      .then((d) => setMenus(d.menus ?? []))
      .catch(() => setMenus([]));
  }, []);

  function rellenar(texto: string) {
    setInput(texto);
    inputRef.current?.focus();
  }

  // Una sola función para pedir el carrito, venga por la puerta que venga:
  // texto escrito o captura importada. Todo lo de después es idéntico.
  async function pedirCarrito(
    cuerpo:
      | { mensaje: string }
      | {
          lista: { producto: string; cantidad?: number; unidad?: "kg" | "un" }[];
          titulo: string;
        },
    etiquetaUsuario: string,
    textoParaHistorial: string
  ) {
    if (cargando) return;
    setMensajes((m) => [...m, { autor: "user", texto: etiquetaUsuario }]);
    setCargando(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const data = await res.json();

      if (data.ok) {
        const { carrito, evitadas } = resolver(data as CarritoApi, perfil);
        setMensajes((m) => [...m, { autor: "bot", data: carrito }]);
        if (evitadas > 0) actualizarPerfil((p) => contarPreguntasEvitadas(p, evitadas));

        // HECHO: qué escribió y qué le propusimos. Guardar la propuesta permite
        // deducir mañana lo que hoy no registramos: qué NO corrigió.
        void repositorioHistorial.agregar({
          tipo: "escribio",
          ts: ahora(),
          texto: textoParaHistorial,
          propuestas: carrito.items.map((it) => ({
            ingrediente: it.ingrediente,
            nombre: it.elegido?.nombre,
            marca: it.elegido?.marca,
            precio: it.elegido?.precio,
            porPerfil: it.porPerfil,
            origen: { proveedor: it.elegido?.proveedor, sku: it.elegido?.sku },
          })),
        });
      } else {
        setMensajes((m) => [...m, { autor: "bot", texto: data.texto }]);
      }
    } catch {
      setMensajes((m) => [
        ...m,
        { autor: "bot", texto: "Ups, algo falló. Intenta de nuevo." },
      ]);
    } finally {
      setCargando(false);
    }
  }

  async function enviar(textoDirecto?: string) {
    const texto = (textoDirecto ?? input).trim();
    if (!texto || cargando) return;
    setInput("");
    await pedirCarrito({ mensaje: texto }, texto, texto);
  }

  // --- Importar una captura ---------------------------------------------------
  // Cuarta puerta al mismo normalizador. La captura NO se convierte en carrito
  // directamente: pasa por revisión. Nadie compra a ciegas lo que leyó una máquina.

  async function subirCaptura(archivo: File) {
    if (subiendo || cargando) return;
    setErrorCaptura(null);
    setSubiendo(true);
    try {
      const base64 = await leerBase64(archivo);
      const res = await fetch("/api/importar-captura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType: archivo.type, base64 }),
      });
      const data = await res.json();

      if (!data.ok || !data.reconocida || !data.lineas?.length) {
        setErrorCaptura(
          data.motivo ?? "No reconocí un carrito en esa imagen. Prueba con otra captura."
        );
        return;
      }
      setRevision(data.lineas as LineaExtraida[]);
    } catch {
      setErrorCaptura("No pude subir la imagen. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  }

  async function confirmarRevision(elegidas: LineaExtraida[], edicionesUsadas: number) {
    setRevision(null);
    // Cuántos nombres hizo falta corregir a mano: si es casi siempre cero, la
    // UI de edición sobra y se quita. Dato, no intuición.
    if (edicionesUsadas > 0) console.info(`[revision] ${edicionesUsadas} nombre(s) corregidos`);

    await pedirCarrito(
      {
        lista: elegidas.map((l) => ({
          producto: l.producto,
          cantidad: l.cantidad,
          unidad: l.unidad,
        })),
        titulo: "Tu compra importada",
      },
      `📷 Captura importada · ${elegidas.length} producto${elegidas.length === 1 ? "" : "s"}`,
      "(captura importada)"
    );
  }

  // La ÚNICA pregunta que hace el producto, y solo cuando sin la respuesta no
  // podríamos mostrar un monto explicable. Se guarda en el perfil para no
  // volver a hacerla: preguntar dos veces lo mismo rompe la promesa.
  function responderCantidad(msgIdx: number, ingrediente: string, cantidad: number) {
    setMensajes((ms) =>
      ms.map((m, i) =>
        i !== msgIdx || !m.data
          ? m
          : {
              ...m,
              data: {
                ...m.data,
                items: m.data.items.map((it) =>
                  it.ingrediente === ingrediente ? { ...it, cantidadElegida: cantidad } : it
                ),
              },
            }
      )
    );
    actualizarPerfil((p) => aprenderCantidad(p, ingrediente, cantidad));
  }

  // ⭐ La captura de señal. Único aprendizaje del ciclo 5: sin preguntas, sin
  // fricción. El usuario corrige porque quiere, y nosotros lo recordamos.
  function corregir(msgIdx: number, ingrediente: string, nuevo: ProductoWong) {
    const candidatos =
      mensajes[msgIdx]?.data?.items.find((it) => it.ingrediente === ingrediente)
        ?.candidatos ?? [];

    setMensajes((ms) =>
      ms.map((m, i) =>
        i !== msgIdx || !m.data
          ? m
          : {
              ...m,
              data: {
                ...m.data,
                items: m.data.items.map((it) =>
                  it.ingrediente === ingrediente
                    ? { ...it, elegido: nuevo, porPerfil: true }
                    : it
                ),
              },
            }
      )
    );

    // HECHO: nos corrigió, y entre qué opciones. El perfil que derivamos de esto
    // es una opinión revisable; esto no.
    void repositorioHistorial.agregar({
      tipo: "eligio",
      ts: ahora(),
      ingrediente,
      nombre: nuevo.nombre,
      marca: nuevo.marca,
      presentacion: nuevo.presentacion,
      precio: nuevo.precio,
      origen: { proveedor: nuevo.proveedor, sku: nuevo.sku },
      candidatos: candidatos.map((c) => ({
        nombre: c.nombre,
        marca: c.marca,
        precio: c.precio,
      })),
    });

    actualizarPerfil((p) => aprenderDeCorreccion(p, ingrediente, nuevo, candidatos));
  }

  const nPrefs = Object.keys(perfil.preferencias).length;

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ fontSize: 22 }}>🛒 Super Carrito</h1>
        <a href="/editar" style={{ color: "#4338ca", fontSize: 14 }}>
          ✏️ Editar menús
        </a>
      </div>
      <p style={{ color: "#71717a", marginTop: 0 }}>
        Dime qué necesitas comprar —como te salga— y te lo dejo en un{" "}
        <b>carrito con precios</b>, listo para comprar.
      </p>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* La revisión ocupa la pantalla: es una decisión, no un mensaje más. */}
        {revision ? (
          <RevisionCaptura
            lineas={revision}
            onConfirmar={confirmarRevision}
            onCancelar={() => setRevision(null)}
          />
        ) : (
          <>
            {mensajes.length === 0 && !cargando && !subiendo && (
              <Inicio
                menuEjemplo={menus[1]?.numero ?? menus[0]?.numero ?? "2"}
                onRellenar={rellenar}
                onImportar={() => archivoRef.current?.click()}
              />
            )}
            {mensajes.map((m, i) => (
              <Burbuja
                key={i}
                mensaje={m}
                perfil={perfil}
                onCorregir={(ing, prod) => corregir(i, ing, prod)}
                onCantidad={(ing, c) => responderCantidad(i, ing, c)}
              />
            ))}
            {errorCaptura && (
              <div
                style={{
                  fontSize: 13,
                  color: "#b91c1c",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                {errorCaptura}
              </div>
            )}
            {subiendo && (
              <div style={{ color: "#71717a", fontStyle: "italic" }}>
                Leyendo tu captura…
              </div>
            )}
          </>
        )}
        {cargando && (
          <div style={{ color: "#71717a", fontStyle: "italic" }}>
            Armando tu carrito…
          </div>
        )}
      </div>

      {/* Selector de archivo oculto: lo dispara cualquier botón de importar. */}
      <input
        ref={archivoRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = ""; // permite volver a elegir el mismo archivo
          if (f) void subirCaptura(f);
        }}
      />

      {!revision && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button
            onClick={() => archivoRef.current?.click()}
            disabled={subiendo || cargando}
            title="Importar una captura de tu carrito de Wong"
            aria-label="Importar una captura de tu carrito"
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #d4d4d8",
              background: "#fff",
              fontSize: 18,
              lineHeight: 1,
              cursor: subiendo || cargando ? "default" : "pointer",
              opacity: subiendo || cargando ? 0.5 : 1,
            }}
          >
            📷
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviar()}
            placeholder="pollo, pan, aceite…"
            aria-label="Escribe qué necesitas comprar"
            style={{
              flex: 1,
              minWidth: 0,
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #d4d4d8",
              fontSize: 16,
            }}
          />
          <button
            onClick={() => enviar()}
            disabled={cargando}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "none",
              background: "#111",
              color: "#fff",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Enviar
          </button>
        </div>
      )}

      {nPrefs > 0 && (
        <MemoriaDeCompra
          perfil={perfil}
          onOlvidar={() => {
            void repositorioPerfil.borrar();
            setPerfil(perfilVacio());
          }}
        />
      )}
    </main>
  );
}

// --- La memoria de la familia, visible ---------------------------------------
// El activo tiene que ser tangible para quien lo construye (el usuario) y
// medible para nosotros: son los dos indicadores del ciclo 5.

function MemoriaDeCompra({ perfil, onOlvidar }: { perfil: Perfil; onOlvidar: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const prefs = Object.values(perfil.preferencias);
  const { preguntasEvitadas, correcciones } = perfil.metricas;

  return (
    <div style={{ marginTop: 14, borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: "#e4e4e7", paddingTop: 10 }}>
      <button
        onClick={() => setAbierto((v) => !v)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontSize: 13,
          color: "#3f3f46",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>🧠</span>
        <b>SuperCarrito ya sabe cómo compras</b>
        <span style={{ color: "#71717a" }}>
          · {prefs.length} preferencia{prefs.length === 1 ? "" : "s"}
        </span>
        <span style={{ color: "#a1a1aa" }}>{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {prefs.map((p) => (
              <span
                key={p.ingrediente}
                title={`prioridad: ${p.prioridad.join(" > ")}`}
                style={{
                  fontSize: 12,
                  border: "1px solid #e4e4e7",
                  borderRadius: 999,
                  padding: "4px 10px",
                  background: "#fafafa",
                }}
              >
                {p.ingrediente} → <b>{p.marca ?? "el más barato"}</b>
                {p.formato ? ` · ${p.formato}` : ""}
                {p.vecesConfirmada >= 3 ? " ✓" : ""}
              </span>
            ))}
          </div>

          <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>
            Preguntas que ya no tuvimos que hacerte: <b>{preguntasEvitadas}</b>
            <br />
            Veces que nos corregiste: <b>{correcciones}</b>
            <br />
            <span style={{ color: "#a1a1aa" }}>
              Cada compra debería pedirte menos decisiones que la anterior.
            </span>
          </div>

          <button
            onClick={onOlvidar}
            style={{
              marginTop: 10,
              background: "none",
              border: "1px solid #e4e4e7",
              borderRadius: 8,
              padding: "5px 10px",
              fontSize: 12,
              color: "#b91c1c",
              cursor: "pointer",
            }}
          >
            Olvidar todo lo que aprendí
          </button>
        </div>
      )}
    </div>
  );
}

function Inicio({
  menuEjemplo,
  onRellenar,
  onImportar,
}: {
  menuEjemplo: string;
  onRellenar: (texto: string) => void;
  onImportar: () => void;
}) {
  const modos = [
    { emoji: "📝", titulo: "Escribir una lista", ej: "pollo, pan, aceite" },
    { emoji: "🥘", titulo: "Convertir una receta", ej: "ají de gallina" },
    { emoji: "🍽️", titulo: "Comprar un menú", ej: `menú ${menuEjemplo}` },
  ];
  const proximos = [{ emoji: "🎤", titulo: "Nota de voz" }];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 13, color: "#71717a", marginBottom: 10 }}>
        Empieza como te resulte natural 👇
      </div>

      {/* Primero traer, después escribir: el usuario casi nunca parte de cero. */}
      <button
        onClick={onImportar}
        style={{
          textAlign: "left",
          width: "100%",
          background: "#f5f3ff",
          border: "1px solid #ddd6fe",
          borderRadius: 14,
          padding: "12px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 22 }}>📷</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>
            Trae tu compra de la semana pasada
          </span>
          <span style={{ display: "block", fontSize: 13, color: "#6d28d9" }}>
            Sube una captura de tu carrito de Wong
          </span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#4338ca" }}>Subir →</span>
      </button>

      <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 10, lineHeight: 1.5 }}>
        Para leer la captura la enviamos a un servicio de inteligencia artificial.
        No la guardamos.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {modos.map((m) => (
          <button
            key={m.titulo}
            onClick={() => onRellenar(m.ej)}
            style={{
              textAlign: "left",
              background: "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: 14,
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <span style={{ fontSize: 22 }}>{m.emoji}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>
                {m.titulo}
              </span>
              <span style={{ display: "block", fontSize: 13, color: "#71717a" }}>
                “{m.ej}”
              </span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#4338ca" }}>
              Probar →
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {proximos.map((p) => (
          <span
            key={p.titulo}
            style={{
              fontSize: 12,
              color: "#a1a1aa",
              border: "1px dashed #d4d4d8",
              borderRadius: 999,
              padding: "5px 10px",
            }}
          >
            {p.emoji} {p.titulo} · pronto
          </span>
        ))}
      </div>
    </div>
  );
}

function Burbuja({
  mensaje,
  perfil,
  onCorregir,
  onCantidad,
}: {
  mensaje: Mensaje;
  perfil: Perfil;
  onCorregir: (ingrediente: string, producto: ProductoWong) => void;
  onCantidad: (ingrediente: string, cantidad: number) => void;
}) {
  const esUser = mensaje.autor === "user";

  if (mensaje.data) {
    return (
      <div style={{ alignSelf: "stretch" }}>
        <Carrito
          data={mensaje.data}
          perfil={perfil}
          onCorregir={onCorregir}
          onCantidad={onCantidad}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        alignSelf: esUser ? "flex-end" : "flex-start",
        background: esUser ? "#111" : "#fff",
        color: esUser ? "#fff" : "#111",
        padding: "10px 14px",
        borderRadius: 14,
        maxWidth: "85%",
        border: esUser ? "none" : "1px solid #e4e4e7",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {mensaje.texto && <span>{mensaje.texto}</span>}
    </div>
  );
}

function soles(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

function Carrito({
  data,
  perfil,
  onCorregir,
  onCantidad,
}: {
  data: Carrito;
  perfil: Perfil;
  onCorregir: (ingrediente: string, producto: ProductoWong) => void;
  onCantidad: (ingrediente: string, cantidad: number) => void;
}) {
  const degradado = data.items.some((it) => it.elegido?.degradado);
  const porPerfil = data.items.filter((it) => it.porPerfil).length;
  const { total, pendientes } = totalDe(data.items, perfil);

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{data.titulo ?? data.menu}</div>
      <div style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>
        {data.platos.length > 0
          ? data.platos.join(" · ")
          : `${data.items.length} producto${data.items.length === 1 ? "" : "s"}`}
      </div>

      {porPerfil > 0 && (
        <div style={{ fontSize: 12, color: "#15803d", marginBottom: 10 }}>
          🧠 {porPerfil} producto{porPerfil === 1 ? "" : "s"} elegido
          {porPerfil === 1 ? "" : "s"} según lo que ya sé de ti.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {data.items.map((it) => (
          <ProductoCard
            key={it.ingrediente}
            item={it}
            cantidad={cantidadDe(it, perfil)}
            subtotal={subtotalDe(it, perfil)}
            confirmada={(preferenciaDe(perfil, it.ingrediente)?.vecesConfirmada ?? 0) >= 3}
            onCorregir={(prod) => onCorregir(it.ingrediente, prod)}
            onCantidad={(c) => onCantidad(it.ingrediente, c)}
          />
        ))}
      </div>

      {/* Lo cerrado y lo abierto, separados. "Subtotal confirmado" dice
          exactamente qué parte del carrito ya no depende de una decisión. */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: "#e4e4e7",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          {/* Sin pendientes el carrito está cerrado: decir "subtotal" sonaría a
              trabajo a medias. Es la diferencia entre "va bien" y "está listo". */}
          <span style={{ fontSize: 15, fontWeight: 600 }}>
            {pendientes > 0 ? "Subtotal confirmado" : "Total"}
          </span>
          <span style={{ fontSize: 20, fontWeight: 800 }}>{soles(total)}</span>
        </div>
        {pendientes > 0 && (
          <div style={{ fontSize: 13, color: "#a16207", marginTop: 4 }}>
            {pendientes} producto{pendientes === 1 ? "" : "s"} pendiente
            {pendientes === 1 ? "" : "s"} de confirmar.
          </div>
        )}
      </div>

      {data.faltantes.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#b91c1c" }}>
          No encontré en Wong: {data.faltantes.join(", ")}.
        </div>
      )}
      {degradado && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#a16207" }}>
          Wong no respondió; mostrando catálogo de respaldo.
        </div>
      )}
    </div>
  );
}

function ProductoCard({
  item,
  cantidad,
  subtotal,
  confirmada,
  onCorregir,
  onCantidad,
}: {
  item: ItemResuelto;
  cantidad?: number;
  subtotal?: number;
  confirmada: boolean;
  onCorregir: (producto: ProductoWong) => void;
  onCantidad: (cantidad: number) => void;
}) {
  const [eligiendo, setEligiendo] = useState(false);
  const it = item.elegido;

  const card: React.CSSProperties = {
    border: item.porPerfil ? "1px solid #bbf7d0" : "1px solid #ececef",
    borderRadius: 14,
    overflow: "hidden",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  if (!it?.encontrado) {
    return (
      <div style={{ ...card, alignItems: "center", justifyContent: "center", minHeight: 150, padding: 12 }}>
        <div style={{ fontSize: 28 }}>🔍</div>
        <div style={{ fontSize: 13, color: "#71717a", textAlign: "center", marginTop: 6 }}>
          Sin resultado para <b>{item.ingrediente}</b>
        </div>
      </div>
    );
  }

  // Las otras opciones reales para este ingrediente (sin repetir la elegida).
  const otras = item.candidatos.filter((c) => c.sku !== it.sku);
  const agotado = it.disponible === false;

  if (eligiendo) {
    return (
      <div style={{ ...card, padding: 10, gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>
          ¿Cuál para “{item.ingrediente}”?
        </div>
        {otras.map((c) => (
          <button
            key={c.sku}
            onClick={() => {
              onCorregir(c);
              setEligiendo(false);
            }}
            style={{
              textAlign: "left",
              border: "1px solid #e4e4e7",
              borderRadius: 10,
              padding: "6px 8px",
              background: "#fff",
              cursor: "pointer",
              fontSize: 12,
              lineHeight: 1.3,
            }}
          >
            {/* El NOMBRE manda. Con datos reales de Wong la presentación suele
                faltar, y mostrar solo la marca produce cuatro filas idénticas
                que dicen "Costeño": el selector deja de ser usable y, con él,
                la única fuente de aprendizaje que tenemos. */}
            <b style={{ display: "block", lineHeight: 1.3 }}>{c.nombre ?? c.marca}</b>
            <span style={{ display: "block", color: "#71717a" }}>
              {[c.marca, c.presentacion].filter(Boolean).join(" · ")}
            </span>
            <span style={{ display: "block", color: "#111", fontWeight: 700, marginTop: 2 }}>
              {c.precio != null ? soles(c.precio) : "—"}
              {c.disponible === false ? " · agotado" : ""}
            </span>
          </button>
        ))}
        <button
          onClick={() => setEligiendo(false)}
          style={{
            background: "none",
            border: "none",
            fontSize: 12,
            color: "#71717a",
            cursor: "pointer",
            padding: 0,
            marginTop: 2,
          }}
        >
          Cancelar
        </button>
      </div>
    );
  }

  // Los pesables y los pendientes ocupan FILA COMPLETA. En una celda de ~165 px
  // un cálculo no se lee y una pregunta con cuatro opciones parece un
  // formulario comprimido. El problema nunca fue el texto: era el ancho.
  const esFila = (it.unidadVenta ?? "un") === "kg" || subtotal === undefined;
  const confianza = confianzaDeCantidad(item, cantidad, subtotal);

  return (
    <div
      style={{
        ...card,
        gridColumn: esFila ? "1 / -1" : undefined,
        flexDirection: esFila ? "row" : "column",
      }}
    >
      <a
        href={it.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "block",
          flexShrink: 0,
          width: esFila ? 104 : "100%",
        }}
      >
        <div
          style={{
            position: "relative",
            aspectRatio: esFila ? "1 / 1" : "4 / 3",
            background: "#f6f6f7",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={it.imagen}
            alt={it.nombre ?? item.ingrediente}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: agotado ? 0.5 : 1 }}
          />
          {agotado && (
            <span style={{ position: "absolute", top: 6, left: 6, ...pill("#fef2f2", "#b91c1c") }}>
              Agotado
            </span>
          )}
          {item.porPerfil && !agotado && (
            <span
              title={confirmada ? "Lo compras siempre" : "Lo elegiste antes"}
              style={{ position: "absolute", top: 6, left: 6, ...pill("#f0fdf4", "#15803d") }}
            >
              {confirmada ? "✓ el de siempre" : "🧠 tu elección"}
            </span>
          )}
        </div>
      </a>

      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
        {it.categoria && (
          <div style={{ fontSize: 10, letterSpacing: 0.4, textTransform: "uppercase", color: "#a1a1aa" }}>
            {it.categoria}
          </div>
        )}
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{it.nombre}</div>

        {/* ⭐ El cálculo va JUSTO debajo del nombre y se lee sin esfuerzo: es la
            pieza que construye la confianza, no una nota al pie. */}
        {subtotal === undefined ? (
          <PreguntaCantidad producto={it} onResponder={onCantidad} />
        ) : (
          <>
            <div style={{ fontSize: 13, color: "#3f3f46", lineHeight: 1.4 }}>
              {cantidad != null && formatearCantidad(cantidad, it.unidadVenta ?? "un")} ×{" "}
              {it.precio != null ? soles(it.precio) : "—"}
              {etiquetaUnitaria(it.unidadVenta ?? "un")}
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, whiteSpace: "nowrap", lineHeight: 1.1 }}>
              {soles(subtotal)}
            </div>
            {confianza && (
              <div style={{ marginTop: 2 }}>
                <span style={pill(confianza.fondo, confianza.color)}>{confianza.texto}</span>
              </div>
            )}
          </>
        )}

        <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 2 }}>
          {[it.marca, it.presentacion].filter(Boolean).join(" · ")}
        </div>
        {/* "para X" solo cuando dice algo. Si lo que pidió el usuario ya está
            contenido en el nombre del producto, la correspondencia es obvia y la
            línea es ruido. Cuando NO lo está es exactamente la señal que
            necesitamos ver en las entrevistas: ahí el emparejamiento pudo fallar. */}
        {vale_la_pena_mostrar_para(item.ingrediente, it.nombre) && (
          <div
            title={`para ${item.ingrediente}`}
            style={{
              fontSize: 10,
              color: "#a1a1aa",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            para {item.ingrediente}
          </div>
        )}

        {/* ⭐ La puerta de entrada al aprendizaje. Sin esto no hay activo.
            Va DENTRO de la columna de contenido: en las tarjetas de fila, como
            hermano de la imagen, se iba flotando a la derecha.
            Si no hay otras opciones no se ofrece: un botón que lleva a "no hay
            nada" es una promesa incumplida. */}
        {otras.length > 0 && (
          <button
            onClick={() => setEligiendo(true)}
            style={{
              alignSelf: "flex-start",
              marginTop: 6,
              border: "none",
              background: "none",
              padding: 0,
              fontSize: 12,
              color: "#4338ca",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Prefiero otra ({otras.length})
          </button>
        )}
      </div>
    </div>
  );
}

// ¿Aporta algo decir "para pollo" bajo un producto que se llama "Pollo Fresco
// Entero"? No. ¿Y bajo uno que se llama "Ostras Vivas"? Todo. Mostramos la línea
// solo cuando lo que pidió el usuario NO se reconoce en el nombre del producto:
// justo los casos donde el emparejamiento pudo fallar.
function vale_la_pena_mostrar_para(ingrediente: string, nombre?: string): boolean {
  if (!nombre) return true;
  const limpiar = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const cortas = new Set(["de", "del", "la", "el", "los", "las", "en", "y", "con", "x", "un"]);
  const palabras = limpiar(ingrediente)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 2 && !cortas.has(p));
  if (palabras.length === 0) return true;

  const enNombre = limpiar(nombre);
  const reconocidas = palabras.filter((p) => enNombre.includes(p)).length;
  return reconocidas / palabras.length < 0.6; // se reconoce mal -> mostrarlo
}

// El grado de confianza de la cantidad, en el idioma del usuario. NO explicamos
// el sistema ("de tu captura", "del perfil"): comunicamos cuánto puede fiarse.
function confianzaDeCantidad(
  item: ItemResuelto,
  cantidad?: number,
  subtotal?: number
): { texto: string; fondo: string; color: string } | null {
  if (subtotal === undefined) return { texto: "Pendiente de confirmar", fondo: "#fefce8", color: "#a16207" };
  // Una unidad de un producto por pieza no necesita explicación.
  if ((item.elegido?.unidadVenta ?? "un") !== "kg") return null;
  if (cantidad == null) return null;
  if (item.cantidadElegida != null)
    return { texto: "Lo acabas de confirmar", fondo: "#f0fdf4", color: "#15803d" };
  return { texto: "Basado en tu compra anterior", fondo: "#eef2ff", color: "#4338ca" };
}

// El momento en que preguntamos. No es un formulario: es la única pregunta que
// hace el producto, aparece solo donde sin ella no habría monto explicable, y
// la respuesta se guarda en el perfil para no volver a hacerla nunca.
//
// 🚪 PRINCIPIO: toda pregunta cerrada tiene una salida abierta. Si las opciones
// rápidas no incluyen lo que esta familia compra de verdad, la obligaríamos a
// enseñarnos un dato falso — y ese dato se quedaría en su perfil para siempre.
function PreguntaCantidad({
  producto,
  onResponder,
}: {
  producto: ProductoWong;
  onResponder: (cantidad: number) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const [texto, setTexto] = useState("");
  const unidad = producto.unidadVenta ?? "un";
  const opciones = opcionesDeCantidad(producto.cantidadMinima, unidad);

  // En kg se escribe en gramos, que es como habla la gente en el supermercado.
  const enGramos = unidad === "kg";
  const valor = Number(texto.replace(",", "."));
  const valido = Number.isFinite(valor) && valor > 0;
  const cantidadFinal = enGramos ? valor / 1000 : valor;

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>
        {producto.precio != null ? soles(producto.precio) : "—"}
        {etiquetaUnitaria(unidad)}
      </div>
      <div style={{ marginTop: 3, marginBottom: 7 }}>
        <span style={pill("#fefce8", "#a16207")}>Pendiente de confirmar</span>
      </div>
      <div style={{ fontSize: 13, color: "#3f3f46", marginBottom: 6 }}>
        ¿Cuánto sueles llevar?
      </div>

      {abierta ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <input
            autoFocus
            inputMode="decimal"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && valido && onResponder(cantidadFinal)}
            placeholder={enGramos ? "por ejemplo 1200" : "por ejemplo 3"}
            aria-label={enGramos ? "Cantidad en gramos" : "Cantidad de unidades"}
            style={{
              width: 110,
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #d4d4d8",
              fontSize: 14,
            }}
          />
          <span style={{ fontSize: 13, color: "#71717a" }}>{enGramos ? "g" : "un"}</span>
          <button
            onClick={() => valido && onResponder(cantidadFinal)}
            disabled={!valido}
            style={{
              border: "none",
              borderRadius: 8,
              background: valido ? "#111" : "#e4e4e7",
              color: "#fff",
              padding: "6px 12px",
              fontSize: 13,
              fontWeight: 600,
              cursor: valido ? "pointer" : "default",
            }}
          >
            Listo
          </button>
          <button
            onClick={() => setAbierta(false)}
            style={{ border: "none", background: "none", fontSize: 12, color: "#71717a", cursor: "pointer" }}
          >
            Volver
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {opciones.map((c) => (
            <button
              key={c}
              onClick={() => onResponder(c)}
              style={{
                border: "1px solid #d4d4d8",
                borderRadius: 999,
                background: "#fff",
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {formatearCantidad(c, unidad)}
            </button>
          ))}
          {/* 🚪 La salida abierta. Sin esto, una familia que compra 1,2 kg tiene
              que mentirnos — y guardaríamos esa mentira en su perfil. */}
          <button
            onClick={() => setAbierta(true)}
            style={{
              border: "1px dashed #d4d4d8",
              borderRadius: 999,
              background: "#fff",
              padding: "6px 12px",
              fontSize: 13,
              color: "#4338ca",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Otra cantidad…
          </button>
        </div>
      )}

      <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 6 }}>
        Lo recordaré para tus próximas compras.
      </div>
    </div>
  );
}

function pill(bg: string, color: string): React.CSSProperties {
  return {
    padding: "2px 8px",
    borderRadius: 999,
    background: bg,
    color,
    fontSize: 11,
    fontWeight: 700,
  };
}
