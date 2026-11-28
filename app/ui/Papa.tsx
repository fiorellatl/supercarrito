// La papa del carrito: el personaje de SuperCarrito (decisión de la PO,
// 2026-11-26). Reemplaza al cuy porque otro súper ya usa uno; la papa es la
// más peruana y reconocible. Lleva chullo y un brote que hace de oreja.
//
// Estilo pedido por la PO a partir de una referencia dibujada a mano: el
// borde «hierve» (tres versiones del mismo trazo que se alternan, ver los
// filtros `sc-trazo*` en layout.tsx), la cáscara tiene rayado de lápiz y todo
// se mueve a saltitos (`steps()`), nunca suave. Las animaciones viven en
// sistema.css bajo `.sc-papa`. Con `prefers-reduced-motion` se queda quieta.
//
// Momentos:
//   quieta  — respira y parpadea. La cabecera, donde la familia trabaja.
//   reposo  — además, el viento le vuela el chullo y abre los ojos de ardilla loca.
//   plaf    — cae del cielo y aplasta el carrito: salen las ruedas y ve estrellas.
//   cae     — le cae un tomate al lomo: se aplasta y salta. La lista creció.
//   suelta  — tropieza y se le cae el pan: «!». La lista se achicó.
//   busca   — saca la lupa, olfatea, revisa el piso y le sale un «?». Wong está contestando.
//   feliz   — salta de alegría con chispas.

export type MomentoPapa = "quieta" | "reposo" | "plaf" | "cae" | "suelta" | "busca" | "feliz";

const T = "#141414";
const CREMA = "#FFF7F1";

export default function Papa({ px = 48, momento = "quieta" }: { px?: number; momento?: MomentoPapa }) {
  return (
    <span className={`sc-papa sc-papa-${momento}`} style={{ display: "inline-block", width: px, height: px * 0.97, flex: "0 0 auto" }} aria-hidden>
      <svg width={px} height={px * 0.97} viewBox="-14 -40 138 134" style={{ display: "block", overflow: "visible" }}>
        <g className="p-item">
          <circle cx="54" cy="0" r="9" fill="#EB3B2F" stroke={T} strokeWidth="2.5" />
          <path d="M54 -9c-2-3-5-3-6-2m6 2c2-3 5-3 6-2" stroke="#2F9E44" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
        <g className="p-viento" stroke={T} strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path d="M98 -10h14" /><path d="M102 -2h10" /><path d="M94 -18h8" />
        </g>
        <path className="p-chispa" d="M14 0l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FFD23F" />
        <path className="p-chispa" d="M98 -22l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="#FFD23F" />
        <path className="p-chispa" d="M108 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FFD23F" />
        <g className="p-cuerpo">
          <path d="M12 62 C2 44 12 18 40 12 C62 6 92 10 98 32 C104 50 96 62 86 62 Z" fill="#D9A35B" stroke={T} strokeWidth="2.4" strokeLinejoin="round" />
          <g fill="#A8733A">
            <circle cx="28" cy="40" r="2.4" /><circle cx="50" cy="24" r="2" /><circle cx="40" cy="52" r="1.8" /><circle cx="62" cy="46" r="2.2" />
          </g>
          <g stroke="#F1C98A" strokeWidth="1.8" strokeLinecap="round" fill="none">
            <path d="M22 30l4-3" /><path d="M34 22l4-2" /><path d="M20 50l5-1" /><path d="M50 36l4-3" /><path d="M72 52l5-2" />
          </g>
          <path className="p-brote" d="M52 11c-2-7 2-12 7-10m-7 10c5-5 10-5 12-1" stroke="#2F9E44" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <g className="p-ojo">
            <circle cx="91" cy="22" r="4.8" fill={CREMA} stroke={T} strokeWidth="1.8" />
            <circle className="p-pupila p-pupila2" cx="92" cy="22.6" r="2.1" fill={T} />
          </g>
          <g className="p-ojo">
            <circle cx="80" cy="26" r="6.4" fill={CREMA} stroke={T} strokeWidth="2" />
            <circle className="p-pupila" cx="81.6" cy="26.6" r="2.7" fill={T} />
            <circle cx="82.6" cy="25.4" r=".9" fill={CREMA} />
          </g>
          <circle className="p-nariz" cx="97" cy="38" r="2.4" fill="#8a5a2b" />
          <path d="M84 44c3 4 8 4 11 0" stroke={T} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <g className="p-chullo">
            <path d="M70 12 C70 -4 92 -6 94 10 Z" fill="#FFD23F" stroke={T} strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M73 4l4 3 4-3 4 3 4-3 3 2" stroke={T} strokeWidth="2" strokeLinejoin="round" fill="none" />
            <path d="M71 11l-1 9M93 10l1 8" stroke={T} strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="81" cy="-6" r="4" fill={CREMA} stroke={T} strokeWidth="2.2" />
          </g>
          <path d="M12 58 L2 40" stroke={T} strokeWidth="6" strokeLinecap="round" />
          <rect x="8" y="62" width="82" height="7" rx="3.5" fill={T} />
        </g>
        <g className="p-pan">
          <path d="M38 12c0-8 22-8 22 0v4H38z" fill="#E0A458" stroke={T} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M44 8l2-3M50 7l2-3" stroke={T} strokeWidth="1.8" strokeLinecap="round" />
        </g>
        <g className="p-rueda p-r1"><circle cx="26" cy="81" r="8" fill={T} /><rect x="24.6" y="75" width="2.8" height="12" rx="1.4" fill={CREMA} /></g>
        <g className="p-rueda p-r2"><circle cx="74" cy="81" r="8" fill={T} /><rect x="72.6" y="75" width="2.8" height="12" rx="1.4" fill={CREMA} /></g>
        <g className="p-lupa">
          <path d="M110 33 L119 43" stroke={T} strokeWidth="4.4" strokeLinecap="round" />
          <circle cx="103" cy="26" r="10" fill={CREMA} fillOpacity=".35" stroke={T} strokeWidth="2.8" />
          <path d="M98 21a6 6 0 0 1 5-2" stroke={CREMA} strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
        <text className="p-signo p-duda" x="58" y="-16" fontFamily="Lilita One, sans-serif" fontSize="26" fill={T}>?</text>
        <text className="p-signo p-alerta" x="88" y="-14" fontFamily="Lilita One, sans-serif" fontSize="22" fill={T}>!</text>
        <g className="p-mareo" fill="#FFD23F" stroke={T} strokeWidth="1.4">
          <path d="M30 -14l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" />
          <path d="M80 -22l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" />
        </g>
      </svg>
    </span>
  );
}

// Los tres trazos que se alternan. Van una sola vez en la página (layout.tsx).
export function TrazosDePapa() {
  const trazo = (id: string, seed: number) => (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves={2} seed={seed} />
      <feDisplacementMap in="SourceGraphic" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      {trazo("sc-trazo1", 1)}
      {trazo("sc-trazo2", 7)}
      {trazo("sc-trazo3", 13)}
    </svg>
  );
}
