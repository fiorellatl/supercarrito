"use client";

// La identidad del producto: la papa del carrito (ver Papa.tsx) y «SUPER /
// CARRITO» apilado en letra de cartel. Pedido de la PO (2026-11-26): el carrito
// de trazo fino «estaba un poco aburrido» y el primer cuy ya lo usaba otro súper.
//
// La papa está viva:
//   · en la bienvenida (`animado`) cae del cielo, ¡plaf!, y luego se queda en
//     reposo, con el viento volándole el chullo;
//   · con `cuenta`, cada vez que la lista crece le cae un tomate al lomo, y
//     cuando se achica se le cae el pan. El número va en un globito;
//   · si no, respira y parpadea: la cabecera es donde la familia trabaja.
// Con `prefers-reduced-motion` no se mueve nada (ver sistema.css).

import { useEffect, useRef, useState } from "react";
import Papa, { type MomentoPapa } from "@/app/ui/Papa";
import { color, fuente, fuenteMarca } from "@/app/ui/sistema";

export function Carrito({
  px = 30,
  cuenta,
  animado = false,
}: {
  px?: number;
  claro?: boolean; // ya no cambia nada: la papa se lee igual sobre rojo y sobre papel
  cuenta?: number; // productos en la lista: se ve como un globito
  animado?: boolean; // entra con ¡plaf! y queda en reposo
}) {
  const [momento, setMomento] = useState<MomentoPapa>(animado ? "plaf" : "quieta");
  const anterior = useRef(cuenta);

  useEffect(() => {
    if (!animado) return;
    const t = setTimeout(() => setMomento("reposo"), 2100);
    return () => clearTimeout(t);
  }, [animado]);

  useEffect(() => {
    const antes = anterior.current ?? 0;
    anterior.current = cuenta;
    if (animado || cuenta === undefined || (cuenta ?? 0) === antes) return;
    setMomento((cuenta ?? 0) > antes ? "cae" : "suelta");
    const t = setTimeout(() => setMomento("quieta"), 1900);
    return () => clearTimeout(t);
  }, [cuenta, animado]);

  const ancho = px * 1.6;
  return (
    <span style={{ position: "relative", display: "inline-block", flex: "0 0 auto" }} aria-hidden>
      {/* Cambiar la cuenta remonta la papa: así la animación se repite cada vez. */}
      <Papa key={`${momento}-${cuenta ?? "x"}`} px={ancho} momento={momento} />
      {cuenta ? (
        <span
          style={{
            position: "absolute",
            right: -px * 0.2,
            top: -px * 0.05,
            minWidth: px * 0.62,
            height: px * 0.62,
            padding: "0 3px",
            borderRadius: 999,
            background: color.aji,
            color: color.tinta,
            border: `1.5px solid ${color.tinta}`,
            fontFamily: fuente,
            fontSize: Math.max(10, px * 0.38),
            fontWeight: 800,
            lineHeight: `${px * 0.62 - 3}px`,
            textAlign: "center",
            boxSizing: "border-box",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {cuenta}
        </span>
      ) : null}
    </span>
  );
}

export default function Logo({
  tamano = "grande",
  claro = false,
  cuenta,
  animado = false,
}: {
  tamano?: "grande" | "chico";
  claro?: boolean;
  cuenta?: number;
  animado?: boolean;
}) {
  const chico = tamano === "chico";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: chico ? (cuenta ? 12 : 8) : 12 }}>
      <Carrito px={chico ? 30 : 56} cuenta={cuenta} animado={animado} />
      <span
        className="sc-marca"
        style={{
          fontFamily: fuenteMarca,
          fontSize: chico ? 17 : 32,
          textTransform: "uppercase",
          color: claro ? "#fff" : color.tinta,
          lineHeight: 0.92,
          letterSpacing: "0.01em",
        }}
      >
        Super
        <br />
        Carrito
      </span>
    </span>
  );
}
