"use client";

// Envío y forma de pago en «Revisar y pedir» (decisión de la PO, 2026-11-27).
//
// Dos preguntas, y las dos con salida abierta:
//   · ¿A qué distrito? — con «Otro distrito». El precio es el que da la tienda
//     para ese distrito, nunca uno nuestro, y se dice que es para el distrito y
//     no para la puerta de su casa.
//   · ¿Con qué pagas? — con «Otra» (escrita) y «Ninguna». Se guarda y NO toca
//     ningún monto: el descuento con tarjeta lo aplica la tienda al pagar y no
//     lo podemos comprobar desde fuera. Restarlo sería inventarlo.

import { useState } from "react";
import Boton from "@/app/ui/Boton";
import { color, lapiz, soles } from "@/app/ui/sistema";
import distritos from "@/data/distritos.json";

export const OTRO_DISTRITO = "Otro distrito";

export type EstadoEnvio =
  | { tipo: "sin-distrito" }
  | { tipo: "cargando" }
  | { tipo: "sin-respuesta" }
  | { tipo: "no-llega" }
  | { tipo: "listo"; precio: number; precioMaximo?: number; desde?: string; hasta?: string };

const TARJETAS = ["Tarjeta Cencosud", "Interbank", "Wong Prime"];
const NINGUNA = "Ninguna";

// VTEX devuelve las franjas con «+00:00», pero son hora de Lima: medido el
// 2026-11-27 a las 3:20 pm, la primera franja de Miraflores era «16:00». Por
// eso se lee la hora tal cual viene escrita y no se convierte.
function franja(desde?: string, hasta?: string): string | null {
  if (!desde) return null;
  const dia = desde.slice(0, 10);
  const h = (iso: string) => {
    const n = Number(iso.slice(11, 13));
    const m = iso.slice(14, 16);
    const h12 = n % 12 === 0 ? 12 : n % 12;
    return `${h12}${m !== "00" ? `:${m}` : ""} ${n < 12 ? "am" : "pm"}`;
  };
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
  const manana = new Date(Date.now() + 864e5).toLocaleDateString("en-CA", {
    timeZone: "America/Lima",
  });
  const cuando =
    dia === hoy
      ? "hoy"
      : dia === manana
        ? "mañana"
        : `el ${new Date(`${dia}T12:00:00`).toLocaleDateString("es-PE", { weekday: "long", day: "numeric" })}`;
  // «17:00:59» es el final de la franja de las 4: se lee como «5 pm».
  const fin = hasta ? h(hasta) : null;
  return `${cuando} de ${h(desde)}${fin ? ` a ${fin}` : ""}`;
}

export default function EnvioYPago({
  cadena,
  distrito,
  onDistrito,
  envio,
  productos,
  pago,
  onPago,
}: {
  cadena: string; // "Wong"
  distrito?: string;
  onDistrito: (d: string) => void;
  envio: EstadoEnvio;
  productos: number; // soles, lo que ya se enseña arriba
  pago?: { tarjetas: string[]; otra?: string };
  onPago: (tarjetas: string[], otra?: string) => void;
}) {
  const [editandoPago, setEditandoPago] = useState(false);
  const [marcadas, setMarcadas] = useState<string[]>(pago?.tarjetas ?? []);
  const [otra, setOtra] = useState(pago?.otra ?? "");
  const [conOtra, setConOtra] = useState(!!pago?.otra);

  const precio =
    envio.tipo === "sin-distrito"
      ? "elige el distrito"
      : envio.tipo === "cargando"
        ? "preguntando…"
        : envio.tipo === "listo"
          ? envio.precioMaximo
            ? `desde ${soles(envio.precio)}`
            : soles(envio.precio)
          : envio.tipo === "no-llega"
            ? "no hay despacho"
            : `lo confirma ${cadena} al pagar`;

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

  const preguntarPago = !pago || editandoPago;
  const listoPago = marcadas.length > 0 || (conOtra && otra.trim().length > 0);
  const dichas = [...(pago?.tarjetas ?? []).filter((t) => t !== NINGUNA), ...(pago?.otra ? [pago.otra] : [])];
  const conPrime = pago?.tarjetas.includes("Wong Prime");

  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          padding: "6px 0",
          fontSize: 14,
          color: color.tinta,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span>Envío a</span>
          <select
            value={distrito ?? ""}
            onChange={(e) => onDistrito(e.target.value)}
            aria-label="Distrito de entrega"
            style={{
              font: "inherit",
              fontSize: 14,
              minHeight: 40,
              maxWidth: 170,
              padding: "6px 8px",
              borderRadius: 10,
              border: `1.5px solid ${color.renglon}`,
              background: color.papel,
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
        <span style={{ textAlign: "right", color: envio.tipo === "listo" ? color.tinta : color.lapiz }}>
          {distrito === OTRO_DISTRITO ? `lo confirma ${cadena} al pagar` : precio}
        </span>
      </div>

      <p style={{ ...lapiz, margin: "0 0 4px" }}>
        {distrito === OTRO_DISTRITO
          ? `${cadena} te dirá el envío cuando pongas tu dirección.`
          : envio.tipo === "listo"
            ? `Lo cobra ${cadena}${
                franja(envio.desde, envio.hasta) ? `. Primera entrega ${franja(envio.desde, envio.hasta)}` : ""
              }${envio.precioMaximo ? `; otras franjas hasta ${soles(envio.precioMaximo)}` : ""}. Calculado para el distrito: con tu dirección exacta puede cambiar. Recoger en tienda no cuesta.`
            : envio.tipo === "no-llega"
              ? `${cadena} no despacha a ese distrito. Puedes recoger en tienda sin costo.`
              : envio.tipo === "sin-respuesta"
                ? `${cadena} no contestó. El envío se ve al pagar.`
                : envio.tipo === "sin-distrito"
                  ? "Así te digo cuánto cobra por llevártelo."
                  : null}
      </p>

      {envio.tipo === "listo" && distrito !== OTRO_DISTRITO && productos > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "4px 0 8px",
            fontSize: 14,
            color: color.lapiz,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>
            Con envío ({soles(productos)} + {soles(envio.precio)})
          </span>
          <span>{soles(Math.round((productos + envio.precio) * 100) / 100)}</span>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${color.renglon}`, marginTop: 6, paddingTop: 10 }}>
        {preguntarPago ? (
          <>
            <p style={{ margin: "0 0 8px", fontSize: 14.5, fontWeight: 600, color: color.tinta }}>
              ¿Pagas con alguna tarjeta o tienes Prime?
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[...TARJETAS, NINGUNA].map((t) => (
                <Boton
                  key={t}
                  chico
                  variante={marcadas.includes(t) ? "lleno" : "fantasma"}
                  aria-pressed={marcadas.includes(t)}
                  onClick={() => alternar(t)}
                  style={{ minHeight: 40 }}
                >
                  {t}
                </Boton>
              ))}
              <Boton
                chico
                variante={conOtra ? "lleno" : "fantasma"}
                aria-pressed={conOtra}
                onClick={() => {
                  setConOtra((x) => !x);
                  setMarcadas((xs) => xs.filter((x) => x !== NINGUNA));
                }}
                style={{ minHeight: 40 }}
              >
                Otra…
              </Boton>
            </div>
            {conOtra && (
              <input
                value={otra}
                onChange={(e) => setOtra(e.target.value)}
                placeholder="¿Cuál? Ej. BBVA, Oh!"
                maxLength={40}
                aria-label="Otra tarjeta"
                style={{
                  font: "inherit",
                  fontSize: 16,
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: 8,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1.5px solid ${color.renglon}`,
                  background: color.papel,
                  color: color.tinta,
                }}
              />
            )}
            <div style={{ marginTop: 10 }}>
              <Boton
                chico
                variante="lleno"
                disabled={!listoPago}
                onClick={() => {
                  onPago(marcadas, conOtra ? otra : undefined);
                  setEditandoPago(false);
                }}
                style={{ minHeight: 40 }}
              >
                Listo
              </Boton>
            </div>
          </>
        ) : (
          <p style={{ ...lapiz, margin: 0 }}>
            {dichas.length > 0
              ? `Pagas con ${dichas.join(" · ")}. ${cadena} aplica tus descuentos al pagar; aquí todavía no los restamos.${
                  conPrime ? ` Si tu Prime cubre el envío, también lo descuenta ${cadena}.` : ""
                }`
              : "Sin tarjeta de descuento."}{" "}
            <button
              onClick={() => setEditandoPago(true)}
              style={{
                font: "inherit",
                color: color.tinta,
                background: "none",
                border: "none",
                padding: "8px 0",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Cambiar
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
