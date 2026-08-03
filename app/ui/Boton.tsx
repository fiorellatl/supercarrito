"use client";

import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { color, fuente, radio } from "@/app/ui/sistema";

// El único botón de la aplicación. Existe una vez y tiene dos formas.
//
//  · lleno    — pino. La acción principal de la pantalla. NUNCA hay dos.
//  · fantasma — blanco con borde. La alternativa, y todo lo que vive en la
//               libreta. Aquí es donde vive "hacer la compra": tocable sin
//               gritar, jamás verde. Comprar no es un CTA.
//  · suave    — sin borde, para lo que no debe pesar (deshacer, volver).
//
// Alto mínimo 44 px y radio 13 px en los tres. Si algo se puede tocar, se ve
// tocable: se acabaron los textos subrayados como acción.

type Variante = "lleno" | "fantasma" | "suave";

const base: CSSProperties = {
  fontFamily: fuente,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  borderRadius: radio.boton,
  padding: "12px 18px",
  minHeight: 44,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const formas: Record<Variante, CSSProperties> = {
  lleno: {
    border: 0,
    background: color.pino,
    color: "#fff",
    boxShadow:
      "0 1px 0 rgba(255,255,255,.18) inset, 0 2px 5px rgba(34,51,84,.18), 0 1px 1px rgba(34,51,84,.12)",
  },
  fantasma: {
    border: `1px solid ${color.renglon}`,
    background: color.blanco,
    color: color.tinta,
    boxShadow: "0 1px 2px rgba(34,51,84,.07)",
  },
  suave: {
    border: 0,
    background: "transparent",
    color: color.lapiz,
    fontWeight: 500,
    boxShadow: "none",
  },
};

export default function Boton({
  variante = "fantasma",
  chico = false,
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; chico?: boolean }) {
  return (
    <button
      {...props}
      className={`sc-boton ${props.className ?? ""}`}
      style={{
        ...base,
        ...formas[variante],
        ...(chico ? { fontSize: 12.5, padding: "10px 14px", borderRadius: 11 } : null),
        ...(props.disabled ? { opacity: 0.45 } : null),
        ...style,
      }}
    />
  );
}
