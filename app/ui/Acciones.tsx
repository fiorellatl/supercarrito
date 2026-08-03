"use client";

// Las cuatro capacidades, dichas en voz alta.
//
// Antes eran cuatro palabras en lápiz —"escribe · pega · foto · menú"— que se
// leían como una nota al pie y no como algo que se pudiera tocar. Y dos de
// ellas, `foto` y `menú`, eran la única forma de llegar a capacidades que la
// aplicación tiene de verdad.
//
// Decisión de la PO (2026-08-02): **no esconder las capacidades; invitar a
// usarlas.** Ahora son botones con borde, icono y nombre: si algo se puede
// tocar, se ve tocable.
//
// Siguen sin ser pestañas y siguen sin clasificar la evidencia: los cuatro
// desembocan en la misma lista. Cambia el gesto, no la tarea.

import { color, fuente, lapiz } from "@/app/ui/sistema";

export type Accion = { clave: string; icono: string; nombre: string; onClick: () => void };

export default function Acciones({ acciones, titulo }: { acciones: Accion[]; titulo?: string }) {
  return (
    <div style={{ padding: "6px 0 2px" }}>
      {titulo && <p style={{ ...lapiz, margin: "0 0 8px" }}>{titulo}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {acciones.map((a) => (
          <button
            key={a.clave}
            onClick={a.onClick}
            aria-label={a.nombre}
            className="sc-boton"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              minHeight: 46,
              padding: "10px 12px",
              borderRadius: 13,
              border: `1px solid ${color.renglon}`,
              background: color.blanco,
              cursor: "pointer",
              fontFamily: fuente,
              textAlign: "left",
              boxShadow: "0 1px 2px rgba(34,51,84,.06)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 24,
                height: 24,
                flex: "0 0 auto",
                display: "grid",
                placeItems: "center",
                borderRadius: 7,
                background: color.papel2,
                color: color.lapiz,
                fontSize: 12,
              }}
            >
              {a.icono}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: color.tinta, lineHeight: 1.25 }}>
              {a.nombre}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
