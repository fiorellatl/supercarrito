"use client";

// Los secundarios del elenco (decisión de la PO, 2026-11-27: se lanza con
// Papa, Papaya, Piña y Yuca). Cada uno existe porque un momento del producto
// le pertenece; si no hay momento, no aparece.
//
//   · Piña — lo que se sale de nuestras manos: agotado, Wong que no contesta.
//   · Yuca — lo difícil: no lo encontramos tal cual. Siempre llega con salida.
//
// Mismas reglas que la Papa: tinta #141414, trazo 2.4, ojos de dos tamaños,
// un solo accesorio, borde que hierve (filtros `sc-trazo*` del layout).

const T = "#141414";
const C = "#FFF7F1";

function Ojos({ x1, y1, x2, y2, dx = 1.6, dy = 0.6 }: { x1: number; y1: number; x2: number; y2: number; dx?: number; dy?: number }) {
  return (
    <>
      <circle cx={x2} cy={y2} r="4.8" fill={C} stroke={T} strokeWidth="1.8" />
      <circle cx={x2 + dx * 0.7} cy={y2 + dy} r="2.1" fill={T} />
      <circle cx={x1} cy={y1} r="6.4" fill={C} stroke={T} strokeWidth="2" />
      <circle cx={x1 + dx} cy={y1 + dy} r="2.7" fill={T} />
    </>
  );
}

function Marco({ px, vb, ratio, children }: { px: number; vb: string; ratio: number; children: React.ReactNode }) {
  return (
    <span className="sc-elenco" style={{ display: "inline-grid", placeItems: "center", width: px, height: px, flex: "0 0 auto" }} aria-hidden>
      <svg width={ratio >= 1 ? px : px * ratio} height={ratio >= 1 ? px / ratio : px} viewBox={vb} style={{ display: "block", overflow: "visible" }}>
        {children}
      </svg>
    </span>
  );
}

export function Pina({ px = 46 }: { px?: number }) {
  return (
    <Marco px={px} vb="24 2 72 112" ratio={72 / 112}>
      <g transform="rotate(-12 60 40)">
        <path d="M42 46 L36 20 L50 34 L54 6 L62 32 L72 10 L71 36 L86 22 L78 48 Z" fill="#2F9E44" stroke={T} strokeWidth="2.4" strokeLinejoin="round" />
      </g>
      <ellipse cx="60" cy="78" rx="28" ry="33" fill="#F4B63A" stroke={T} strokeWidth="2.4" />
      <g stroke="#B9791A" strokeWidth="1.8" strokeLinecap="round">
        <path d="M38 64l22 36" /><path d="M48 50l30 48" /><path d="M66 48l16 26" />
        <path d="M82 64l-22 36" /><path d="M72 50l-30 48" /><path d="M54 48l-16 26" />
      </g>
      <ellipse cx="56" cy="66" rx="18" ry="11" fill="#F4B63A" />
      <Ojos x1={52} y1={68} x2={66} y2={66} />
      <path d="M45 64.5h14M61 63h10" stroke={T} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M50 84q4-3 8 0t8 0" stroke={T} strokeWidth="1.9" strokeLinecap="round" fill="none" />
      <g transform="rotate(-24 74 54)">
        <rect x="64" y="50" width="20" height="8" rx="4" fill="#FFF4DC" stroke={T} strokeWidth="1.8" />
        <path d="M72 52v4M76 52v4" stroke={T} strokeWidth="1.2" />
      </g>
    </Marco>
  );
}

export function Yuca({ px = 46 }: { px?: number }) {
  return (
    <Marco px={px} vb="2 20 120 76" ratio={120 / 76}>
      <path d="M86 41 L120 26 L120 60 Z" fill="#FFD23F" opacity=".38" />
      <path d="M14 72 C12 58 30 50 50 52 C70 54 86 46 100 52 C112 57 112 70 104 75 C90 84 70 78 50 82 C30 86 16 84 14 72 Z" fill="#8A5A3B" stroke={T} strokeWidth="2.4" strokeLinejoin="round" />
      <g stroke="#5E3A22" strokeWidth="2" strokeLinecap="round">
        <path d="M36 58l6 4" /><path d="M60 60l-3 6" /><path d="M42 76l6-2" /><path d="M66 74l5 2" />
      </g>
      <ellipse cx="17" cy="70" rx="7" ry="12" fill="#FFF4DC" stroke={T} strokeWidth="2.2" />
      <path d="M64 53 C68 44 86 42 92 50" stroke={T} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="80" cy="44" r="5.5" fill="#FFD23F" stroke={T} strokeWidth="2.2" />
      <Ojos x1={80} y1={63} x2={92} y2={61} />
      <path d="M74 54l9-3" stroke={T} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M82 73c3 1.5 7 .5 9-3" stroke={T} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </Marco>
  );
}

// Un personaje que dice una sola frase y se va. La frase la escribe quien lo
// usa: aquí no hay copy, solo la forma.
export function Dice({ quien, children }: { quien: "pina" | "yuca"; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 12px" }}>
      {quien === "pina" ? <Pina px={48} /> : <Yuca px={52} />}
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: "#15301F" }}>{children}</p>
    </div>
  );
}
