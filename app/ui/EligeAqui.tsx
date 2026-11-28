"use client";

// «¿Cuál pan de molde?», en la lista misma (pedido de la PO, 2026-11-28: «yo
// debo ver varios productos»). Cuando algo se escribe sin marca y no sabemos
// cuál compra la familia, la línea no trae un producto puesto ni esconde la
// elección detrás de un botón: muestra las opciones, con foto y precio, y se
// toca una. Hasta entonces no suma al total.
//
// ⚠️ El ORDEN es el que trae el catálogo, igual que en HojaOpciones: reordenar
// aquí sería un motor de ranking, congelado hasta las entrevistas.
//
// 🚪 La salida abierta: «Ninguno de estos» devuelve la palabra a la caja para
// que la familia escriba la marca. Nunca se la obliga a elegir una mentira.

import { color, lapiz, plata, soles } from "@/app/ui/sistema";
import type { ProductoWong } from "@/lib/catalog";
import Foto from "@/app/ui/Foto";
import Sello from "@/app/ui/Sello";

export default function EligeAqui({
  ingrediente,
  opciones,
  orden,
  onElegir,
  onNinguno,
  onQuitar,
}: {
  ingrediente: string;
  opciones: ProductoWong[];
  orden?: number;
  onElegir: (p: ProductoWong) => void;
  onNinguno: () => void;
  onQuitar?: () => void;
}) {
  const retraso = Math.min(orden ?? 0, 7) * 26;
  return (
    <div
      className="sc-entra"
      style={{
        padding: "12px 0 10px",
        marginBottom: 8,
        borderRadius: 16,
        background: "#FFF4D6",
        animationDelay: `${retraso}ms`,
      }}
    >
      <div style={{ padding: "0 12px" }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, color: color.tinta, lineHeight: 1.25 }}>
          ¿Cuál “{ingrediente}”?
        </div>
        <div style={{ ...lapiz, fontSize: 12.5, marginTop: 2 }}>
          Eliges tú esta vez; la próxima me acuerdo.
        </div>
      </div>

      <div role="list" style={{ display: "grid", gap: 7, padding: "10px 12px 2px" }}>
        {opciones.map((o) => {
          const agotado = o.disponible === false;
          return (
            <button
              key={o.sku ?? o.nombre}
              role="listitem"
              type="button"
              onClick={() => onElegir(o)}
              className="sc-boton"
              aria-label={`${o.nombre ?? o.marca ?? ingrediente}${o.precio != null ? `, ${soles(o.precio)}` : ""}${agotado ? ", hoy no hay" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                width: "100%",
                padding: "8px 12px 8px 8px",
                borderRadius: 14,
                background: color.blanco,
                border: `1px solid ${color.renglon}`,
                cursor: "pointer",
                font: "inherit",
                textAlign: "left",
                minHeight: 44,
                opacity: agotado ? 0.6 : 1,
              }}
            >
              <Foto src={o.imagen} alt={o.nombre ?? ingrediente} apagada={agotado} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: color.tinta, lineHeight: 1.28 }}>
                  {o.nombre ?? o.marca}
                </span>
                {agotado && (
                  <span style={{ display: "inline-block", marginTop: 4 }}>
                    <Sello tono="problema">hoy no hay</Sello>
                  </span>
                )}
              </span>
              <span style={{ textAlign: "right", flex: "0 0 auto" }}>
                <span style={{ ...plata, display: "block", fontSize: 14 }}>{o.precio != null ? soles(o.precio) : "—"}</span>
                {o.unidadVenta === "kg" && <span style={{ ...lapiz, fontSize: 11 }}>el kg</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 16, padding: "6px 12px 0", fontSize: 13 }}>
        <button type="button" onClick={onNinguno} style={enlace}>
          Ninguno de estos
        </button>
        {onQuitar && (
          <button type="button" onClick={onQuitar} style={enlace}>
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}

const enlace: React.CSSProperties = {
  background: "none",
  border: 0,
  padding: "6px 0",
  font: "inherit",
  color: color.tinta,
  textDecoration: "underline",
  textUnderlineOffset: 3,
  cursor: "pointer",
};
