"use client";

import { useEffect, useRef, useState } from "react";

type Item = {
  ingrediente: string;
  encontrado: boolean;
  sku?: string;
  nombre?: string;
  marca?: string;
  imagen?: string;
  precio?: number;
  presentacion?: string;
  categoria?: string;
  disponible?: boolean;
  url?: string;
  alternativa: boolean;
  terminoUsado: string;
  degradado?: boolean;
};

type Carrito = {
  menu: string;
  titulo?: string;
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

type MenuResumen = { numero: string; nombre: string; platos: string[] };

export default function Home() {
  const [input, setInput] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [menus, setMenus] = useState<MenuResumen[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Un menú real como ejemplo tocable (no hardcodeado). Si falla, el chip
  // de menú usa "menú 2" por defecto y todo lo demás sigue funcionando.
  useEffect(() => {
    fetch("/api/menus")
      .then((r) => r.json())
      .then((d) => setMenus(d.menus ?? []))
      .catch(() => setMenus([]));
  }, []);

  // Los chips-ejemplo rellenan la MISMA caja (enseñan que puedes escribir como
  // quieras) y dejan al usuario enviar. Nada de flujos separados.
  function rellenar(texto: string) {
    setInput(texto);
    inputRef.current?.focus();
  }

  async function enviar(textoDirecto?: string) {
    const texto = (textoDirecto ?? input).trim();
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
        Dime qué necesitas comprar —como te salga— y te lo dejo en un{" "}
        <b>carrito con precios</b>, listo para comprar.
      </p>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {mensajes.length === 0 && !cargando && (
          <Inicio
            menuEjemplo={menus[1]?.numero ?? menus[0]?.numero ?? "2"}
            onRellenar={rellenar}
          />
        )}
        {mensajes.map((m, i) => (
          <Burbuja key={i} mensaje={m} />
        ))}
        {cargando && (
          <div style={{ color: "#71717a", fontStyle: "italic" }}>
            Armando tu carrito…
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
          placeholder="pollo, pan, aceite…"
          aria-label="Escribe qué necesitas comprar"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #d4d4d8",
            fontSize: 16,
          }}
        />
        <button
          onClick={() => enviar()}
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

function Inicio({
  menuEjemplo,
  onRellenar,
}: {
  menuEjemplo: string;
  onRellenar: (texto: string) => void;
}) {
  // Formas de expresar una intención de compra. Todas pasan por la MISMA caja.
  const modos = [
    { emoji: "📝", titulo: "Escribir una lista", ej: "pollo, pan, aceite" },
    { emoji: "🥘", titulo: "Convertir una receta", ej: "ají de gallina" },
    { emoji: "🍽️", titulo: "Comprar un menú", ej: `menú ${menuEjemplo}` },
  ];
  const proximos = [
    { emoji: "📷", titulo: "Foto de tu lista" },
    { emoji: "🎤", titulo: "Nota de voz" },
  ];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 13, color: "#71717a", marginBottom: 10 }}>
        Empieza como te resulte natural 👇 (toca un ejemplo y edítalo)
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {modos.map((m) => (
          <button
            key={m.titulo}
            onClick={() => onRellenar(m.ej)}
            style={{
              textAlign: "left",
              background: "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: 14,
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <span style={{ fontSize: 22 }}>{m.emoji}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>
                {m.titulo}
              </span>
              <span style={{ display: "block", fontSize: 13, color: "#71717a" }}>
                “{m.ej}”
              </span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#4338ca" }}>
              Probar →
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {proximos.map((p) => (
          <span
            key={p.titulo}
            style={{
              fontSize: 12,
              color: "#a1a1aa",
              border: "1px dashed #d4d4d8",
              borderRadius: 999,
              padding: "5px 10px",
            }}
          >
            {p.emoji} {p.titulo} · pronto
          </span>
        ))}
      </div>
    </div>
  );
}

function Burbuja({ mensaje }: { mensaje: Mensaje }) {
  const esUser = mensaje.autor === "user";

  // El carrito ocupa todo el ancho (no una burbuja) para que las tarjetas respiren.
  if (mensaje.data) {
    return (
      <div style={{ alignSelf: "stretch" }}>
        <Carrito data={mensaje.data} />
      </div>
    );
  }

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
    </div>
  );
}

function soles(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

function Carrito({ data }: { data: Carrito }) {
  const degradado = data.items.some((it) => it.degradado);
  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{data.titulo ?? data.menu}</div>
      <div style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>
        {data.platos.length > 0
          ? data.platos.join(" · ")
          : `${data.items.length} producto${data.items.length === 1 ? "" : "s"}`}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {data.items.map((it) => (
          <ProductoCard key={it.ingrediente} it={it} />
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginTop: 16,
          paddingTop: 12,
          borderTop: "1px solid #e4e4e7",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600 }}>Total estimado</span>
        <span style={{ fontSize: 20, fontWeight: 800 }}>{soles(data.total)}</span>
      </div>

      {data.faltantes.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#b91c1c" }}>
          No encontré en Wong: {data.faltantes.join(", ")}.
        </div>
      )}
      {degradado && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#a16207" }}>
          Wong no respondió; mostrando catálogo de respaldo.
        </div>
      )}
    </div>
  );
}

function ProductoCard({ it }: { it: Item }) {
  const card: React.CSSProperties = {
    border: "1px solid #ececef",
    borderRadius: 14,
    overflow: "hidden",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  };

  if (!it.encontrado) {
    return (
      <div style={{ ...card, alignItems: "center", justifyContent: "center", minHeight: 150, padding: 12 }}>
        <div style={{ fontSize: 28 }}>🔍</div>
        <div style={{ fontSize: 13, color: "#71717a", textAlign: "center", marginTop: 6 }}>
          Sin resultado para <b>{it.ingrediente}</b>
        </div>
      </div>
    );
  }

  const agotado = it.disponible === false;

  return (
    <a href={it.url} target="_blank" rel="noopener noreferrer" style={{ ...card, textDecoration: "none", color: "inherit" }}>
      <div style={{ position: "relative", aspectRatio: "4 / 3", background: "#f6f6f7" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={it.imagen}
          alt={it.nombre ?? it.ingrediente}
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: agotado ? 0.5 : 1 }}
        />
        {agotado && (
          <span style={{ position: "absolute", top: 8, left: 8, ...pill("#fef2f2", "#b91c1c") }}>
            Agotado
          </span>
        )}
      </div>
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {it.categoria && (
          <div style={{ fontSize: 10, letterSpacing: 0.4, textTransform: "uppercase", color: "#a1a1aa" }}>
            {it.categoria}
          </div>
        )}
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>{it.nombre}</div>
        <div style={{ fontSize: 12, color: "#71717a" }}>
          {it.marca}
          {it.presentacion ? ` · ${it.presentacion}` : ""}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 16, fontWeight: 800 }}>
            {it.precio != null ? soles(it.precio) : "—"}
          </span>
          <span style={{ fontSize: 10, color: "#a1a1aa" }}>para {it.ingrediente}</span>
        </div>
      </div>
    </a>
  );
}

function pill(bg: string, color: string): React.CSSProperties {
  return {
    padding: "2px 8px",
    borderRadius: 999,
    background: bg,
    color,
    fontSize: 11,
    fontWeight: 700,
  };
}
