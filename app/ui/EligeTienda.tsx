"use client";

// Elegir la tienda es lo PRIMERO (decisión de la PO, 2026-11-26): sin ella no
// hay ni stock ni precio de verdad, y el carrito de Wong cobra según la tienda.
// Por eso es una pantalla propia, entre la bienvenida y la lista, y no una hoja
// que se puede cerrar.
//
// 🚪 Salida abierta: si Wong no devuelve la lista de tiendas, no se bloquea a
// la familia. Puede reintentar o seguir con precios referenciales, dicho así.

import { useMemo, useState } from "react";
import Logo from "@/app/ui/Logo";
import { color, fuente, lapiz } from "@/app/ui/sistema";
import type { Tienda } from "@/lib/tienda";

import { CADENAS, type CadenaId } from "@/lib/cadenas";

const NOMBRE_CADENA: Record<string, string> = Object.fromEntries(
  Object.values(CADENAS).map((c) => [c.id, c.nombre] as [CadenaId, string])
);

export function ListaTiendas({
  tiendas,
  elegidaId,
  onElegir,
}: {
  tiendas: Tienda[];
  elegidaId?: string;
  onElegir: (t: Tienda) => void;
}) {
  const [filtro, setFiltro] = useState("");
  // Wong o Metro. Solo se pregunta si hay más de una cadena que atender.
  const cadenas = useMemo(
    () => [...new Set(tiendas.map((t) => t.cadena ?? "wong"))],
    [tiendas]
  );
  const [cadena, setCadena] = useState<string>(
    tiendas.find((t) => t.id === elegidaId)?.cadena ?? cadenas[0] ?? "wong"
  );
  const visibles = useMemo(() => {
    const f = filtro
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return tiendas
      .filter((t) => cadenas.length < 2 || (t.cadena ?? "wong") === cadena)
      .filter((t) => !f || norm(`${t.nombre} ${t.distrito ?? ""}`).includes(f));
  }, [tiendas, filtro, cadena, cadenas.length]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {cadenas.length > 1 && (
        <div
          role="radiogroup"
          aria-label="Supermercado"
          // Con cuatro cadenas no caben en una fila de celular: dos y dos.
          style={{ display: "grid", gridTemplateColumns: `repeat(${cadenas.length > 3 ? 2 : cadenas.length}, 1fr)`, gap: 8 }}
        >
          {cadenas.map((c) => {
            const on = c === cadena;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setCadena(c)}
                className="sc-boton"
                style={{
                  minHeight: 48,
                  padding: "0 12px",
                  whiteSpace: "nowrap",
                  borderRadius: 999,
                  border: `2px solid ${color.tinta}`,
                  background: on ? color.tinta : color.blanco,
                  color: on ? color.blanco : color.tinta,
                  fontFamily: fuente,
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {NOMBRE_CADENA[c] ?? c}
              </button>
            );
          })}
        </div>
      )}
      <input
        id="sc-filtro-tienda"
        className="sc-campo"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        placeholder={`Busca tu distrito o tu ${NOMBRE_CADENA[cadena] ?? "tienda"}…`}
        autoComplete="off"
        style={{
          width: "100%",
          boxSizing: "border-box",
          fontFamily: fuente,
          fontSize: 16,
          color: color.tinta,
          background: color.blanco,
          border: `2px solid ${color.tinta}`,
          borderRadius: 999,
          padding: "12px 18px",
          outline: "none",
        }}
      />
      <div style={{ display: "grid", gap: 8 }}>
        {visibles.map((t) => {
          const on = t.id === elegidaId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onElegir(t)}
              className="sc-boton"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                width: "100%",
                textAlign: "left",
                padding: "12px 16px",
                minHeight: 56,
                borderRadius: 16,
                border: on ? `2px solid ${color.pino}` : "2px solid transparent",
                background: color.papel2,
                cursor: "pointer",
                fontFamily: fuente,
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15.5, fontWeight: 700, color: color.tinta }}>{t.nombre}</span>
                {t.distrito && <span style={{ ...lapiz, display: "block", fontSize: 12.5 }}>{t.distrito}</span>}
              </span>
              <span aria-hidden style={{ fontWeight: 800, color: on ? color.pino : color.lapiz2 }}>
                {on ? "✓" : "›"}
              </span>
            </button>
          );
        })}
        {visibles.length === 0 && (
          <p style={{ ...lapiz, margin: "6px 0" }}>Ninguna tienda coincide con «{filtro}».</p>
        )}
      </div>
    </div>
  );
}

export default function EligeTienda({
  tiendas,
  onElegir,
  onReintentar,
  onSeguirSin,
}: {
  tiendas: Tienda[] | null;
  onElegir: (t: Tienda) => void;
  onReintentar: () => void;
  onSeguirSin: () => void;
}) {
  return (
    <div className="sc-bienvenida" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div className="sc-bv-letrero" style={{ margin: "0 -22px" }}>
        <div style={{ background: color.papaya, color: "#fff", padding: "calc(22px + env(safe-area-inset-top, 0px)) 22px 20px" }}>
          <Logo tamano="chico" claro />
          <div style={{ marginTop: 18, fontSize: 13, fontWeight: 800, opacity: 0.9 }}>2 de 4</div>
          <h1
            style={{
              fontFamily: fuente,
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1,
              margin: "4px 0 10px",
            }}
          >
            ¿Dónde compras?
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.45, margin: 0, maxWidth: "36ch", opacity: 0.95 }}>
            Cada tienda tiene su stock y sus precios. Con la tuya, lo que veas es lo que pagas.
          </p>
        </div>
        <div className="sc-toldo" aria-hidden />
      </div>

      <div style={{ padding: "20px 0 calc(28px + var(--abajo))", maxWidth: 560, width: "100%", margin: "0 auto" }}>
        {tiendas === null ? (
          <p className="sc-pulso" style={{ ...lapiz, fontSize: 15 }}>
            Buscando las tiendas…
          </p>
        ) : tiendas.length === 0 ? (
          <div style={{ display: "grid", gap: 12 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: color.tinta, margin: 0 }}>
              No me llegó la lista de tiendas.
            </p>
            <button
              type="button"
              onClick={onReintentar}
              className="sc-boton"
              style={{
                border: 0,
                borderRadius: 999,
                background: color.pino,
                color: "#fff",
                fontFamily: fuente,
                fontWeight: 800,
                fontSize: 15.5,
                padding: "14px 22px",
                cursor: "pointer",
              }}
            >
              Intentar de nuevo
            </button>
            <button
              type="button"
              onClick={onSeguirSin}
              className="sc-boton"
              style={{ border: 0, background: "none", color: color.tinta, fontFamily: fuente, fontSize: 14, textDecoration: "underline", cursor: "pointer", minHeight: 40 }}
            >
              Seguir sin tienda (precios referenciales)
            </button>
          </div>
        ) : (
          <>
            <ListaTiendas tiendas={tiendas} onElegir={onElegir} />
            <p style={{ ...lapiz, marginTop: 14 }}>
              No me conecto a tu cuenta ni veo tus datos. Es solo saber dónde compras. La puedes cambiar cuando quieras.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
