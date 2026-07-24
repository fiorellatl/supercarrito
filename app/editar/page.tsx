"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    setEstado(d.ok ? "✅ Guardado. Ya puedes probarlo en el chat." : `⚠️ ${d.error}`);
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: 16,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22 }}>✏️ Editar menús y recetas</h1>
        <Link href="/" style={{ color: "#4338ca" }}>
          ← Volver al chat
        </Link>
      </div>
      <p style={{ color: "#71717a", marginTop: 0 }}>
        Un bloque por elemento, separados por una línea en blanco. Ingredientes con “-”.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Caja
          titulo="Menús"
          ayuda='El nombre debe tener un número (ej. "Menú 2").'
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

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
        <button
          onClick={guardar}
          style={{
            padding: "12px 22px",
            borderRadius: 10,
            border: "none",
            background: "#111",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Guardar
        </button>
        <span style={{ color: "#3f3f46" }}>{estado}</span>
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
      <label style={{ fontWeight: 600 }}>{titulo}</label>
      <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 6 }}>{ayuda}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        style={{
          width: "100%",
          height: 340,
          padding: 12,
          borderRadius: 10,
          border: "1px solid #d4d4d8",
          fontFamily: "ui-monospace, monospace",
          fontSize: 14,
          lineHeight: 1.5,
          boxSizing: "border-box",
          resize: "vertical",
        }}
      />
    </div>
  );
}
