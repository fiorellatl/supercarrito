"use client";

import { color, lapiz } from "@/app/ui/sistema";

// El armazón de cualquier lugar de la aplicación: cabecera, cuerpo que respira,
// y un pie que no se mueve.
//
// 🚫 SIN BARRA DE PESTAÑAS. Una barra inferior convierte una libreta en una app.
// Todo cuelga de la libreta —la compra hacia abajo, la casa detrás del
// monograma— y siempre se vuelve con LA MISMA FLECHA EN LA MISMA ESQUINA. Que
// el gesto de volver sea siempre el mismo es lo que permite explorar sin miedo.

export function Pantalla({
  titulo,
  onVolver,
  casa,
  cuerpo,
  pie,
}: {
  titulo: string;
  onVolver?: () => void;
  casa?: () => void; // el monograma: la única puerta a la casa
  cuerpo: React.ReactNode;
  pie?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "18px 0 10px",
          flex: "0 0 auto",
          position: "relative",
          zIndex: 2,
        }}
      >
        {onVolver && (
          <button
            onClick={onVolver}
            aria-label="Volver"
            className="sc-boton"
            style={{
              width: 34,
              height: 34,
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: 10,
              border: `1px solid ${color.renglon}`,
              background: color.blanco,
              color: color.lapiz,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        <h1
          style={{
            flex: 1,
            minWidth: 0,
            margin: 0,
            fontSize: 21,
            fontWeight: 600,
            color: color.tinta,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
          }}
        >
          {titulo}
        </h1>

        {casa && (
          <button
            onClick={casa}
            aria-label="La casa: lo que aprendí de ustedes"
            title="La casa"
            className="sc-boton"
            style={{
              width: 34,
              height: 34,
              flex: "0 0 auto",
              borderRadius: "50%",
              border: `1px solid ${color.renglon}`,
              background: color.blanco,
              color: color.lapiz,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              padding: 0,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 11l8-7 8 7M6 10v9h12v-9" />
            </svg>
          </button>
        )}
      </header>

      <div className="sc-scroll" style={{ flex: 1, minHeight: 0, position: "relative", zIndex: 1 }}>
        {cuerpo}
      </div>

      {pie && (
        <div
          style={{
            flex: "0 0 auto",
            position: "sticky",
            bottom: 0,
            paddingBottom: 20,
            paddingTop: 12,
            background: color.papel,
            zIndex: 2,
          }}
        >
          {pie}
        </div>
      )}
    </div>
  );
}

// El estado vacío de un lugar. Nunca dice "no hay nada" ni dibuja una
// ilustración: una ilustración de vacío convierte un descanso en un problema.
export function Vacio({ titulo, texto, accion }: { titulo: string; texto?: string; accion?: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 34, maxWidth: "27ch" }}>
      <div style={{ fontSize: 19, fontWeight: 600, color: color.tinta, letterSpacing: "-0.025em", lineHeight: 1.35 }}>
        {titulo}
      </div>
      {texto && <div style={{ ...lapiz, marginTop: 8 }}>{texto}</div>}
      {accion && <div style={{ marginTop: 16 }}>{accion}</div>}
    </div>
  );
}

// El rótulo de una sección dentro de la casa. Separa sin abrir una pantalla.
export function Seccion({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        letterSpacing: "0.13em",
        textTransform: "uppercase",
        color: color.lapiz2,
        padding: "18px 0 6px",
      }}
    >
      {children}
    </div>
  );
}
