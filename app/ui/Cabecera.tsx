"use client";

// La cabecera del Home. Identidad a la izquierda, la casa a la derecha.
//
// Sustituye al título "Casa", que era el nombre de una pantalla y no el de un
// producto: alguien que abría por primera vez no tenía forma de saber dónde
// estaba (decisión de la PO, 2026-08-02).

import Logo from "@/app/ui/Logo";
import { color, fuente } from "@/app/ui/sistema";

export default function Cabecera({
  monograma,
  nombre,
  onCasa,
}: {
  monograma: string;
  nombre: string;
  onCasa: () => void;
}) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px 0 10px",
      }}
    >
      <Logo tamano="chico" />
      {/* 44 px tocables, 36 dibujados. El monograma estaba en 36 y es la única
          puerta a la casa: fallar el toque es acabar en otro sitio. */}
      <button
        onClick={onCasa}
        aria-label={`Mi casa: ${nombre}`}
        className="sc-boton"
        style={{
          width: 44,
          height: 44,
          margin: "0 -4px",
          flex: "0 0 auto",
          display: "grid",
          placeItems: "center",
          border: 0,
          background: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: 36,
            height: 36,
            display: "grid",
            placeItems: "center",
            borderRadius: 999,
            border: `1px solid ${color.renglon}`,
            background: color.blanco,
            color: color.lapiz,
            fontFamily: fuente,
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          {monograma}
        </span>
      </button>
    </header>
  );
}
