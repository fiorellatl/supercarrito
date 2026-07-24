"use client";

import { useState } from "react";

type Item = {
  ingrediente: string;
  encontrado: boolean;
  nombre?: string;
  precio?: number;
  alternativa: boolean;
  terminoUsado: string;
};

type Carrito = {
  menu: string;
  platos: string[];
  items: Item[];
  total: number;
  faltantes: string[];
};

type Mensaje = {
  autor: "user" | "bot";
  texto?: string;
  data?: Carrito;
};

export default function Home() {
  const [input, setInput] = useState("Compra el menú 2");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    const texto = input.trim();
    if (!texto || cargando) return;

    setMensajes((m) => [...m, { autor: "user", texto }]);
    setInput("");
    setCargando(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: texto }),
      });
      const data = await res.json();

      if (data.ok) {
        setMensajes((m) => [
          ...m,
          { autor: "bot", data },
        ]);
      } else {
        setMensajes((m) => [...m, { autor: "bot", texto: data.texto }]);
      }
    } catch {
      setMensajes((m) => [
        ...m,
        { autor: "bot", texto: "Ups, algo falló. Intenta de nuevo." },
      ]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "0 auto",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ fontSize: 22 }}>🛒 Super Carrito</h1>
        <a href="/editar" style={{ color: "#4338ca", fontSize: 14 }}>
          ✏️ Editar menús
        </a>
      </div>
      <p style={{ color: "#71717a", marginTop: 0 }}>
        Escribe algo como <b>&quot;Compra el menú 2&quot;</b>
      </p>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {mensajes.map((m, i) => (
          <Burbuja key={i} mensaje={m} />
        ))}
        {cargando && (
          <div style={{ color: "#71717a", fontStyle: "italic" }}>
            Pensando…
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="Compra el menú 2"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #d4d4d8",
            fontSize: 16,
          }}
        />
        <button
          onClick={enviar}
          disabled={cargando}
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            border: "none",
            background: "#111",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Enviar
        </button>
      </div>
    </main>
  );
}

function Burbuja({ mensaje }: { mensaje: Mensaje }) {
  const esUser = mensaje.autor === "user";
  return (
    <div
      style={{
        alignSelf: esUser ? "flex-end" : "flex-start",
        background: esUser ? "#111" : "#fff",
        color: esUser ? "#fff" : "#111",
        padding: "10px 14px",
        borderRadius: 14,
        maxWidth: "85%",
        border: esUser ? "none" : "1px solid #e4e4e7",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {mensaje.texto && <span>{mensaje.texto}</span>}
      {mensaje.data && <Carrito data={mensaje.data} />}
    </div>
  );
}

function soles(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

function Carrito({ data }: { data: Carrito }) {
  return (
    <div style={{ minWidth: 280 }}>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>{data.menu}</div>
      <div style={{ fontSize: 13, color: "#71717a", marginBottom: 10 }}>
        {data.platos.join(" · ")}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.items.map((it) => (
          <div
            key={it.ingrediente}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              paddingBottom: 8,
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#71717a" }}>
                {it.ingrediente}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {it.encontrado ? it.nombre : "— no encontrado en Wong —"}
              </div>
              {it.alternativa && (
                <span style={badge("#eef2ff", "#4338ca")}>
                  alternativa: “{it.terminoUsado}”
                </span>
              )}
              {!it.encontrado && (
                <span style={badge("#fef2f2", "#b91c1c")}>faltante</span>
              )}
            </div>
            <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
              {it.encontrado && it.precio != null ? soles(it.precio) : "—"}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 12,
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        <span>Total estimado</span>
        <span>{soles(data.total)}</span>
      </div>

      {data.faltantes.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#b91c1c" }}>
          No encontré en Wong: {data.faltantes.join(", ")}.
        </div>
      )}
    </div>
  );
}

function badge(bg: string, color: string): React.CSSProperties {
  return {
    display: "inline-block",
    marginTop: 4,
    padding: "1px 7px",
    borderRadius: 999,
    background: bg,
    color,
    fontSize: 11,
    fontWeight: 600,
  };
}
