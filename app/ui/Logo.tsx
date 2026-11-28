"use client";

// La identidad del producto (decisión de la PO, 2026-11-28, opción «G» de la
// exploración de logos): el carrito de un solo trazo cuya canasta sonríe, con
// la papa —sin gorro— asomándose desde adentro, y «supercarrito» en minúsculas
// con la letra de la casa. Limpio a propósito: el logo vive en 24 px y en el
// ícono del teléfono. La papa dibujada a mano (Papa.tsx) sigue como personaje
// dentro de la app; aquí no.
//
// Se mueve poco y con intención:
//   · en la bienvenida (`animado`) el carrito entra rodando, la papa se asoma
//     y la canasta sonríe;
//   · con `cuenta`, cada vez que la lista crece la papa salta dentro del
//     carrito; si se achica, el carrito se sacude. El número va en un globito;
//   · si no, la papa parpadea de vez en cuando.
// Con `prefers-reduced-motion` no se mueve nada (ver sistema.css).

import { useEffect, useRef, useState } from "react";
import { color, fuente } from "@/app/ui/sistema";

type MomentoMarca = "quieta" | "entra" | "crece" | "achica";

// El dibujo, en su caja de 100×100. `claro` = trazo blanco sobre el rojo del
// toldo; si no, trazo tomate sobre papel. La papa se recorta bajo el borde de
// la canasta, así que la canasta no necesita relleno: sirve sobre cualquier fondo.
export function MarcaCarrito({
  px = 30,
  claro = false,
  momento = "quieta",
  id = "m",
}: {
  px?: number;
  claro?: boolean;
  momento?: MomentoMarca;
  id?: string;
}) {
  const trazo = claro ? "#FFFFFF" : color.papaya;
  return (
    <svg
      className={`sc-marca-carrito sc-mc-${momento}`}
      width={px}
      height={px}
      viewBox="0 0 100 100"
      aria-hidden
      style={{ display: "block", overflow: "visible", flex: "0 0 auto" }}
    >
      <defs>
        <clipPath id={`sc-mc-${id}`}>
          <rect x="-10" y="-30" width="120" height="68" />
        </clipPath>
      </defs>
      <g className="mc-carro">
        <g clipPath={`url(#sc-mc-${id})`}>
          <g className="mc-papa">
            <path d="M44 40 C41 26 49 13 62 12 C70 11 76 15 79 22 C82 29 82 35 80 40 Z" fill="#E3A857" />
            <circle cx="52" cy="21" r="1.4" fill="#C98B3C" />
            <circle cx="75" cy="23" r="1.3" fill="#C98B3C" />
            <g className="mc-ojos">
              <circle cx="57" cy="27" r="5" fill="#FFFFFF" />
              <circle cx="58.5" cy="28" r="2.5" fill="#141414" />
              <circle cx="71" cy="26" r="3.6" fill="#FFFFFF" />
              <circle cx="72" cy="27" r="1.8" fill="#141414" />
            </g>
          </g>
        </g>
        <g fill="none" stroke={trazo} strokeLinecap="round" strokeLinejoin="round" strokeWidth="8">
          <path d="M14 24 H26 L34 40" />
          <path d="M30 36 H86 C84 54 72 66 56 66 H48 C40 66 34 60 32 52 Z" />
          <path className="mc-sonrisa" d="M48 48 C54 54 64 54 70 48" strokeWidth="6" />
        </g>
        <circle className="mc-rueda" cx="46" cy="82" r="7" fill={trazo} />
        <circle className="mc-rueda" cx="72" cy="82" r="7" fill={trazo} />
      </g>
    </svg>
  );
}

export function Carrito({
  px = 30,
  claro = false,
  cuenta,
  animado = false,
}: {
  px?: number;
  claro?: boolean;
  cuenta?: number; // productos en la lista: se ve como un globito
  animado?: boolean; // entra rodando y la papa se asoma
}) {
  const [momento, setMomento] = useState<MomentoMarca>(animado ? "entra" : "quieta");
  const anterior = useRef(cuenta);
  const [id] = useState(() => Math.random().toString(36).slice(2, 8));

  useEffect(() => {
    if (!animado) return;
    const t = setTimeout(() => setMomento("quieta"), 2200);
    return () => clearTimeout(t);
  }, [animado]);

  useEffect(() => {
    const antes = anterior.current ?? 0;
    anterior.current = cuenta;
    if (animado || cuenta === undefined || (cuenta ?? 0) === antes) return;
    setMomento((cuenta ?? 0) > antes ? "crece" : "achica");
    const t = setTimeout(() => setMomento("quieta"), 900);
    return () => clearTimeout(t);
  }, [cuenta, animado]);

  const lado = px * 1.45;
  return (
    <span style={{ position: "relative", display: "inline-block", flex: "0 0 auto" }} aria-hidden>
      {/* Cambiar el momento remonta el dibujo: así la animación se repite cada vez. */}
      <MarcaCarrito key={`${momento}-${cuenta ?? "x"}`} px={lado} claro={claro} momento={momento} id={id} />
      {cuenta ? (
        <span
          style={{
            position: "absolute",
            right: -px * 0.25,
            top: -px * 0.15,
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: chico ? (cuenta ? 10 : 6) : 10 }}>
      <Carrito px={chico ? 22 : 40} claro={claro} cuenta={cuenta} animado={animado} />
      <span
        style={{
          fontFamily: fuente,
          fontSize: chico ? 20 : 36,
          fontWeight: 800,
          letterSpacing: "-0.045em",
          color: claro ? "#fff" : color.tinta,
          lineHeight: 1,
        }}
      >
        supercarrito
      </span>
    </span>
  );
}
