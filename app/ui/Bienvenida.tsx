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
//
// 2026-08-03 — Segunda pasada, de experiencia. Lo que había contestaba las tres
// preguntas y aun así se leía como un formulario con una lista encima. Tres
// cosas cambiaron:
//
//   · **Se enseña el producto antes de pedir nada.** Una nota manuscrita se
//     convierte en un producto de Wong con su precio, delante de sus ojos, en
//     el momento en que la pantalla aparece. Es la promesa entera en dos
//     líneas, y no hay forma más corta de contarla que hacerla.
//   · **Entra en orden, no de golpe.** Cada bloque llega escalonado. La pantalla
//     se escribe sola, como se escribe una lista.
//   · **El nombre de la casa deja de ser un campo de registro.** Es la última
//     frase de una conversación, no el primer paso de un alta.

import { useState } from "react";
import Boton from "@/app/ui/Boton";
import Logo from "@/app/ui/Logo";
import { color, fuente, lapiz, plata } from "@/app/ui/sistema";

// Cuatro formas equivalentes de empezar. Ninguna va primera por ser mejor: van
// en el orden en que se le ocurren a una persona, y las cuatro terminan en el
// mismo sitio.
const CAPACIDADES = [
  { icono: "✎", texto: "Escríbelo como te salga" },
  { icono: "⌘", texto: "Pega un WhatsApp entero, tal cual" },
  { icono: "◫", texto: "Importa una compra que ya hiciste" },
  { icono: "☰", texto: "Carga el menú de la semana" },
];

// La demostración. Es la aplicación de verdad, en pequeño: la letra de la
// familia arriba, lo que contesta SuperCarrito abajo, y la flecha que hace de
// verbo. Los datos son reales —ese producto y ese precio existen— porque una
// demostración con cifras inventadas es la primera mentira del producto.
function Muestra() {
  return (
    <div
      className="sc-entra"
      style={{
        animationDelay: "90ms",
        border: `1px solid ${color.renglon}`,
        borderRadius: 16,
        background: color.blanco,
        padding: "13px 15px 14px",
        boxShadow: "0 1px 2px rgba(34,51,84,.05)",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 500, color: color.tinta, lineHeight: 1.35 }}>
        &ldquo;mami compra 2 kg de pollo y leche&rdquo;
      </div>

      <div
        aria-hidden
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          margin: "9px 0 8px",
          color: color.lapiz2,
        }}
      >
        <span style={{ height: 1, flex: 1, background: color.renglon }} />
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
        <span style={{ height: 1, flex: 1, background: color.renglon }} />
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        {[
          { n: "Pollo Entero Fresco x kg", c: "2 kg × S/ 11.90/kg", m: "S/ 23.80" },
          { n: "Leche Gloria Entera 400 g", c: "1 × S/ 4.50 c/u", m: "S/ 4.50" },
        ].map((p) => (
          <div key={p.n} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: color.tinta, lineHeight: 1.3 }}>
              {p.n}
              <span style={{ ...lapiz, fontSize: 11, display: "block", marginTop: 1 }}>{p.c}</span>
            </span>
            <span style={{ ...plata, fontSize: 13, flex: "0 0 auto" }}>{p.m}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Bienvenida({ onEntrar }: { onEntrar: (nombre: string) => void }) {
  const [nombre, setNombre] = useState("");

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 20,
        padding: "40px 0 calc(28px + var(--abajo))",
      }}
    >
      <div className="sc-entra">
        <Logo />
        <h1
          style={{
            fontFamily: fuente,
            fontSize: 28,
            fontWeight: 600,
            color: color.tinta,
            letterSpacing: "-0.035em",
            lineHeight: 1.15,
            margin: "18px 0 8px",
            textWrap: "balance",
          }}
        >
          Tu lista de la compra,
          <br />
          ya hecha.
        </h1>
        {/* La frase que define el producto. Sin "IA", sin "plataforma", sin
            "optimiza": lo que hace, dicho como lo diría una vecina. */}
        <p style={{ ...lapiz, fontSize: 15, lineHeight: 1.55, margin: 0, maxWidth: "31ch" }}>
          Anota lo que falta en casa como te salga. Yo lo convierto en tu carrito
          de Wong, con los precios de tu tienda.
        </p>
      </div>

      <Muestra />

      <ul
        className="sc-entra"
        style={{
          animationDelay: "180ms",
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gap: 9,
        }}
      >
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
        className="sc-entra"
        style={{ animationDelay: "270ms" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (nombre.trim()) onEntrar(nombre);
        }}
      >
        <label htmlFor="sc-nombre" style={{ ...lapiz, display: "block", marginBottom: 6 }}>
          ¿Cómo llamamos a tu casa?
        </label>
        <input
          id="sc-nombre"
          className="sc-campo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Rosa · los Torres · casa"
          autoComplete="off"
          enterKeyHint="go"
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
            boxSizing: "border-box",
          }}
        />
        <Boton variante="lleno" type="submit" disabled={!nombre.trim()} style={{ width: "100%" }}>
          Empezar
        </Boton>

        {/* Se dice antes de que lo pregunte, y pegado al botón: sin esta línea,
            un campo de texto en la primera pantalla parece el principio de un
            registro largo. */}
        <p style={{ ...lapiz, fontSize: 12, margin: "10px 0 0", textAlign: "center" }}>
          Sin contraseñas y sin correo. Nada sale de este teléfono.
        </p>
      </form>
    </div>
  );
}
