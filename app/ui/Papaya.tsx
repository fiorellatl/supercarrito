"use client";

// «¿Qué tan papaya está tu compra?» (decisión de la PO, 2026-11-27). La Papaya
// es la suertuda del elenco: lentes subidos a la cabeza y un guiño cuando todo
// salió bien. Sus cuatro pepas están en la barriga y cada una es una condición
// que SÍ podemos comprobar. No es un puntaje ni un porcentaje, y no mide ahorro:
// con una sola tienda esa promesa no se puede verificar.
//
// Tocarla abre las cuatro condiciones. Lo que falta se nombra con el producto,
// para que la familia sepa qué hacer, no solo que algo anda mal.

import { useState } from "react";
import { color, fuenteMarca, lapiz } from "@/app/ui/sistema";

export type Pepa = { ok: boolean; texto: string; falta?: string };

const T = "#141414";
const C = "#FFF7F1";

function nivelDe(llenas: number, nadaSuma = false) {
  // Una compra en la que nada suma no está «casi papaya», aunque cumpla tres
  // condiciones: no se puede pedir nada. Las pepas siguen diciendo la verdad.
  if (nadaSuma) return { titulo: "Está yuca", cara: "preocupada" as const };
  if (llenas >= 4) return { titulo: "¡Papaya!", cara: "guino" as const };
  if (llenas >= 2) return { titulo: "Casi papaya", cara: "sonrie" as const };
  return { titulo: "Está yuca", cara: "preocupada" as const };
}

function Ojos({ dx = 1.4, dy = -0.6 }: { dx?: number; dy?: number }) {
  return (
    <>
      <circle cx="67" cy="40" r="4.8" fill={C} stroke={T} strokeWidth="1.8" />
      <circle cx={67 + dx * 0.7} cy={40 + dy} r="2.1" fill={T} />
      <circle cx="48" cy="42" r="6.4" fill={C} stroke={T} strokeWidth="2" />
      <circle cx={48 + dx} cy={42 + dy} r="2.7" fill={T} />
    </>
  );
}

export function DibujoPapaya({ pepas, px = 44, nadaSuma }: { pepas: number; px?: number; nadaSuma?: boolean }) {
  const { cara } = nivelDe(pepas, nadaSuma);
  const semillas: [number, number, number][] = [
    [52, 79, -18],
    [67, 77, 14],
    [54, 93, 10],
    [68, 91, -14],
  ];
  return (
    <span className="sc-papaya" style={{ display: "inline-block", width: px * 0.76, height: px, flex: "0 0 auto" }} aria-hidden>
      <svg width={px * 0.76} height={px} viewBox="14 -4 92 122" style={{ display: "block", overflow: "visible" }}>
        <path d="M60 8 C84 8 96 34 96 62 C96 92 80 114 60 114 C40 114 24 92 24 62 C24 34 36 8 60 8 Z" fill="#8DBF4A" stroke={T} strokeWidth="2.4" />
        <path d="M60 14 C80 14 90 36 90 62 C90 88 76 108 60 108 C44 108 30 88 30 62 C30 36 40 14 60 14 Z" fill="#F5934A" />
        <path d="M60 66 C72 66 78 74 78 85 C78 96 70 102 60 102 C50 102 42 96 42 85 C42 74 48 66 60 66 Z" fill="#E0662F" stroke={T} strokeWidth="1.6" />
        {semillas.map(([x, y, r], i) => (
          <ellipse
            key={i}
            className={i < pepas ? "sc-pepa" : undefined}
            cx={x}
            cy={y}
            rx="4.6"
            ry="6"
            transform={`rotate(${r} ${x} ${y})`}
            fill={i < pepas ? T : "#F7B77F"}
            stroke={T}
            strokeWidth="1.6"
            strokeDasharray={i < pepas ? undefined : "2.4 2.4"}
          />
        ))}
        {cara === "guino" && (
          <>
            <circle cx="48" cy="42" r="6.4" fill={C} stroke={T} strokeWidth="2" />
            <circle cx="49.6" cy="42.6" r="2.7" fill={T} />
            <path d="M62 42 q5 -5 10 0" stroke={T} strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M44 52 q16 14 32 0 z" fill={T} stroke={T} strokeWidth="2" strokeLinejoin="round" />
          </>
        )}
        {cara === "sonrie" && (
          <>
            <Ojos />
            <path d="M48 54 c5 5 14 5 19 0" stroke={T} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        )}
        {cara === "preocupada" && (
          <>
            <Ojos dx={-1} dy={1.6} />
            <path d="M41 33l12 3M63 34l10-3" stroke={T} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M50 57 q4 -4 8 0 t8 0" stroke={T} strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        )}
        <g transform="rotate(-10 60 20)">
          <rect x="38" y="12" width="18" height="10" rx="4" fill={T} />
          <rect x="62" y="12" width="18" height="10" rx="4" fill={T} />
          <path d="M56 16h6" stroke={T} strokeWidth="2.4" />
        </g>
        <path d="M60 8 c-1 -4 1 -7 4 -8" stroke="#5E3A22" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  );
}

export default function Papaya({ pepas, nadaSuma }: { pepas: Pepa[]; nadaSuma?: boolean }) {
  const [abierta, setAbierta] = useState(false);
  const llenas = pepas.filter((p) => p.ok).length;
  const { titulo } = nivelDe(llenas, nadaSuma);
  const primeraFalta = pepas.find((p) => !p.ok)?.falta;

  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={() => setAbierta((a) => !a)}
        aria-expanded={abierta}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <DibujoPapaya pepas={llenas} nadaSuma={nadaSuma} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: fuenteMarca, fontSize: 17, color: color.tinta, lineHeight: 1.15 }}>
            {titulo} <span style={{ ...lapiz, fontFamily: "inherit", fontSize: 12.5 }}>· {llenas} de 4</span>
          </span>
          <span style={{ ...lapiz, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {nadaSuma && !primeraFalta ? "Todavía nada suma al total." : primeraFalta ? `Falta: ${primeraFalta}` : "Todo listo para pedir."}
          </span>
        </span>
        <span aria-hidden style={{ ...lapiz, fontSize: 18, display: "inline-block", transform: abierta ? "rotate(90deg)" : undefined }}>›</span>
      </button>
      {abierta && (
        <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "grid", gap: 6 }}>
          {pepas.map((p) => (
            <li key={p.texto} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13.5, color: color.tinta }}>
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 13,
                  marginTop: 3,
                  borderRadius: "50%",
                  transform: "rotate(-18deg)",
                  flex: "0 0 auto",
                  background: p.ok ? T : "transparent",
                  border: `1.6px ${p.ok ? "solid" : "dashed"} ${T}`,
                  boxSizing: "border-box",
                }}
              />
              <span>
                <span style={{ fontWeight: 600 }}>{p.texto}</span>
                {!p.ok && p.falta && <span style={{ ...lapiz, display: "block" }}>{p.falta}</span>}
                <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                  {p.ok ? "cumplido" : "pendiente"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
