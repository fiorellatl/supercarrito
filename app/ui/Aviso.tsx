"use client";

import { color, fuente } from "@/app/ui/sistema";

// Lo que el producto dice de pasada. Nunca pide una decisión, nunca se acumula
// como una bandeja de notificaciones y siempre caduca solo.
//
// Cuando trae "Deshacer" es porque acabamos de meter varias líneas de golpe: el
// deshacer dura lo que dura la duda y desaparece con el aviso.

export default function Aviso({
  texto,
  onDeshacer,
}: {
  texto: string;
  onDeshacer?: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="sc-aparece"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        // Por encima de la barra de navegación, y de la del teléfono debajo.
        bottom: "calc(96px + var(--abajo))",
        maxWidth: 488,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "11px 12px 11px 15px",
        borderRadius: 15,
        background: color.tinta,
        color: color.papel,
        fontFamily: fuente,
        fontSize: 12.5,
        lineHeight: 1.4,
        boxShadow: "0 14px 30px -14px rgba(0,0,0,.5)",
        zIndex: 30,
      }}
    >
      <span>{texto}</span>
      {onDeshacer && (
        <button
          onClick={onDeshacer}
          className="sc-boton"
          style={{
            flex: "0 0 auto",
            border: 0,
            borderRadius: 9,
            padding: "8px 12px",
            minHeight: 36,
            background: "rgba(255,255,255,.14)",
            color: "inherit",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Deshacer
        </button>
      )}
    </div>
  );
}
