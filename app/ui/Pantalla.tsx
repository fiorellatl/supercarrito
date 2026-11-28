"use client";

import { color, lapiz } from "@/app/ui/sistema";
import Papa from "@/app/ui/Papa";

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
  encabezado,
  navegacion,
  cuerpo,
  pie,
  sentido = "adelante",
}: {
  titulo?: string;
  onVolver?: () => void;
  casa?: () => void; // el monograma: la única puerta a la casa
  // El Home trae su propia cabecera (identidad + casa) y su propia navegación.
  // Los lugares de dentro siguen con título y la misma flecha en la misma
  // esquina: entrar es distinto en cada sitio, volver es siempre igual.
  encabezado?: React.ReactNode;
  navegacion?: React.ReactNode;
  cuerpo: React.ReactNode;
  pie?: React.ReactNode;
  // Hacia dónde va este cambio de pantalla. Entrar en un sitio y volver de él
  // no pueden sentirse igual: la dirección es lo que le dice a la familia si
  // está profundizando o deshaciendo, sin una sola palabra.
  sentido?: "adelante" | "atras";
}) {
  return (
    <div className="sc-pantalla" style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      {encabezado && <div className="sc-p-cabeza">{encabezado}</div>}
      {!encabezado && (
      <div className="sc-p-cabeza">
      {/* El toldo del puesto en TODA pantalla de adentro (auditoría de marca,
          2026-11-27): el kiosko vivía solo en la entrada y en Mi lista, y cada
          pantalla nueva nacía blanca. Vive aquí para que se herede sin
          acordarse. Misma estructura que la Cabecera (`data-letrero`), así el
          escritorio lo lleva de borde a borde con las mismas reglas. */}
      <header data-letrero style={{ margin: "0 -22px", flex: "0 0 auto", position: "relative", zIndex: 2 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: color.papaya,
          color: "#fff",
          padding: "calc(14px + env(safe-area-inset-top, 0px)) 22px 12px",
        }}
      >
        {onVolver && (
          // 44 px de zona tocable con 34 px de dibujo dentro.
          <button
            onClick={onVolver}
            aria-label="Volver"
            className="sc-boton"
            style={{
              width: 44,
              height: 44,
              margin: "0 -5px",
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              border: 0,
              background: "none",
              color: "#fff",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
                borderRadius: 10,
                background: "rgba(255,255,255,.18)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </span>
          </button>
        )}

        <h1
          style={{
            flex: 1,
            minWidth: 0,
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.04em",
            lineHeight: 1.15,
            textWrap: "balance",
          }}
        >
          {titulo}
        </h1>

        {casa ? (
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
              border: 0,
              background: "rgba(255,255,255,.18)",
              color: "#fff",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 11l8-7 8 7M6 10v9h12v-9" />
            </svg>
          </button>
        ) : (
          // La papa acompaña en chico: es la casera que te lleva de un lado a otro.
          <Papa px={36} />
        )}
      </div>
      <div className="sc-toldo" aria-hidden />
      </header>
      </div>
      )}

      <div
        className={`sc-scroll sc-p-cuerpo sc-${sentido}`}
        style={{ flex: 1, minHeight: 0, position: "relative", zIndex: 1 }}
      >
        {cuerpo}
      </div>

      {pie && (
        <div
          className="sc-p-pie"
          style={{
            flex: "0 0 auto",
            position: "sticky",
            bottom: 0,
            paddingTop: 12,
            // Cuando no hay barra de navegación debajo, el pie es lo último de
            // la pantalla y tiene que apartarse de la barra de gestos del
            // teléfono. Con barra, de eso se encarga ella.
            paddingBottom: navegacion ? 20 : "calc(20px + var(--abajo))",
            background: color.papel,
            zIndex: 2,
          }}
        >
          {pie}
        </div>
      )}

      {navegacion && <div className="sc-p-nav">{navegacion}</div>}
    </div>
  );
}

// El estado vacío de un lugar. Nunca dice "no hay nada" ni dibuja una
// ilustración: una ilustración de vacío convierte un descanso en un problema.
export function Vacio({ titulo, texto, accion }: { titulo: string; texto?: string; accion?: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 34, maxWidth: "27ch" }}>
      {/* Un vacío nunca es una pantalla muerta: la papa espera con su carrito. */}
      <div style={{ marginBottom: 12 }}>
        <Papa px={64} momento="reposo" />
      </div>
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
