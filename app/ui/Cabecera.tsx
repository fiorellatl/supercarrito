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
  onMarchaBlanca,
}: {
  monograma: string;
  nombre: string;
  onCasa: () => void;
  onMarchaBlanca?: () => void;
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
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Logo tamano="chico" />
        {/* Marcha blanca (2026-11-26): el producto sale a la calle sabiendo que
            recién empieza, y prefiere que la familia lo sepa desde el primer
            día. En lápiz, sin color: es honestidad, no una alarma. */}
        {onMarchaBlanca && (
          <button
            onClick={onMarchaBlanca}
            className="sc-boton"
            style={{
              border: `1px solid ${color.renglon}`,
              background: "none",
              borderRadius: 999,
              padding: "3px 9px",
              minHeight: 28,
              color: color.lapiz,
              fontFamily: fuente,
              fontSize: 11.5,
              fontWeight: 500,
              letterSpacing: "0.01em",
              cursor: "pointer",
            }}
          >
            marcha blanca
          </button>
        )}
      </span>
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
