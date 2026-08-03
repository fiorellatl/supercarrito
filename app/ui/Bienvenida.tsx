"use client";

// La entrada al producto. La primera pantalla que ve alguien que nunca ha oído
// hablar de SuperCarrito.
//
// Decisión de la PO (2026-08-02): el producto necesita una puerta con identidad.
// Revierte "ninguna pantalla aparece antes de la libreta", y se acepta porque el
// folio en blanco no explicaba nada a quien llega de cero.
//
// Tiene que contestar tres cosas en cinco segundos, y ni una más:
//   1. ¿Qué es esto?        → el nombre y una frase, sin jerga.
//   2. ¿Qué puedo hacer?    → las cuatro capacidades, dichas en voz alta.
//   3. ¿Cómo empiezo?       → un campo, un botón, y se acabó.
//
// Lo que NO tiene, a propósito: contraseña, correo, permisos, términos,
// carrusel, tour, ni un segundo paso. Pedir una cuenta antes de demostrar valor
// es cobrar antes de servir.

import { useState } from "react";
import Boton from "@/app/ui/Boton";
import Logo from "@/app/ui/Logo";
import { color, fuente, lapiz } from "@/app/ui/sistema";

// Cuatro formas equivalentes de empezar. Ninguna va primera por ser mejor: van
// en el orden en que se le ocurren a una persona, y las cuatro terminan en el
// mismo sitio.
const CAPACIDADES = [
  { icono: "✎", texto: "Escríbelo como te salga" },
  { icono: "⌘", texto: "Pega un WhatsApp entero, tal cual" },
  { icono: "◫", texto: "Importa una compra que ya hiciste" },
  { icono: "☰", texto: "Carga el menú de la semana" },
];

export default function Bienvenida({ onEntrar }: { onEntrar: (nombre: string) => void }) {
  const [nombre, setNombre] = useState("");

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 22,
        padding: "40px 0",
      }}
    >
      <div>
        <Logo />
        <h1
          style={{
            fontFamily: fuente,
            fontSize: 27,
            fontWeight: 600,
            color: color.tinta,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            margin: "18px 0 8px",
            textWrap: "balance",
          }}
        >
          Te damos la bienvenida.
        </h1>
        {/* La frase que define el producto. Sin "IA", sin "plataforma", sin
            "optimiza": lo que hace, dicho como lo diría una vecina. */}
        <p style={{ ...lapiz, fontSize: 15, lineHeight: 1.55, margin: 0, maxWidth: "30ch" }}>
          Prepara la compra de tu casa como quieras y nosotros la convertimos en
          tu carrito de Wong, con precios de hoy.
        </p>
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 9 }}>
        {CAPACIDADES.map((c) => (
          <li key={c.texto} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span
              aria-hidden
              style={{
                width: 30,
                height: 30,
                flex: "0 0 auto",
                display: "grid",
                placeItems: "center",
                borderRadius: 9,
                border: `1px solid ${color.renglon}`,
                background: color.blanco,
                color: color.lapiz,
                fontSize: 13,
              }}
            >
              {c.icono}
            </span>
            <span style={{ fontSize: 14, color: color.tinta, lineHeight: 1.35 }}>{c.texto}</span>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (nombre.trim()) onEntrar(nombre);
        }}
      >
        <label
          htmlFor="sc-nombre"
          style={{ ...lapiz, display: "block", marginBottom: 6 }}
        >
          ¿Cómo llamamos a tu casa?
        </label>
        <input
          id="sc-nombre"
          className="sc-campo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Rosa · los Torres · casa"
          autoComplete="off"
          style={{
            width: "100%",
            fontFamily: fuente,
            fontSize: 16,
            color: color.tinta,
            background: color.blanco,
            border: `1px solid ${color.renglon}`,
            borderRadius: 13,
            padding: "12px 14px",
            outline: "none",
            marginBottom: 12,
          }}
        />
        <Boton variante="lleno" type="submit" disabled={!nombre.trim()} style={{ width: "100%" }}>
          Empezar
        </Boton>
      </form>

      {/* Se dice antes de que lo pregunte: sin esta línea, un campo de texto en
          la primera pantalla parece el principio de un registro largo. */}
      <p style={{ ...lapiz, fontSize: 12, margin: 0, textAlign: "center" }}>
        Sin contraseñas y sin correo. Todo se queda en este dispositivo.
      </p>
    </div>
  );
}
