"use client";

// Una fila de lista. Existía escrita tres veces —en revisión, en las compras de
// la casa y en la boleta— con tres juegos de estilos casi iguales y ligeramente
// distintos entre sí. Es la misma cosa: **algo escrito en tinta, algo dicho en
// lápiz debajo, y algo a la derecha**.
//
// Unificarla no es cosmética: mientras estuvo triplicada, cada pantalla se
// desviaba un poco del sistema y el producto se sentía como piezas sueltas.
//
// Lo que NO hace, a propósito: fotos (eso es `LineaCarrito`, donde elegir sí es
// visual) y estados de producto. Aquí solo se lee.

import type { CSSProperties, ReactNode } from "react";
import { color, lapiz } from "@/app/ui/sistema";

export default function Fila({
  titulo,
  nota,
  derecha,
  onTocar,
  style,
}: {
  titulo: ReactNode;
  nota?: ReactNode; // en lápiz: de dónde vino, cuántas cosas, la cuenta…
  derecha?: ReactNode; // un monto, un botón, nada
  onTocar?: () => void; // si se toca, es un botón de verdad (44 px, foco visible)
  style?: CSSProperties;
}) {
  const cuerpo = (
    <>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 15,
            fontWeight: 500,
            color: color.tinta,
            lineHeight: 1.3,
          }}
        >
          {titulo}
        </span>
        {nota != null && (
          <span style={{ ...lapiz, display: "block", fontSize: 11.5, marginTop: 2 }}>{nota}</span>
        )}
      </span>
      {derecha}
    </>
  );

  const base: CSSProperties = {
    display: "flex",
    alignItems: onTocar ? "baseline" : "center",
    gap: 10,
    width: "100%",
    padding: "10px 0",
    borderBottom: `1px solid ${color.renglon}`,
    ...style,
  };

  if (!onTocar) return <div style={base}>{cuerpo}</div>;

  return (
    <button
      onClick={onTocar}
      className="sc-boton"
      style={{
        ...base,
        minHeight: 44,
        border: 0,
        borderBottom: `1px solid ${color.renglon}`,
        background: "none",
        cursor: "pointer",
        font: "inherit",
        textAlign: "left",
      }}
    >
      {cuerpo}
    </button>
  );
}
