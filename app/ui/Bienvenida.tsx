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

import { useEffect, useRef, useState } from "react";
import Boton from "@/app/ui/Boton";
import Logo from "@/app/ui/Logo";
import { color, fuente, lapiz, plata, soles } from "@/app/ui/sistema";

// Cuatro formas equivalentes de empezar. Ninguna va primera por ser mejor: van
// en el orden en que se le ocurren a una persona, y las cuatro terminan en el
// mismo sitio.
const CAPACIDADES = [
  { icono: "✎", texto: "Escríbelo como te salga" },
  { icono: "⌘", texto: "Pega un WhatsApp entero, tal cual" },
  { icono: "◫", texto: "Importa una compra que ya hiciste" },
  { icono: "☰", texto: "Carga el menú de la semana" },
];

// La demostración. Es la aplicación de verdad, en pequeño: la frase de la
// familia se escribe sola, la flecha hace de verbo y los productos caen al
// carrito uno por uno, con su multiplicación y su total. Rota entre tres
// encargos típicos (pedido de la PO, 2026-11-26: «más personalidad»).
//
// Los productos y precios son de Wong real, consultados el 2026-11-26: una
// demostración con cifras inventadas es la primera mentira del producto.
const EJEMPLOS: { frase: string; productos: { n: string; c: string; m: number }[] }[] = [
  {
    frase: "mami compra 2 kg de pollo y leche",
    productos: [
      { n: "Pollo Entero Fresco x kg", c: "2 kg × S/ 11.90/kg", m: 23.8 },
      { n: "Leche Gloria Entera 400 g", c: "1 × S/ 4.50 c/u", m: 4.5 },
    ],
  },
  {
    frase: "papa 2 kg, aceite primor y huevos 🥚",
    productos: [
      { n: "Papa Negra Comcen 2 kg", c: "1 × S/ 11.00 c/u", m: 11 },
      { n: "Aceite Vegetal Primor 1.8 L", c: "1 × S/ 17.10 c/u", m: 17.1 },
      { n: "Huevos Pardos La Calera 14 un", c: "1 × S/ 18.20 c/u", m: 18.2 },
    ],
  },
  {
    frase: "medio kilo de cebolla pls",
    productos: [{ n: "Cebolla Blanca x kg", c: "0.5 kg × S/ 5.29/kg", m: 2.65 }],
  },
];

function Muestra() {
  const [n, setN] = useState(0);
  const [letras, setLetras] = useState(0);
  const quieto = useRef(false);
  const ej = EJEMPLOS[n];
  const escrita = letras >= ej.frase.length;

  useEffect(() => {
    quieto.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (quieto.current) setLetras(EJEMPLOS[0].frase.length);
  }, []);

  useEffect(() => {
    if (quieto.current) return;
    if (!escrita) {
      const t = setTimeout(() => setLetras((x) => x + 1), 38 + Math.random() * 40);
      return () => clearTimeout(t);
    }
    // Escrita: caen los productos y se queda a la vista un rato antes de
    // pasar al siguiente encargo.
    const t = setTimeout(() => {
      setN((x) => (x + 1) % EJEMPLOS.length);
      setLetras(0);
    }, 3600 + ej.productos.length * 260);
    return () => clearTimeout(t);
  }, [letras, escrita, ej.productos.length]);

  const total = ej.productos.reduce((a, p) => a + p.m, 0);

  return (
    <div
      className="sc-entra"
      aria-label={`Ejemplo: «${ej.frase}» se convierte en ${ej.productos.length} productos de Wong`}
      style={{ animationDelay: "90ms", borderRadius: 20, background: color.papel2, padding: "16px 16px 14px", minHeight: 318 }}
    >
      <div style={{ fontSize: 17, fontWeight: 600, color: color.tinta, lineHeight: 1.35, minHeight: 46 }}>
        &ldquo;{ej.frase.slice(0, letras)}
        {!escrita && <span className="sc-cursor" aria-hidden />}
        {escrita && <>&rdquo;</>}
      </div>

      <div aria-hidden style={{ display: "flex", alignItems: "center", gap: 7, margin: "9px 0 10px", color: escrita ? color.papaya : color.lapiz2 }}>
        <span style={{ height: 1, flex: 1, background: color.renglon }} />
        <svg className={escrita ? "sc-salto" : undefined} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
        <span style={{ height: 1, flex: 1, background: color.renglon }} />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {escrita &&
          ej.productos.map((p, i) => (
            <div
              key={`${n}-${p.n}`}
              className="sc-cae-carrito"
              style={{
                animationDelay: `${120 + i * 260}ms`,
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                background: color.blanco,
                borderRadius: 14,
                padding: "10px 12px",
              }}
            >
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: color.tinta, lineHeight: 1.3 }}>
                {p.n}
                <span style={{ ...lapiz, fontSize: 11, display: "block", marginTop: 1 }}>{p.c}</span>
              </span>
              <span style={{ ...plata, fontSize: 15, fontWeight: 800, flex: "0 0 auto" }}>{soles(p.m)}</span>
            </div>
          ))}
        {escrita && (
          <div
            className="sc-cae-carrito"
            style={{
              animationDelay: `${120 + ej.productos.length * 260}ms`,
              display: "flex",
              justifyContent: "space-between",
              padding: "2px 12px 0",
              fontSize: 13,
              fontWeight: 800,
              color: color.pino,
            }}
          >
            <span>Tu carrito de Wong</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{soles(total)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Bienvenida({ onEntrar }: { onEntrar: (nombre: string) => void }) {
  const [nombre, setNombre] = useState("");

  // Estilo «puesto de mercado» (2026-11-26): el letrero rojo con su toldo es
  // lo primero que se ve, igual que en la lista. En escritorio, dos columnas:
  // la promesa a la izquierda, la demostración y la puerta a la derecha.
  return (
    <div className="sc-bienvenida" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div className="sc-bv-letrero" style={{ margin: "0 -22px" }}>
        <div
          className="sc-entra"
          style={{
            background: color.papaya,
            color: "#fff",
            padding: "calc(28px + env(safe-area-inset-top, 0px)) 22px 22px",
          }}
        >
          <div className="sc-bv-ancho">
            <Logo claro />
            <h1
              style={{
                fontFamily: fuente,
                fontSize: "clamp(34px, 6vw, 56px)",
                fontWeight: 800,
                letterSpacing: "-0.045em",
                lineHeight: 1,
                margin: "22px 0 12px",
                textWrap: "balance",
              }}
            >
              Tu lista de la compra, ya hecha.
            </h1>
            {/* La frase que define el producto. Sin "IA", sin "plataforma", sin
                "optimiza": lo que hace, dicho como lo diría una vecina. */}
            <p style={{ fontSize: 16, lineHeight: 1.5, margin: 0, maxWidth: "34ch", opacity: 0.95 }}>
              Anota lo que falta en casa como te salga. Yo lo convierto en tu
              carrito de Wong, con los precios de tu tienda.
            </p>
          </div>
        </div>
        <div className="sc-toldo" aria-hidden />
      </div>

      <div className="sc-bv-cuerpo" style={{ display: "grid", gap: 20, padding: "22px 0 calc(28px + var(--abajo))" }}>
        <div className="sc-bv-izq" style={{ display: "grid", gap: 20, alignContent: "start" }}>
          <Muestra />
          <ul
            className="sc-entra"
            style={{ animationDelay: "180ms", listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: 8 }}
          >
            {CAPACIDADES.map((c, i) => (
              <li
                key={c.texto}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px 8px 8px",
                  borderRadius: 999,
                  background: color.papel2,
                  fontSize: 14,
                  fontWeight: 600,
                  color: color.tinta,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    color: "#fff",
                    background: [color.papaya, color.pino, "#C9A227", "#3B82C4"][i % 4],
                  }}
                >
                  {c.icono}
                </span>
                {c.texto}
              </li>
            ))}
          </ul>
        </div>

        <form
          className="sc-entra sc-bv-der"
          style={{ animationDelay: "270ms", alignSelf: "start" }}
          onSubmit={(e) => {
            e.preventDefault();
            if (nombre.trim()) onEntrar(nombre);
          }}
        >
          <label
            htmlFor="sc-nombre"
            style={{ display: "block", marginBottom: 8, fontSize: 18, fontWeight: 800, color: color.tinta, letterSpacing: "-0.02em" }}
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
            enterKeyHint="go"
            style={{
              width: "100%",
              fontFamily: fuente,
              fontSize: 16,
              color: color.tinta,
              background: color.blanco,
              border: `2px solid ${color.tinta}`,
              borderRadius: 999,
              padding: "13px 18px",
              outline: "none",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />
          <Boton variante="lleno" type="submit" disabled={!nombre.trim()} style={{ width: "100%" }}>
            Empezar
          </Boton>

          {/* Se dice antes de que lo pregunte, y pegado al botón: sin esta
              línea, un campo de texto en la primera pantalla parece el
              principio de un registro largo. */}
          <p style={{ ...lapiz, fontSize: 12.5, margin: "10px 0 0", textAlign: "center" }}>
            Sin contraseñas y sin correo. Nada sale de este teléfono.
          </p>
        </form>
      </div>
    </div>
  );
}
