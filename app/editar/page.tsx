"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { color, fuente, lapiz, rotulo } from "@/app/ui/sistema";
import Boton from "@/app/ui/Boton";

// La trastienda: los menús y las recetas de la casa, en texto plano.
//
// No está en la libreta ni cuelga del monograma — se llega por URL, a propósito.
// Es lo más lejos posible de escribir, que es lo que la familia viene a hacer.
// Aquí sí se ve una tipografía monoespaciada: es el único sitio del producto
// donde lo que importa es la ALINEACIÓN del texto, no su calidez.

export default function Editar() {
  const [menus, setMenus] = useState("");
  const [recetas, setRecetas] = useState("");
  const [estado, setEstado] = useState<string>("Cargando…");

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        setMenus(d.menus);
        setRecetas(d.recetas);
        setEstado("");
      })
      .catch(() => setEstado("No pude cargar los datos."));
  }, []);

  async function guardar() {
    setEstado("Guardando…");
    const res = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menus, recetas }),
    });
    const d = await res.json();
    setEstado(d.ok ? "Guardado. Ya puedes anotarlo en tu libreta." : d.error);
  }

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "26px 22px 60px",
        fontFamily: fuente,
        color: color.tinta,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <h1 style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>
          Menús y recetas
        </h1>
        <Link href="/" style={{ ...lapiz, color: color.lapiz, textDecoration: "none" }}>
          volver a la libreta
        </Link>
      </div>

      <p style={{ ...lapiz, margin: "8px 0 22px" }}>
        Un bloque por elemento, separados por una línea en blanco. Los ingredientes van con “-”.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <Caja
          titulo="Menús"
          ayuda="El nombre debe llevar un número (por ejemplo, “Menú 2”)."
          value={menus}
          onChange={setMenus}
        />
        <Caja
          titulo="Recetas"
          ayuda="Primera línea: el plato. Debajo, sus ingredientes."
          value={recetas}
          onChange={setRecetas}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18 }}>
        <Boton variante="lleno" onClick={guardar}>
          Guardar
        </Boton>
        <span style={lapiz} role="status" aria-live="polite">
          {estado}
        </span>
      </div>
    </main>
  );
}

function Caja({
  titulo,
  ayuda,
  value,
  onChange,
}: {
  titulo: string;
  ayuda: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={{ ...rotulo, display: "block" }}>{titulo}</label>
      <div style={{ ...lapiz, margin: "4px 0 8px" }}>{ayuda}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="sc-campo"
        style={{
          width: "100%",
          height: 340,
          padding: 14,
          borderRadius: 13,
          border: `1px solid ${color.renglon}`,
          background: color.blanco,
          color: color.tinta,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 13.5,
          lineHeight: 1.6,
          boxSizing: "border-box",
          resize: "vertical",
          outline: "none",
        }}
      />
    </div>
  );
}
