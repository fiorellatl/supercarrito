"use client";

import { color, fuente } from "@/app/ui/sistema";

// El sello dice CUÁNTO puede fiarse la familia de una línea. Nunca dice de
// dónde salió el dato: "Basado en tu compra anterior", no "del perfil".
//
// Cuatro tonos y ni uno más. Ladrillo aparece exactamente dos veces en toda la
// aplicación —agotado y error—; si empieza a aparecer en más sitios, algo se
// está convirtiendo en una alarma.

type Tono = "confirmado" | "sabido" | "pendiente" | "problema";

const tonos: Record<Tono, { fondo: string; texto: string }> = {
  confirmado: { fondo: "rgba(46,93,75,.10)", texto: color.pino },
  sabido: { fondo: "rgba(34,51,84,.07)", texto: color.tinta2 },
  pendiente: { fondo: "rgba(224,134,75,.12)", texto: "#8A5426" },
  problema: { fondo: "rgba(168,80,60,.10)", texto: color.ladrillo },
};

export default function Sello({ tono, children }: { tono: Tono; children: React.ReactNode }) {
  const t = tonos[tono];
  return (
    <span
      style={{
        fontFamily: fuente,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.01em",
        padding: "3px 9px",
        borderRadius: 999,
        background: t.fondo,
        color: t.texto,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
