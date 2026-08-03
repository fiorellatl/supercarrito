"use client";

import { useEffect, useRef } from "react";
import { color, fuente, lapiz, radio, sombraHoja } from "@/app/ui/sistema";

// La hoja que sube desde abajo. Es la ÚNICA superficie elevada del producto y
// la única sombra con peso: todo lo demás está apoyado en el papel.
//
// Sube en 320 ms —salida rápida, llegada lenta— y deja la libreta asomando
// arriba, para que volver nunca dé miedo. Se cierra por el tirador, por el
// fondo y con Escape: una hoja de la que no se sabe salir es una trampa.

export default function Hoja({
  titulo,
  sub,
  onCerrar,
  children,
  pie,
}: {
  titulo: string;
  sub?: string;
  onCerrar: () => void;
  children: React.ReactNode;
  pie?: React.ReactNode;
}) {
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", alTeclear);
    caja.current?.focus();
    return () => document.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  return (
    <div
      onClick={onCerrar}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(34,51,84,.18)",
      }}
    >
      <div
        ref={caja}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="sc-sube"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "86vh",
          display: "flex",
          flexDirection: "column",
          background: color.papel2,
          borderTopLeftRadius: radio.hoja,
          borderTopRightRadius: radio.hoja,
          borderTop: `1px solid ${color.renglon}`,
          boxShadow: sombraHoja,
          // La hoja llega hasta el borde de abajo del teléfono: es la última
          // superficie, así que la zona segura la respeta ella.
          padding: "14px 22px var(--abajo)",
          outline: "none",
          fontFamily: fuente,
        }}
      >
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          style={{
            width: 34,
            height: 4,
            padding: 0,
            border: 0,
            borderRadius: 2,
            background: color.renglon,
            margin: "0 auto 14px",
            cursor: "pointer",
            flex: "0 0 auto",
          }}
        />

        <h2
          style={{
            margin: 0,
            fontSize: 19,
            fontWeight: 600,
            color: color.tinta,
            letterSpacing: "-0.025em",
            lineHeight: 1.25,
          }}
        >
          {titulo}
        </h2>
        {sub && <p style={{ ...lapiz, margin: "4px 0 14px" }}>{sub}</p>}

        <div className="sc-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {children}
        </div>

        {pie && <div style={{ padding: "14px 0 20px", flex: "0 0 auto" }}>{pie}</div>}
      </div>
    </div>
  );
}
