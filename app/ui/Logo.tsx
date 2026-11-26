"use client";

// La identidad del producto: un carrito lleno, con la compra asomando —una
// botella, un tomate, un pan—, y el nombre al lado. Pedido de la PO
// (2026-11-26): el carrito de trazo fino «estaba un poco aburrido».
//
// El carrito está vivo: al aparecer, las cosas caen dentro una por una; y
// cuando la familia agrega algo a su lista, da un saltito y su número sube.
// Con `prefers-reduced-motion` no se mueve nada (ver sistema.css).

import { color, fuente } from "@/app/ui/sistema";

export function Carrito({
  px = 30,
  claro = false,
  cuenta,
  animado = false,
}: {
  px?: number;
  claro?: boolean; // sobre el rojo del letrero
  cuenta?: number; // productos en la lista: se ve como un globito
  animado?: boolean; // las cosas caen dentro al aparecer
}) {
  const trazo = claro ? "#fff" : color.tinta;
  const botella = claro ? "#9BE7AE" : color.pino;
  const tomate = claro ? "#FFD9D2" : color.papaya;
  const pan = color.aji;
  const cae = (i: number) =>
    animado ? { className: "sc-item-cae", style: { animationDelay: `${150 + i * 170}ms` } } : {};

  return (
    <span
      // Cambiar la cuenta remonta el span: así el salto se repite cada vez.
      key={cuenta ?? "x"}
      className={cuenta ? "sc-carrito-salta" : undefined}
      style={{ position: "relative", display: "inline-block", width: px * 1.15, height: px, flex: "0 0 auto" }}
      aria-hidden
    >
      <svg width={px * 1.15} height={px} viewBox="0 0 46 40" fill="none" style={{ overflow: "visible" }}>
        {/* La compra, detrás del borde del carrito */}
        <g {...cae(0)}>
          <rect x="14" y="5" width="7" height="14" rx="2" fill={botella} />
          <rect x="15.8" y="1.5" width="3.4" height="5" rx="1" fill={botella} />
        </g>
        <g {...cae(1)}>
          <circle cx="27" cy="12.5" r="6" fill={tomate} />
          <path d="M27 6.5c-1.6-1.6-3.6-1.4-4.5-.6M27 6.5c1.2-1.8 3.2-2 4.4-1.2" stroke={botella} strokeWidth="1.8" strokeLinecap="round" />
        </g>
        <g {...cae(2)}>
          <rect x="31" y="8" width="11" height="8" rx="4" fill={pan} transform="rotate(-18 36.5 12)" />
        </g>
        {/* El carrito: canasta llena, asa y ruedas */}
        <path d="M2 4h5.5l2.6 11" stroke={trazo} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.5 15h33l-3.6 14.5a2.5 2.5 0 0 1-2.4 1.9H15.6a2.5 2.5 0 0 1-2.4-1.9L9.5 15Z" fill={trazo} />
        <circle cx="17" cy="36" r="3" fill={trazo} />
        <circle cx="34" cy="36" r="3" fill={trazo} />
      </svg>
      {cuenta ? (
        <span
          style={{
            position: "absolute",
            right: -px * 0.22,
            top: -px * 0.22,
            minWidth: px * 0.62,
            height: px * 0.62,
            padding: "0 3px",
            borderRadius: 999,
            background: color.aji,
            color: color.tinta,
            fontFamily: fuente,
            fontSize: Math.max(10, px * 0.38),
            fontWeight: 800,
            lineHeight: `${px * 0.62}px`,
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: chico ? (cuenta ? 15 : 9) : 12 }}>
      <Carrito px={chico ? 24 : 36} claro={claro} cuenta={cuenta} animado={animado} />
      <span
        style={{
          fontFamily: fuente,
          fontSize: chico ? 18 : 25,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: claro ? "#fff" : color.tinta,
          lineHeight: 1,
        }}
      >
        Super<span style={{ fontStyle: "italic", letterSpacing: "-0.05em" }}>Carrito</span>
      </span>
    </span>
  );
}
