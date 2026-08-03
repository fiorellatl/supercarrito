"use client";

// La navegación. Tres lugares, con nombre escrito debajo del icono.
//
// Decisión de la PO (2026-08-02), que revierte el "🚫 sin barra de pestañas" de
// `Pantalla.tsx`: una convención conocida vale más que una originalidad que hay
// que descubrir. Antes, "la compra" colgaba del pie de la libreta y "la casa"
// vivía detrás de un monograma en una esquina — dos capacidades que solo
// encontraba quien ya sabía que estaban.
//
// Reglas que se mantienen intactas:
//   · Ningún badge, ningún punto rojo, ninguna animación. Nada grita.
//   · El número bajo "Compra" es en lápiz y solo aparece si hay algo.
//   · Se abre siempre en Lista. Ninguna otra pestaña puede ser el arranque.

import { color, fuente } from "@/app/ui/sistema";

export type Lugar = "lista" | "compra" | "casa";

// El primer lugar es donde se PREPARA la compra; el segundo, la compra ya con
// precios. Ninguno se llama "libreta": la libreta es cómo lo tenemos hecho por
// dentro, no cómo lo vive una familia (decisión de la PO, 2026-08-02).
const LUGARES: { k: Lugar; nombre: string; d: string }[] = [
  { k: "lista", nombre: "Mi compra", d: "M4 4h13a3 3 0 013 3v13H7a3 3 0 01-3-3z M8 4v16" },
  { k: "compra", nombre: "Carrito", d: "M4 5h2l2.5 10h9L20 8H7 M9.5 19.5h.01 M16.5 19.5h.01" },
  { k: "casa", nombre: "Mi casa", d: "M4 11l8-7 8 7 M6 10v9h12v-9" },
];

export default function Navegacion({
  activo,
  cuantos,
  onIr,
}: {
  activo: Lugar;
  cuantos?: number; // productos en la compra en curso, si la hay
  onIr: (l: Lugar) => void;
}) {
  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        display: "flex",
        borderTop: `1px solid ${color.renglon}`,
        background: color.papel2,
        marginTop: 4,
        // La barra de gestos del teléfono vive justo debajo. Sin esto, "Mi casa"
        // quedaba pegado a ella y tocarlo cerraba la aplicación tan a menudo
        // como la abría.
        paddingBottom: "var(--abajo)",
      }}
    >
      {LUGARES.map((l) => {
        const on = activo === l.k;
        return (
          <button
            key={l.k}
            onClick={() => onIr(l.k)}
            aria-current={on ? "page" : undefined}
            className="sc-boton"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "9px 4px 12px",
              minHeight: 56,
              border: 0,
              background: "none",
              cursor: "pointer",
              fontFamily: fuente,
              color: on ? color.tinta : color.lapiz,
            }}
          >
            <svg
              width={21}
              height={21}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d={l.d} />
            </svg>
            <span style={{ fontSize: 11, fontWeight: on ? 600 : 400, letterSpacing: "-0.01em" }}>
              {l.nombre}
            </span>
            <span
              style={{
                fontSize: 10,
                height: 12,
                lineHeight: "12px",
                color: color.lapiz2,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {l.k === "compra" && cuantos ? cuantos : ""}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
