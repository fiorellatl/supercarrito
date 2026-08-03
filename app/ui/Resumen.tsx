"use client";

// Lo primero que se lee en el Home. Contesta dos de las cuatro preguntas de la
// PO —*¿qué es esto?* la primera vez, *¿qué pasó desde la última vez?* siempre—
// y prepara la tercera dejando claro cuál es el paso siguiente.
//
// Todo lo que dice sale del estado real. Si no hay nada que contar, no cuenta
// nada: nunca se rellena con una frase de cortesía.

import { color, fuente, lapiz } from "@/app/ui/sistema";

export type Novedad = {
  // Todo opcional: cada línea aparece solo si de verdad ocurrió.
  ultimaCompra?: string; // "hoy", "hace dos semanas"
  quedaron?: number; // líneas que sobrevivieron a la última compra
  aMedias?: boolean; // hay un carrito construido y sin comprar
  anotadas?: number; // líneas en la lista ahora mismo
};

export default function Resumen({
  nombre,
  primeraVez,
  novedad,
}: {
  nombre: string;
  primeraVez: boolean;
  novedad: Novedad;
}) {
  // "Desde la última vez" solo se puede decir si de verdad hubo una vez
  // anterior. Si no la hubo, se describe el presente y ya está: una frase que
  // presume un pasado que no existe es la forma más rápida de sonar a plantilla.
  const desdeAntes: string[] = [];
  if (novedad.aMedias) desdeAntes.push("dejaste un carrito a medias");
  if (novedad.ultimaCompra) desdeAntes.push(`compraste ${novedad.ultimaCompra}`);
  if (novedad.quedaron)
    desdeAntes.push(
      novedad.quedaron === 1
        ? "quedó 1 cosa sin comprar"
        : `quedaron ${novedad.quedaron} cosas sin comprar`
    );

  const ahora = novedad.anotadas
    ? novedad.anotadas === 1
      ? "Tienes 1 cosa anotada."
      : `Tienes ${novedad.anotadas} cosas anotadas.`
    : "Apunta lo que falte cuando te acuerdes. No hace falta terminar nada hoy.";

  return (
    <div style={{ padding: "4px 0 14px" }}>
      <h1
        style={{
          fontFamily: fuente,
          fontSize: primeraVez ? 24 : 21,
          fontWeight: 600,
          color: color.tinta,
          letterSpacing: "-0.03em",
          lineHeight: 1.22,
          margin: "0 0 6px",
          textWrap: "balance",
        }}
      >
        {primeraVez ? "Prepara tu compra" : `Tu compra, ${nombre}`}
      </h1>

      <p style={{ ...lapiz, fontSize: 14, margin: 0, maxWidth: "34ch" }}>
        {primeraVez
          ? "Empieza como te resulte más fácil. Cuando estés lista, la convierto en tu carrito de Wong con precios de hoy."
          : desdeAntes.length
            ? `Desde la última vez: ${desdeAntes.join(" · ")}.`
            : ahora}
      </p>
    </div>
  );
}
