"use client";

// La identidad del producto. No existía: la aplicación empezaba diciendo "Casa",
// que es el nombre de una pantalla, no el de un producto.
//
// Un carrito dibujado con el mismo trazo que el resto de la iconografía —1,5 px,
// puntas redondeadas— y el nombre al lado. En pino, que es el color del dinero y
// de lo confirmado: es el único sitio donde el pino puede ser identidad y no
// acción, porque aquí no hay nada que tocar.

import { color, fuente } from "@/app/ui/sistema";

export default function Logo({ tamano = "grande" }: { tamano?: "grande" | "chico" }) {
  const chico = tamano === "chico";
  const px = chico ? 20 : 30;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: chico ? 8 : 11 }}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color.pino}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 4h2.2l2.6 10.4h9.4L20 7.2H6.4" />
        <circle cx="9.5" cy="19" r="1.3" />
        <circle cx="16.5" cy="19" r="1.3" />
      </svg>
      <span
        style={{
          fontFamily: fuente,
          fontSize: chico ? 16 : 22,
          fontWeight: 600,
          letterSpacing: "-0.035em",
          color: color.tinta,
        }}
      >
        SuperCarrito
      </span>
    </span>
  );
}
