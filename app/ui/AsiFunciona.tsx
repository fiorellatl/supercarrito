"use client";

// «Así funciona» (pedido de la PO, 2026-11-27). Revierte la regla de agosto
// «sin tour» con una sola pantalla, la última de la entrada, para contar lo que
// la familia va a encontrar al empezar: que la primera vez elige sus marcas y
// que después nos acordamos. Sin esto, la primera pregunta «¿Cuál pan?» se lee
// como un fallo en vez de como el producto aprendiendo.
//
// Una pantalla, tres pasos, un botón. Nada que rellenar.

import Logo from "@/app/ui/Logo";
import Papa from "@/app/ui/Papa";
import { DibujoPapaya } from "@/app/ui/Papaya";
import { color, fuente, lapiz } from "@/app/ui/sistema";

const pasosDe = (cadena: string) => [
  "Anota lo que falta en casa, como te salga. También puedes pegar el WhatsApp de la familia.",
  `Yo lo busco en tu ${cadena}, con los precios de hoy de tu tienda.`,
  "La primera vez eliges tú tus marcas. Después me acuerdo y ya no te pregunto.",
];

export default function AsiFunciona({
  tienda,
  cadena = "Wong",
  onSeguir,
}: {
  tienda?: string;
  cadena?: string; // «Wong», «Metro»
  onSeguir: () => void;
}) {
  return (
    <div className="sc-bienvenida" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div className="sc-bv-letrero" style={{ margin: "0 -22px" }}>
        <div style={{ background: color.papaya, color: "#fff", padding: "calc(22px + env(safe-area-inset-top, 0px)) 22px 20px" }}>
          <Logo tamano="chico" claro />
          <div style={{ marginTop: 18, fontSize: 13, fontWeight: 800, opacity: 0.9 }}>4 de 4</div>
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
            Así hacemos tu compra
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.45, margin: 0, maxWidth: "36ch", opacity: 0.95 }}>
            {tienda ? `Precios de hoy de ${tienda}. ${cadena} los confirma al pagar.` : `Precios de hoy. ${cadena} los confirma al pagar.`}
          </p>
        </div>
        <div className="sc-toldo" aria-hidden />
      </div>

      <div style={{ padding: "22px 0 calc(28px + var(--abajo))", maxWidth: 560, width: "100%", margin: "0 auto", display: "grid", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Papa px={92} momento="reposo" />
        </div>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14 }}>
          {pasosDe(cadena).map((p, i) => (
            <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span
                aria-hidden
                style={{
                  flex: "0 0 auto",
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: color.tinta,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 16, lineHeight: 1.4, color: color.tinta, fontWeight: 500 }}>{p}</span>
            </li>
          ))}
        </ol>
        <div style={{ display: "flex", gap: 12, alignItems: "center", background: color.papel2, borderRadius: 16, padding: "12px 14px" }}>
          <DibujoPapaya pepas={4} px={48} />
          <span style={{ ...lapiz, fontSize: 14, color: color.tinta }}>
            Cuando tu compra esté papaya, la dejo armada en tu carrito de {cadena}. Solo te falta pagar allá.
          </span>
        </div>
        <button
          type="button"
          onClick={onSeguir}
          className="sc-boton"
          style={{
            border: 0,
            borderRadius: 999,
            background: color.pino,
            color: "#fff",
            fontFamily: fuente,
            fontWeight: 800,
            fontSize: 16,
            padding: "15px 22px",
            cursor: "pointer",
          }}
        >
          Empezar mi lista
        </button>
      </div>
    </div>
  );
}
