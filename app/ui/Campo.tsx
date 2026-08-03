"use client";

import { color, fuente, lapiz } from "@/app/ui/sistema";

// Un campo de texto. Solo aparece en confirmar, que es el único momento en que
// el producto pide datos — y los pide DESPUÉS de que la familia haya visto lo
// que compra, nunca antes.

export default function Campo({
  etiqueta,
  placeholder,
  defecto,
  tipo = "text",
}: {
  etiqueta: string;
  placeholder?: string;
  defecto?: string;
  tipo?: "text" | "email";
}) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ ...lapiz, display: "block", marginBottom: 6 }}>{etiqueta}</span>
      <input
        type={tipo}
        className="sc-campo"
        defaultValue={defecto}
        placeholder={placeholder}
        style={{
          width: "100%",
          minHeight: 44,
          padding: "12px 14px",
          borderRadius: 13,
          border: `1px solid ${color.renglon}`,
          background: color.blanco,
          fontFamily: fuente,
          fontSize: 15,
          fontWeight: 500,
          color: color.tinta,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}
