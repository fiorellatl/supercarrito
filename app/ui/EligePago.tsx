"use client";

// «¿Pagas con alguna?», paso 3 de 4, justo después de elegir la tienda
// (decisión de la PO, 2026-11-27): en Wong, con Tarjeta Cencosud, los precios
// cambian, y conviene saberlo desde el principio.
//
// Con la respuesta, cada producto con promoción de esa tarjeta enseña su precio
// con ella, tal como lo publica la tienda (lib/tarjetas.ts). No se resta del
// total: la tienda lo descuenta al pagar. Salidas abiertas: «Otra» escrita,
// «Ninguna» y «Prefiero no decirlo», que no guarda nada.

import Boton from "@/app/ui/Boton";
import Logo from "@/app/ui/Logo";
import { usarTarjetas } from "@/app/ui/Revisar";
import { color, fuente, lapiz } from "@/app/ui/sistema";

export default function EligePago({
  cadena,
  pago,
  onElegir,
  onSaltar,
}: {
  cadena: string;
  pago?: { tarjetas: string[]; otra?: string };
  onElegir: (tarjetas: string[], otra?: string) => void;
  onSaltar: () => void;
}) {
  const { chips, listo, guardar } = usarTarjetas(pago, cadena);
  return (
    <div className="sc-bienvenida" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div className="sc-bv-letrero" style={{ margin: "0 -22px" }}>
        <div style={{ background: color.papaya, color: "#fff", padding: "calc(22px + env(safe-area-inset-top, 0px)) 22px 20px" }}>
          <Logo tamano="chico" claro />
          <div style={{ marginTop: 18, fontSize: 13, fontWeight: 800, opacity: 0.9 }}>3 de 4</div>
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
            ¿Pagas con alguna?
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.45, margin: 0, maxWidth: "36ch", opacity: 0.95 }}>
            Algunas tarjetas tienen precios especiales en {cadena}. Marca las que tengas.
          </p>
        </div>
        <div className="sc-toldo" aria-hidden />
      </div>

      <div
        style={{
          padding: "22px 0 calc(28px + var(--abajo))",
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        {chips}
        <div style={{ display: "grid", gap: 10 }}>
          <Boton variante="lleno" disabled={!listo} style={{ width: "100%" }} onClick={() => onElegir(...guardar())}>
            {listo ? "Seguir" : "Marca una para seguir"}
          </Boton>
          <button
            type="button"
            onClick={onSaltar}
            style={{
              background: "none",
              border: "none",
              font: "inherit",
              fontSize: 14,
              color: color.tinta,
              textDecoration: "underline",
              minHeight: 44,
              cursor: "pointer",
            }}
          >
            Prefiero no decirlo
          </button>
        </div>
        <p style={{ ...lapiz, margin: 0, textAlign: "center" }}>
          No te pido números ni datos de la tarjeta. {cadena} aplica tu descuento al pagar.
        </p>
      </div>
    </div>
  );
}
