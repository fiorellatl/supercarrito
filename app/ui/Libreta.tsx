"use client";

import { forwardRef } from "react";
import { color, fuente, lapiz, RENGLON, tinta } from "@/app/ui/sistema";

// La libreta. Es el Home y es lo único que siempre tiene sentido al abrir.
//
// Todo lo que vive aquí cae en el renglón de 38 px: línea, aire, eco. Si algo no
// cabe en 38 px o un múltiplo, no pertenece a la libreta — pertenece a la hoja
// de la compra. Es la regla que impide que esto crezca hasta parecer un panel.
//
// 📸 Aquí NO hay fotos ni precios. Poner una miniatura junto a "leche" obliga a
// validar una elección que la familia todavía no ha tomado, y convierte anotar
// en comprar.

// --- Una línea escrita por la familia ---------------------------------------

export function LineaLibreta({
  texto,
  ts,
  pegada,
  quedo,
  onTocar,
}: {
  texto: string;
  ts: number;
  pegada?: boolean;
  quedo?: boolean;
  onTocar: () => void;
}) {
  // El tiempo se dice con LUZ, nunca con una fecha metida dentro de su texto:
  // 100 % lo de hoy · 62 % lo de esta semana · 40 % lo de más atrás.
  const dias = (Date.now() - ts) / 86_400_000;
  const opacidad = dias < 1 ? 1 : dias < 7 ? 0.62 : 0.4;

  return (
    <div className="sc-entra">
      <div
        onClick={onTocar}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onTocar()}
        style={{
          ...tinta,
          lineHeight: `${RENGLON}px`,
          minHeight: RENGLON,
          opacity: opacidad,
          cursor: "text",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          // Lo pegado entra LITERAL —faltas, emojis y todo— citado con una barra
          // de lápiz. La barra dice "esto lo pegaste tú", no "esto lo entendí yo".
          borderLeft: pegada ? `2px solid ${color.lapiz2}` : undefined,
          paddingLeft: pegada ? 12 : 0,
          marginLeft: pegada ? -14 : 0,
        }}
      >
        {texto}
      </div>
      {quedo && <Lapiz>quedó de la semana pasada</Lapiz>}
    </div>
  );
}

// Lo que dice SuperCarrito dentro de la libreta. Siempre debajo, siempre en
// lápiz, y nunca mueve un milímetro lo que ella escribió.
export function Lapiz({ children }: { children: React.ReactNode }) {
  return (
    <div className="sc-aparece" style={{ ...lapiz, lineHeight: `${RENGLON - 10}px` }}>
      {children}
    </div>
  );
}

// --- El compositor -----------------------------------------------------------
// Está SIEMPRE en el mismo sitio, siempre listo, y el cursor ya está puesto:
// abrir y escribir tienen que ser el mismo gesto. Es lo único que nunca cambia
// de lugar en toda la aplicación.
//
// No tiene botón de enviar: Enter cierra la línea y abre otra, como una libreta.
// Y acepta un pegado entero sin pedir permiso ni preguntar el formato.

export const Compositor = forwardRef<
  HTMLInputElement,
  {
    valor: string;
    marcador?: string;
    onEscribir: (v: string) => void;
    onEnter: () => void;
    onPegar: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    // Corrigiendo una línea: tocar fuera confirma, igual que soltar el lápiz.
    onSalir?: () => void;
  }
>(function Compositor({ valor, marcador, onEscribir, onEnter, onPegar, onSalir }, ref) {
  return (
    <input
      ref={ref}
      className="sc-campo"
      value={valor}
      onChange={(e) => onEscribir(e.target.value)}
      onPaste={onPegar}
      onBlur={onSalir}
      onKeyDown={(e) => {
        if (e.key === "Enter") onEnter();
        if (e.key === "Escape") onSalir?.();
      }}
      autoFocus={!!onSalir}
      placeholder={marcador}
      aria-label="Anota una línea"
      style={{
        ...tinta,
        width: "100%",
        border: 0,
        outline: "none",
        background: "transparent",
        fontFamily: fuente,
        fontSize: 17,
        lineHeight: `${RENGLON}px`,
        height: RENGLON,
        padding: 0,
        caretColor: color.papaya,
      }}
    />
  );
});

// --- Las cuatro puertas -------------------------------------------------------
// No navegan: dicen qué acepta este lienzo. Van en lápiz, en voz baja, y
// desaparecen de la vista en cuanto hay algo escrito — su trabajo era enseñar
// el gesto, no quedarse.

export function Puertas({ puertas }: { puertas: { texto: string; onClick: () => void }[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 10, flexWrap: "wrap" }}>
      {puertas.map((p, i) => (
        <span key={p.texto} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {i > 0 && <span style={{ ...lapiz, color: color.lapiz2 }}>·</span>}
          <button
            onClick={p.onClick}
            className="sc-boton"
            style={{
              ...lapiz,
              border: 0,
              background: "none",
              padding: "6px 0",
              minHeight: 32,
              cursor: "pointer",
              fontFamily: fuente,
              color: color.lapiz,
            }}
          >
            {p.texto}
          </button>
        </span>
      ))}
    </div>
  );
}
