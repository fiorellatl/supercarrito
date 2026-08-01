"use client";

import { useState } from "react";
import type { LineaExtraida } from "@/lib/evidencia";

// Pantalla de revisión: el usuario ve QUÉ leímos antes de que se convierta en
// una compra. Cumple tres funciones a la vez:
//   1. Confianza — nadie compra a ciegas lo que leyó una máquina.
//   2. Seguridad — convierte el peor fallo posible (un producto inventado que
//      nadie nota) en un error visible y corregible.
//   3. Señal — lo que el usuario quita o corrige aquí nos dice dónde fallamos,
//      sin tener que preguntárselo.

type Fila = LineaExtraida & { incluida: boolean; editado: string; editando: boolean };

export default function RevisionCaptura({
  lineas,
  onConfirmar,
  onCancelar,
}: {
  lineas: LineaExtraida[];
  onConfirmar: (elegidas: LineaExtraida[], edicionesUsadas: number) => void;
  onCancelar: () => void;
}) {
  const [filas, setFilas] = useState<Fila[]>(() =>
    lineas.map((l) => ({ ...l, incluida: true, editado: l.producto, editando: false }))
  );

  const cambiar = (i: number, cambio: Partial<Fila>) =>
    setFilas((fs) => fs.map((f, j) => (i === j ? { ...f, ...cambio } : f)));

  const elegidas = filas.filter((f) => f.incluida && f.editado.trim().length > 0);
  const truncadas = filas.filter((f) => f.incluida && f.truncado).length;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 16 }}>
        Leí {lineas.length} producto{lineas.length === 1 ? "" : "s"} de tu captura
      </div>
      <div style={{ fontSize: 13, color: "#71717a", marginTop: 2, marginBottom: 12 }}>
        Revisa antes de armar el carrito. Quita lo que no quieras y corrige lo que
        haya quedado a medias.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filas.map((f, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              border: "1px solid #e4e4e7",
              borderRadius: 12,
              padding: "10px 12px",
              background: f.incluida ? "#fff" : "#fafafa",
              opacity: f.incluida ? 1 : 0.55,
            }}
          >
            <input
              type="checkbox"
              checked={f.incluida}
              onChange={(e) => cambiar(i, { incluida: e.target.checked })}
              aria-label={`Incluir ${f.producto || "producto sin nombre"}`}
              style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* El nombre es TEXTO, no un campo. Wong resuelve bien la mayoría
                  de los nombres cortados (6 de 6 en la primera prueba), así que
                  obligar a editar sería pedir trabajo que casi nunca hace falta.
                  La edición existe, pero escondida — y contamos cuánto se usa. */}
              {f.editando ? (
                <input
                  autoFocus
                  value={f.editado}
                  onChange={(e) => cambiar(i, { editado: e.target.value })}
                  onBlur={() => cambiar(i, { editando: false })}
                  onKeyDown={(e) => e.key === "Enter" && cambiar(i, { editando: false })}
                  aria-label="Nombre del producto"
                  style={{
                    width: "100%",
                    border: "1px solid #d4d4d8",
                    borderRadius: 8,
                    padding: "4px 8px",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                />
              ) : (
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                  {f.editado || <span style={{ color: "#a1a1aa" }}>sin nombre</span>}
                </div>
              )}
              <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 3 }}>
                {f.cantidad != null && f.unidad
                  ? `${f.cantidad} ${f.unidad}`
                  : "cantidad no visible"}
                {!f.editando && f.incluida && (
                  <>
                    {" · "}
                    <button
                      onClick={() => cambiar(i, { editando: true })}
                      style={{
                        border: "none",
                        background: "none",
                        padding: 0,
                        fontSize: 12,
                        color: "#4338ca",
                        cursor: "pointer",
                      }}
                    >
                      corregir
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {truncadas > 0 && (
        <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 10, lineHeight: 1.5 }}>
          {truncadas} nombre{truncadas === 1 ? "" : "s"} venía
          {truncadas === 1 ? "" : "n"} cortado{truncadas === 1 ? "" : "s"} en la
          captura. Suelo encontrarlos igual; si alguno sale mal, puedes corregirlo.
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          onClick={() =>
            onConfirmar(
              elegidas.map((f) => ({
                textoOriginal: f.textoOriginal,
                producto: f.editado.trim(),
                cantidad: f.cantidad,
                unidad: f.unidad,
                truncado: f.truncado,
              })),
              // Cuántos nombres tocó de verdad: el dato que decide si esta UI
              // de edición merece existir.
              filas.filter((f) => f.editado.trim() !== f.producto).length
            )
          }
          disabled={elegidas.length === 0}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
            background: elegidas.length === 0 ? "#d4d4d8" : "#111",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: elegidas.length === 0 ? "default" : "pointer",
          }}
        >
          Armar mi carrito ({elegidas.length})
        </button>
        <button
          onClick={onCancelar}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #e4e4e7",
            background: "#fff",
            fontSize: 15,
            color: "#71717a",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
