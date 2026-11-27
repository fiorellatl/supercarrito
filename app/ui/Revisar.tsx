"use client";

// «Revisar y pedir», rediseñado el 2026-11-27 (PO: «está bien el flujo pero
// mejora el UX… demasiado texto, le faltan cards»). Wireframe aprobado:
//
//   ¿Dónde lo pides?
//   ┌ ◉ Wong Benavides · tu tienda ─┐   ← UN total: el de tu carrito
//   │ 6 productos         S/ 187.70 │
//   │ Envío a [Miraflores▾] S/ 9.90 │
//   │ Total               S/ 197.60 │
//   └───────────────────────────────┘
//   ┌ ○ Metro Schell Miraflores ────┐   ← tocarla = pedir allá
//   │ Ahorras S/ 8.10               │
//   │ 5 iguales: 164.90 vs 171.00 … │
//   └───────────────────────────────┘
//   [ Va: 6 · 1 ajuste ▸ ]  [ ¿Tarjeta con descuento? ▸ ]
//
// Reglas que no cambian con el diseño: el total es el que da la tienda; el
// envío se ve aparte y sumado a la vista; la comparación es solo del MISMO
// producto (lib/comparar.ts) y dice cuántos no entran; la tarjeta no resta.

import { useState } from "react";
import Boton from "@/app/ui/Boton";
import Hoja from "@/app/ui/Hoja";
import { color, fuente, lapiz, plata, radio, soles } from "@/app/ui/sistema";
import type { ProductoWong } from "@/lib/catalog";
import type { Tienda } from "@/lib/tienda";
import distritos from "@/data/distritos.json";
import { CADENA_POR_DEFECTO, cadenasDisponibles } from "@/lib/cadenas";

export const OTRO_DISTRITO = "Otro distrito";

export type EstadoEnvio =
  | { tipo: "sin-distrito" }
  | { tipo: "cargando" }
  | { tipo: "sin-respuesta" }
  | { tipo: "no-llega" }
  | { tipo: "listo"; precio: number; precioMaximo?: number; desde?: string; hasta?: string };

export type Lado = { tienda: Tienda; total?: number; envio?: { hay: boolean; precio?: number } };

export type EstadoComparar =
  | { tipo: "nada" }
  | { tipo: "cargando" }
  | { tipo: "sin-respuesta" }
  | {
      tipo: "listo";
      comparados: number;
      origen: Lado;
      destino: Lado;
      fuera: { nombre: string; motivo: string }[];
      equivalentes: Record<string, ProductoWong>;
    };

const redondo = (n: number) => Math.round(n * 100) / 100;

// VTEX devuelve las franjas con «+00:00», pero son hora de Lima (medido el
// 2026-11-27 a las 3:20 pm: la primera franja de Miraflores era «16:00»). Se
// lee la hora tal cual viene escrita.
export function franja(desde?: string, hasta?: string): string | null {
  if (!desde) return null;
  const h = (iso: string) => {
    const n = Number(iso.slice(11, 13));
    const m = iso.slice(14, 16);
    return `${n % 12 === 0 ? 12 : n % 12}${m !== "00" ? `:${m}` : ""}`;
  };
  const pm = (iso: string) => (Number(iso.slice(11, 13)) < 12 ? "am" : "pm");
  const dia = desde.slice(0, 10);
  const lima = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  const cuando =
    dia === lima(Date.now())
      ? "hoy"
      : dia === lima(Date.now() + 864e5)
        ? "mañana"
        : new Date(`${dia}T12:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric" });
  // «17:00:59» es el final de la franja de las 4: se lee como «5 pm».
  return hasta
    ? `${cuando} ${h(desde)}–${h(hasta)} ${pm(hasta)}`
    : `${cuando} ${h(desde)} ${pm(desde)}`;
}

// --- Piezas ---------------------------------------------------------------

const tarjeta = (activa: boolean): React.CSSProperties => ({
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  textAlign: "left",
  padding: "14px 16px",
  borderRadius: radio.fila,
  border: `2px solid ${activa ? color.tinta : "transparent"}`,
  background: activa ? color.papel : color.papel2,
  fontFamily: fuente,
  color: color.tinta,
});

function Fila({
  izquierda,
  derecha,
  fuerte,
  suave,
}: {
  izquierda: React.ReactNode;
  derecha: React.ReactNode;
  fuerte?: boolean;
  suave?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        minHeight: 32,
        fontSize: fuerte ? 16 : 14,
        fontWeight: fuerte ? 700 : 400,
        color: suave ? color.lapiz : color.tinta,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span style={{ minWidth: 0 }}>{izquierda}</span>
      <span style={{ textAlign: "right", whiteSpace: "nowrap" }}>{derecha}</span>
    </div>
  );
}

function Punto({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        flex: "0 0 auto",
        width: 20,
        height: 20,
        borderRadius: 999,
        border: `2px solid ${on ? color.tinta : color.lapiz2}`,
        display: "grid",
        placeItems: "center",
      }}
    >
      {on && <span style={{ width: 10, height: 10, borderRadius: 999, background: color.tinta }} />}
    </span>
  );
}

function Sello({ children, tono = "pino" }: { children: React.ReactNode; tono?: "pino" | "aji" }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 800,
        background: tono === "pino" ? color.pino : color.aji,
        color: tono === "pino" ? "#fff" : color.tinta,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// --- Tu tienda: el carrito que se va a abrir ---------------------------------

export function TuTienda({
  tienda,
  cadena,
  actualizado,
  productos,
  monto,
  precioDeTienda,
  distrito,
  onDistrito,
  envio,
  conTarjeta,
  onCambiarTienda,
}: {
  tienda?: { nombre: string };
  // Cuánto descontaría la tienda con la tarjeta de la familia. Va aparte: la
  // tienda lo resta al pagar, no en el carrito.
  conTarjeta?: { tarjeta: string; ahorro: number; productos: number };
  cadena: string;
  actualizado?: string; // «4:05 p. m.»: cuándo dio la tienda estos precios
  productos: number;
  monto: number;
  precioDeTienda: boolean; // false = referencial: aún no lo confirmó la tienda
  distrito?: string;
  onDistrito: (d: string) => void;
  envio: EstadoEnvio;
  onCambiarTienda: () => void;
}) {
  const conEnvio = envio.tipo === "listo" && distrito !== OTRO_DISTRITO;
  const textoEnvio =
    distrito === OTRO_DISTRITO
      ? "al pagar"
      : envio.tipo === "listo"
        ? envio.precio > 0
          ? `${envio.precioMaximo ? "desde " : ""}${soles(envio.precio)}`
          : "gratis"
        : envio.tipo === "cargando"
          ? "…"
          : envio.tipo === "no-llega"
            ? "no llega"
            : envio.tipo === "sin-respuesta"
              ? "al pagar"
              : "elige";

  return (
    <div style={tarjeta(true)}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Punto on />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 16, fontWeight: 800 }}>
            {tienda?.nombre ?? cadena}
          </span>
          <span style={{ ...lapiz, display: "block" }}>
            {tienda ? `Tu tienda${actualizado ? ` · precios de hoy, ${actualizado}` : ""}` : "Precios referenciales"} ·{" "}
            <button onClick={onCambiarTienda} style={enlace}>
              {tienda ? "cambiar" : "elegir tienda"}
            </button>
          </span>
        </span>
      </div>

      <Fila
        izquierda={`${productos} ${productos === 1 ? "producto" : "productos"}`}
        derecha={monto > 0 ? soles(monto) : "S/ —"}
      />
      <Fila
        izquierda={
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Envío a
            <select
              value={distrito ?? ""}
              onChange={(e) => onDistrito(e.target.value)}
              aria-label="Distrito de entrega"
              style={{
                font: "inherit",
                fontSize: 14,
                fontWeight: 600,
                minHeight: 36,
                maxWidth: 150,
                padding: "4px 6px",
                borderRadius: 10,
                border: `1.5px solid ${distrito ? color.renglon : color.aji}`,
                background: distrito ? color.papel2 : "#FFF7D6",
                color: color.tinta,
              }}
            >
              <option value="" disabled>
                tu distrito
              </option>
              {distritos.map((d) => (
                <option key={d.nombre} value={d.nombre}>
                  {d.nombre}
                </option>
              ))}
              <option value={OTRO_DISTRITO}>{OTRO_DISTRITO}</option>
            </select>
          </label>
        }
        derecha={<span style={{ color: conEnvio ? color.tinta : color.lapiz }}>{textoEnvio}</span>}
      />
      {conEnvio && envio.tipo === "listo" && franja(envio.desde, envio.hasta) && (
        <p style={{ ...lapiz, margin: "0 0 2px" }}>
          Llega {franja(envio.desde, envio.hasta)} · tarifa de {cadena} para el distrito
        </p>
      )}
      {envio.tipo === "no-llega" && distrito !== OTRO_DISTRITO && (
        <p style={{ ...lapiz, margin: "0 0 2px" }}>{cadena} no despacha ahí: recoger en tienda es gratis.</p>
      )}

      <div style={{ borderTop: `1px dashed ${color.renglon}`, margin: "8px 0 2px" }} />
      <Fila
        fuerte
        izquierda="Total"
        derecha={
          <span key={monto} className="sc-monto" style={{ ...plata, fontSize: 22, letterSpacing: "-0.03em" }}>
            {monto > 0 ? soles(redondo(monto + (conEnvio && envio.tipo === "listo" ? envio.precio : 0))) : "S/ —"}
          </span>
        }
      />
      <p style={{ ...lapiz, margin: 0, textAlign: "right" }}>
        {conEnvio && envio.tipo === "listo" && envio.precio > 0
          ? `${soles(monto)} + ${soles(envio.precio)} de envío`
          : distrito && distrito !== OTRO_DISTRITO
            ? "Sin cargo de envío"
            : "Sin envío: elige tu distrito"}
        {!precioDeTienda && " · lo confirma la tienda"}
      </p>
      {conTarjeta && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 12,
            background: "#FFF7D6",
            border: `1.5px dashed ${color.aji}`,
          }}
        >
          <Fila
            izquierda={<span style={{ fontWeight: 700 }}>💳 Con tu {conTarjeta.tarjeta}</span>}
            derecha={<span style={{ ...plata, fontWeight: 800 }}>−{soles(conTarjeta.ahorro)}</span>}
          />
          <p style={{ ...lapiz, margin: 0 }}>
            En {conTarjeta.productos} {conTarjeta.productos === 1 ? "producto" : "productos"} con precio especial.{" "}
            {cadena} te lo descuenta al pagar con ella.
          </p>
        </div>
      )}
    </div>
  );
}

// --- La otra cadena: tocarla es pedir allá ------------------------------------

export function OtraTienda({
  estado,
  conDistrito,
  nombreCadena,
  onPedirAlla,
}: {
  estado: EstadoComparar;
  conDistrito: boolean;
  nombreCadena: (t: Tienda) => string;
  onPedirAlla: () => void;
}) {
  const [verFuera, setVerFuera] = useState(false);
  if (estado.tipo === "nada") return null;

  if (estado.tipo !== "listo")
    return (
      <div style={{ ...tarjeta(false), display: "flex", gap: 10, alignItems: "center" }}>
        <Punto on={false} />
        <span className={estado.tipo === "cargando" ? "sc-pulso" : undefined} style={lapiz}>
          {estado.tipo === "cargando"
            ? "Comparando con la otra cadena…"
            : "Ahora no pude comparar: una de las tiendas no contestó."}
        </span>
      </div>
    );

  const { origen, destino, comparados, fuera } = estado;
  const otra = nombreCadena(destino.tienda);
  if (comparados === 0 || origen.total == null || destino.total == null)
    return (
      <div style={{ ...tarjeta(false), display: "flex", gap: 10, alignItems: "center" }}>
        <Punto on={false} />
        <span style={lapiz}>Nada de tu lista está igual en {otra}: no hay qué comparar.</span>
      </div>
    );

  // El envío solo cuenta si se conoce en los DOS lados.
  const conEnvio =
    conDistrito && !!origen.envio?.hay && !!destino.envio?.hay &&
    origen.envio.precio != null && destino.envio.precio != null;
  const total = (l: Lado) => redondo((l.total ?? 0) + (conEnvio ? l.envio!.precio! : 0));
  const diferencia = redondo(total(origen) - total(destino));
  const masBarata = diferencia > 0;

  const contenido = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Punto on={false} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800 }}>{destino.tienda.nombre}</span>
        {masBarata ? (
          <Sello>Ahorras {soles(diferencia)}</Sello>
        ) : (
          <Sello tono="aji">{diferencia === 0 ? "Igual" : `${soles(-diferencia)} más`}</Sello>
        )}
      </div>

      {/* La cuenta, en dos columnas: los mismos productos en las dos. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          columnGap: 12,
          rowGap: 2,
          marginTop: 10,
          fontSize: 13,
          color: color.lapiz,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>{comparados} iguales</span>
        <span style={{ textAlign: "right" }}>{nombreCadena(origen.tienda)}</span>
        <span style={{ textAlign: "right" }}>{otra}</span>
        <span>Productos</span>
        <span style={{ textAlign: "right" }}>{soles(origen.total)}</span>
        <span style={{ textAlign: "right", color: color.tinta }}>{soles(destino.total)}</span>
        {conEnvio && (
          <>
            <span>Envío</span>
            <span style={{ textAlign: "right" }}>{soles(origen.envio!.precio!)}</span>
            <span style={{ textAlign: "right", color: color.tinta }}>
              {destino.envio!.precio! > 0 ? soles(destino.envio!.precio!) : "gratis"}
            </span>
          </>
        )}
        <span style={{ fontWeight: 700, color: color.tinta }}>Total</span>
        <span style={{ textAlign: "right", fontWeight: 700, color: color.tinta }}>{soles(total(origen))}</span>
        <span style={{ textAlign: "right", fontWeight: 700, color: color.tinta }}>{soles(total(destino))}</span>
      </div>

      {masBarata && (
        <span
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Pedir en {otra}
          <span aria-hidden>›</span>
        </span>
      )}
    </>
  );

  return (
    <>
      {masBarata ? (
        <button type="button" onClick={onPedirAlla} className="sc-boton" style={{ ...tarjeta(false), cursor: "pointer" }}>
          {contenido}
        </button>
      ) : (
        <div style={tarjeta(false)}>{contenido}</div>
      )}
      {fuera.length > 0 && (
        <div style={{ padding: "2px 4px 0" }}>
          <button onClick={() => setVerFuera((x) => !x)} aria-expanded={verFuera} style={{ ...enlace, ...lapiz, minHeight: 36 }}>
            {fuera.length === 1 ? "1 producto no está igual" : `${fuera.length} productos no están iguales`} en las dos{" "}
            {verFuera ? "▴" : "▾"}
          </button>
          {verFuera &&
            fuera.map((f) => (
              <p key={f.nombre} style={{ ...lapiz, margin: "2px 0" }}>
                {f.nombre} · {f.motivo}
              </p>
            ))}
          {masBarata && verFuera && (
            <p style={{ ...lapiz, margin: "4px 0 0" }}>Si pides en {otra}, esos los vuelvo a buscar allá.</p>
          )}
        </div>
      )}
    </>
  );
}

// --- Filas que se abren: lo que va y la tarjeta de pago -----------------------

export function Desplegable({
  titulo,
  resumen,
  children,
}: {
  titulo: string;
  resumen?: string;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div style={{ ...tarjeta(false), padding: 0 }}>
      <button
        onClick={() => setAbierto((x) => !x)}
        aria-expanded={abierto}
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          minHeight: 52,
          padding: "0 16px",
          background: "none",
          border: "none",
          font: "inherit",
          fontSize: 14.5,
          fontWeight: 700,
          color: color.tinta,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span>{titulo}</span>
        <span style={{ ...lapiz, fontWeight: 600, whiteSpace: "nowrap" }}>
          {resumen} {abierto ? "▴" : "▾"}
        </span>
      </button>
      {abierto && <div style={{ padding: "0 16px 14px" }}>{children}</div>}
    </div>
  );
}

const NINGUNA = "Ninguna";

// La fila de la tarjeta, y la hoja donde se responde. Se guarda en el perfil y
// NO toca ningún monto: el descuento lo aplica la tienda al pagar.
export function FilaPago({
  pago,
  onAbrir,
}: {
  pago?: { tarjetas: string[]; otra?: string };
  onAbrir: () => void;
}) {
  const dichas = [...(pago?.tarjetas ?? []).filter((t) => t !== NINGUNA), ...(pago?.otra ? [pago.otra] : [])];
  return (
    <button
      onClick={onAbrir}
      className="sc-boton"
      style={{
        ...tarjeta(false),
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        minHeight: 52,
        padding: "0 16px",
        cursor: "pointer",
        fontSize: 14.5,
        fontWeight: 700,
      }}
    >
      <span>{pago ? "Tu forma de pago" : "¿Tienes tarjeta con descuento?"}</span>
      <span style={{ ...lapiz, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {pago ? (dichas.length ? dichas.join(" · ") : "Ninguna") : ""} ›
      </span>
    </button>
  );
}

// La hoja donde se responde. Vive en la raíz de la página (como la de la
// tienda): dentro de una pantalla animada quedaría debajo del botón de pedir.
// La elección de tarjetas, compartida por la hoja de «Revisar y pedir» y por el
// paso «¿Pagas con alguna?» del inicio. Cada cadena ofrece las suyas
// (lib/cadenas.ts): Tarjeta Cencosud y Wong Prime en Wong, Tarjeta Sip en
// Plaza Vea. Lo marcado en otra cadena se conserva aunque aquí no se vea.
export function usarTarjetas(pago: { tarjetas: string[]; otra?: string } | undefined, cadena: string) {
  const [marcadas, setMarcadas] = useState<string[]>(pago?.tarjetas ?? []);
  const [otra, setOtra] = useState(pago?.otra ?? "");
  const [conOtra, setConOtra] = useState(!!pago?.otra);
  const listo = marcadas.length > 0 || (conOtra && otra.trim().length > 0);
  const propias = cadenasDisponibles().find((c) => c.nombre === cadena)?.tarjetas ?? CADENA_POR_DEFECTO.tarjetas;
  const opciones = [...propias, NINGUNA];

  const alternar = (t: string) => {
    if (t === NINGUNA) {
      setMarcadas([NINGUNA]);
      setConOtra(false);
      return;
    }
    setMarcadas((xs) => {
      const sin = xs.filter((x) => x !== NINGUNA);
      return sin.includes(t) ? sin.filter((x) => x !== t) : [...sin, t];
    });
  };

  const chips = (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {opciones.map((t) => (
          <Boton
            key={t}
            variante={marcadas.includes(t) ? "lleno" : "fantasma"}
            aria-pressed={marcadas.includes(t)}
            onClick={() => alternar(t)}
            style={{ minHeight: 44 }}
          >
            {marcadas.includes(t) ? "✓ " : ""}
            {t}
          </Boton>
        ))}
        <Boton
          variante={conOtra ? "lleno" : "fantasma"}
          aria-pressed={conOtra}
          onClick={() => {
            setConOtra((x) => !x);
            setMarcadas((xs) => xs.filter((x) => x !== NINGUNA));
          }}
          style={{ minHeight: 44 }}
        >
          {conOtra ? "✓ " : ""}Otra
        </Boton>
      </div>
      {conOtra && (
        <input
          value={otra}
          onChange={(e) => setOtra(e.target.value)}
          placeholder="¿Cuál? Ej. BBVA, Ripley"
          maxLength={40}
          aria-label="Otra tarjeta"
          autoFocus
          className="sc-campo"
          style={{
            font: "inherit",
            fontSize: 16,
            width: "100%",
            boxSizing: "border-box",
            marginTop: 12,
            padding: "12px 14px",
            borderRadius: 14,
            border: `1.5px solid ${color.renglon}`,
            background: color.papel,
            color: color.tinta,
          }}
        />
      )}
      {marcadas.includes("Wong Prime") && (
        <p style={{ ...lapiz, margin: "12px 0 0" }}>Si tu Prime cubre el envío, también lo descuenta Wong al pagar.</p>
      )}
    </>
  );

  return { chips, listo, guardar: () => [marcadas, conOtra ? otra : undefined] as const };
}

export function HojaPago({
  pago,
  cadena,
  onPago,
  onCerrar,
}: {
  pago?: { tarjetas: string[]; otra?: string };
  cadena: string;
  onPago: (tarjetas: string[], otra?: string) => void;
  onCerrar: () => void;
}) {
  const { chips, listo, guardar } = usarTarjetas(pago, cadena);
  return (
    <Hoja
      titulo="¿Pagas con alguna de estas?"
      sub={`${cadena} aplica tu descuento al pagar. Aquí no lo restamos todavía: solo lo anotamos.`}
      onCerrar={onCerrar}
      pie={
        <Boton
          variante="lleno"
          disabled={!listo}
          style={{ width: "100%" }}
          onClick={() => {
            onPago(...guardar());
            onCerrar();
          }}
        >
          {listo ? "Guardar" : "Elige al menos una"}
        </Boton>
      }
    >
      {chips}
    </Hoja>
  );
}

const enlace: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  font: "inherit",
  color: color.tinta,
  textDecoration: "underline",
  cursor: "pointer",
};

// --- Tottus: solo para comparar ---------------------------------------------
//
// Decisión de la PO (2026-11-27): Tottus no deja llenar su carrito desde fuera
// (lib/tottus.ts), así que se compara y no se pide. Si conviene, «paso a paso»:
// la lista con el enlace de cada producto, su cantidad y una casilla para
// marcar lo ya agregado, que se recuerda en este celular. Se avisa ANTES de que
// el carrito no se llena solo.

export type EstadoTottus =
  | { tipo: "nada" }
  | { tipo: "cargando" }
  | { tipo: "sin-respuesta" }
  | {
      tipo: "listo";
      comparados: number;
      origen: { tienda: Tienda; total?: number };
      total: number;
      totalCmr?: number;
      lineas: { sku: string; nombre: string; url: string; unidades: number; precio: number; cmr?: number }[];
      fuera: { nombre: string; motivo: string }[];
    };

export function TottusCard({
  estado,
  nombreOrigen,
  conCmr,
  onPasoAPaso,
}: {
  estado: EstadoTottus;
  nombreOrigen: string;
  conCmr: boolean; // la familia dijo tener CMR
  onPasoAPaso: () => void;
}) {
  const [verFuera, setVerFuera] = useState(false);
  if (estado.tipo === "nada") return null;
  if (estado.tipo !== "listo")
    return (
      <div style={{ ...tarjeta(false), display: "flex", gap: 10, alignItems: "center" }}>
        <Punto on={false} />
        <span className={estado.tipo === "cargando" ? "sc-pulso" : undefined} style={lapiz}>
          {estado.tipo === "cargando" ? "Comparando con Tottus…" : "Ahora no pude comparar con Tottus: no contestó."}
        </span>
      </div>
    );

  const { origen, comparados, total, totalCmr, fuera } = estado;
  if (comparados === 0 || origen.total == null)
    return (
      <div style={{ ...tarjeta(false), display: "flex", gap: 10, alignItems: "center" }}>
        <Punto on={false} />
        <span style={lapiz}>Nada de tu lista está igual en Tottus: no hay qué comparar.</span>
      </div>
    );

  const suyo = conCmr && totalCmr != null ? totalCmr : total;
  const diferencia = redondo(origen.total - suyo);

  return (
    <>
      <div style={tarjeta(false)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Punto on={false} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 16, fontWeight: 800 }}>Tottus</span>
            <span style={{ ...lapiz, display: "block" }}>Solo para comparar · precios online de Lima</span>
          </span>
          {/* Sin envío no hay «Ahorras»: el ahorro realista lo cuenta. */}
          <Sello tono={diferencia > 0 ? "pino" : "aji"}>
            {diferencia === 0 ? "Igual" : `${soles(Math.abs(diferencia))} ${diferencia > 0 ? "menos" : "más"}`}
          </Sello>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            columnGap: 12,
            rowGap: 2,
            marginTop: 10,
            fontSize: 13,
            color: color.lapiz,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>{comparados} iguales</span>
          <span style={{ textAlign: "right" }}>{nombreOrigen}</span>
          <span style={{ textAlign: "right" }}>Tottus</span>
          <span style={{ fontWeight: 700, color: color.tinta }}>Productos</span>
          <span style={{ textAlign: "right", fontWeight: 700, color: color.tinta }}>{soles(origen.total)}</span>
          <span style={{ textAlign: "right", fontWeight: 700, color: color.tinta }}>{soles(total)}</span>
          {totalCmr != null && totalCmr < total && (
            <>
              <span>💳 con CMR</span>
              <span />
              <span style={{ textAlign: "right", color: color.tinta }}>{soles(totalCmr)}</span>
            </>
          )}
        </div>
        <AvisoTottus />
        {conCmr && totalCmr != null && (
          <p style={{ ...lapiz, margin: "6px 0 0" }}>La diferencia ya cuenta tu CMR.</p>
        )}
        <button
          type="button"
          onClick={onPasoAPaso}
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
            minHeight: 40,
            padding: 0,
            background: "none",
            border: "none",
            font: "inherit",
            fontSize: 14,
            fontWeight: 700,
            color: color.tinta,
            cursor: "pointer",
          }}
        >
          Agregar en Tottus paso a paso
          <span aria-hidden>›</span>
        </button>
      </div>
      {fuera.length > 0 && (
        <div style={{ padding: "2px 4px 0" }}>
          <button onClick={() => setVerFuera((x) => !x)} aria-expanded={verFuera} style={{ ...enlace, ...lapiz, minHeight: 36 }}>
            {fuera.length === 1 ? "1 producto no está igual" : `${fuera.length} productos no están iguales`} en Tottus{" "}
            {verFuera ? "▴" : "▾"}
          </button>
          {verFuera &&
            fuera.map((f) => (
              <p key={f.nombre} style={{ ...lapiz, margin: "2px 0" }}>
                {f.nombre} · {f.motivo}
              </p>
            ))}
        </div>
      )}
    </>
  );
}

// El aviso de Tottus, igual en la tarjeta y en la hoja (pedido de la PO: que
// se vea claro, antes de que nadie lo descubra allá).
function AvisoTottus() {
  return (
    <div
      role="note"
      style={{
        marginTop: 10,
        padding: "10px 12px",
        borderRadius: 12,
        background: "#FFF7D6",
        border: `2px solid ${color.aji}`,
        color: color.tinta,
        fontSize: 13.5,
        lineHeight: 1.4,
      }}
    >
      <strong style={{ display: "block", fontSize: 14.5, marginBottom: 4 }}>⚠️ Ojo con Tottus</strong>
      <span style={{ display: "block" }}>
        <strong>Su carrito no se llena solo:</strong> agregas cada producto a mano en su web.
      </span>
      <span style={{ display: "block" }}>
        <strong>El envío no está incluido:</strong> Tottus no lo publica; lo ves al pagar allá.
      </span>
    </div>
  );
}

export function HojaTottus({
  lineas,
  marcados,
  onMarcar,
  onCerrar,
}: {
  lineas: { sku: string; nombre: string; url: string; unidades: number; precio: number; cmr?: number }[];
  marcados: string[];
  onMarcar: (sku: string) => void;
  onCerrar: () => void;
}) {
  const hechos = lineas.filter((l) => marcados.includes(l.sku)).length;
  return (
    <Hoja
      titulo="Agregar en Tottus, paso a paso"
      sub="Abre cada producto, agrégalo allá y márcalo aquí. Lo que marques se recuerda en este celular."
      onCerrar={onCerrar}
      pie={
        <Boton variante="lleno" style={{ width: "100%" }} onClick={onCerrar}>
          {hechos === lineas.length ? "Listo, ya está todo" : `Llevo ${hechos} de ${lineas.length}`}
        </Boton>
      }
    >
      <div style={{ marginTop: -10, marginBottom: 12 }}>
        <AvisoTottus />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {lineas.map((l) => {
          const hecho = marcados.includes(l.sku);
          return (
            <div
              key={l.sku}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: radio.fila,
                background: color.papel2,
                opacity: hecho ? 0.6 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={hecho}
                onChange={() => onMarcar(l.sku)}
                aria-label={`Ya agregué ${l.nombre}`}
                style={{ width: 22, height: 22, flex: "0 0 auto", accentColor: color.tinta }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 700, textDecoration: hecho ? "line-through" : "none" }}>
                  {l.nombre}
                </span>
                <span style={{ ...lapiz, display: "block", fontVariantNumeric: "tabular-nums" }}>
                  {l.unidades} × {soles(l.precio)}
                  {l.cmr ? ` · CMR ${soles(l.cmr)}` : ""}
                </span>
              </span>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...enlace, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", minHeight: 44, display: "inline-flex", alignItems: "center" }}
              >
                Abrir ›
              </a>
            </div>
          );
        })}
      </div>
    </Hoja>
  );
}
