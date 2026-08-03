"use client";

import { color, lapiz } from "@/app/ui/sistema";
import Boton from "@/app/ui/Boton";

// Las tres pantallas donde el producto le pide tiempo a la familia, o le cuenta
// algo que salió mal. Comparten forma a propósito: nada de aquí es una alarma.
//
//  · esperando — un círculo que respira cada 2,6 s. Sin barra, sin porcentaje,
//    sin "analizando con IA". Una barra de progreso promete un tiempo que no
//    controlamos; una respiración solo promete que seguimos aquí.
//  · listo — un trazo que se dibuja en medio segundo. Sin confeti y sin
//    exclamaciones: celebrar una compra del súper es celebrar el trabajo de otro.
//  · problema — el producto asume la falla en primera persona. Nunca culpa a la
//    familia, y nada de lo que ella escribió desaparece por un fallo nuestro.

type Estado = "esperando" | "listo" | "problema";

export default function PantallaCalma({
  estado,
  titulo,
  texto,
  accion,
}: {
  estado: Estado;
  titulo: string;
  texto?: string;
  accion?: { texto: string; onClick: () => void };
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 14,
        padding: "56px 24px",
        minHeight: 260,
      }}
    >
      {estado === "esperando" && (
        <div
          className="sc-respira"
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: `1.5px solid ${color.lapiz2}`,
          }}
        />
      )}

      {estado === "listo" && (
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
          <circle cx="22" cy="22" r="21" stroke={color.pino} strokeWidth="1.5" opacity=".28" />
          <path
            d="M13 22.5 19.5 29 31 16"
            stroke={color.pino}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="34"
            strokeDashoffset="34"
            style={{ animation: "sc-trazo 520ms cubic-bezier(.22,.61,.36,1) 120ms forwards" }}
          />
        </svg>
      )}

      {estado === "problema" && (
        <span
          aria-hidden
          style={{ width: 26, height: 1.5, background: color.ladrillo, opacity: 0.5 }}
        />
      )}

      <div
        style={{
          fontSize: 21,
          fontWeight: 600,
          color: color.tinta,
          letterSpacing: "-0.025em",
          lineHeight: 1.3,
          maxWidth: "22ch",
        }}
      >
        {titulo}
      </div>

      {texto && <div style={{ ...lapiz, fontSize: 13, maxWidth: "30ch" }}>{texto}</div>}

      {accion && (
        <Boton variante="fantasma" chico onClick={accion.onClick}>
          {accion.texto}
        </Boton>
      )}
    </div>
  );
}
