"use client";

// La cabecera del Home: el letrero del puesto. Una franja rojo tomate con la
// identidad, el título grande y la tienda de la que salen los precios, y debajo
// el toldo a rayas (estilo «puesto de mercado», decisión de la PO 2026-11-26).
//
// La tienda vive aquí y no en una caja aparte: es un dato de la familia, no un
// paso del flujo, y así la lista empieza un renglón más arriba.

import Logo from "@/app/ui/Logo";
import { color, fuente } from "@/app/ui/sistema";

export default function Cabecera({
  monograma,
  nombre,
  titulo,
  tienda,
  tarjeta,
  cadena = "Wong",
  onTienda,
  onCasa,
  onMarchaBlanca,
  cuenta,
}: {
  cuenta?: number; // productos en la lista: el carrito del logo los cuenta
  monograma: string;
  nombre: string;
  titulo: string;
  tienda?: string;
  // «Tarjeta Cencosud»: lo que la familia dijo que usa para pagar. Solo se
  // nombra; el descuento lo aplica la tienda al pagar (no se puede comprobar).
  tarjeta?: string;
  cadena?: string;
  onTienda: () => void;
  onCasa: () => void;
  onMarchaBlanca?: () => void;
}) {
  return (
    <header data-letrero style={{ margin: "0 -22px", flex: "0 0 auto" }}>
      <div style={{ background: color.papaya, color: "#fff", padding: "calc(12px + env(safe-area-inset-top, 0px)) 22px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Logo tamano="chico" claro cuenta={cuenta} />
            {/* Marcha blanca (2026-11-26): el producto sale a la calle sabiendo
                que recién empieza, y prefiere que la familia lo sepa. */}
            {onMarchaBlanca && (
              <button
                onClick={onMarchaBlanca}
                className="sc-boton"
                style={{
                  border: "1px solid rgba(255,255,255,.55)",
                  background: "none",
                  borderRadius: 999,
                  padding: "3px 9px",
                  minHeight: 28,
                  color: "#fff",
                  fontFamily: fuente,
                  fontSize: 11.5,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                marcha blanca
              </button>
            )}
          </span>
          <button
            onClick={onCasa}
            aria-label={`Mis compras: ${nombre}`}
            className="sc-boton"
            style={{
              width: 44,
              height: 44,
              margin: "0 -4px",
              display: "grid",
              placeItems: "center",
              border: 0,
              background: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                display: "grid",
                placeItems: "center",
                borderRadius: 999,
                background: "#fff",
                color: color.papaya,
                fontFamily: fuente,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {monograma}
            </span>
          </button>
        </div>

        <h1
          style={{
            margin: "10px 0 0",
            fontFamily: fuente,
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.02,
            textWrap: "balance",
          }}
        >
          {titulo}
        </h1>

        <button
          onClick={onTienda}
          className="sc-boton"
          style={{
            marginTop: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: 0,
            background: "rgba(255,255,255,.18)",
            color: "#fff",
            borderRadius: 999,
            padding: "6px 12px",
            minHeight: 34,
            fontFamily: fuente,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            maxWidth: "100%",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tienda ? `Precios de ${tienda}` : "Elige tu tienda para ver tus precios"}
          </span>
          <span aria-hidden>▾</span>
        </button>
        {tarjeta && (
          <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 600, opacity: 0.95 }}>
            💳 {tarjeta === "Wong Prime" ? "Wong Prime: envío gratis desde S/ 79.90" : `${tarjeta}: ${cadena} te lo descuenta al pagar`}
          </div>
        )}
      </div>
      <div className="sc-toldo" aria-hidden />
    </header>
  );
}
