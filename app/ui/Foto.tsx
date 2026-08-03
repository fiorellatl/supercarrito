"use client";

import { color, radio } from "@/app/ui/sistema";

// La foto del producto. 46 px en el carrito, 60 px al elegir.
//
// 📸 LA FRONTERA: la foto separa escribir de comprar. No hay ni una imagen en
// la libreta —poner una miniatura junto a "leche" obliga a validar una elección
// que la familia todavía no ha tomado— y hay una en cada línea del carrito,
// porque comprar online es visual: para confirmar que es ESE yogurt hay que
// verlo.
//
// Fondo blanco siempre: el papel hueso detrás de un packshot lo ensucia.
// Agotado va al 45 % y en gris — se muestra, nunca se esconde.

export default function Foto({
  src,
  alt,
  grande = false,
  apagada = false,
}: {
  src?: string;
  alt: string;
  grande?: boolean;
  apagada?: boolean;
}) {
  const lado = grande ? 60 : 46;

  return (
    <span
      style={{
        width: lado,
        height: lado,
        flex: "0 0 auto",
        borderRadius: grande ? radio.fotoGrande : radio.foto,
        background: color.blanco,
        border: `1px solid ${color.renglon}`,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            opacity: apagada ? 0.45 : 1,
            filter: apagada ? "grayscale(1)" : undefined,
          }}
        />
      ) : (
        // Sin imagen no dibujamos un icono de "roto": dejamos el hueco con la
        // forma final, igual que el esqueleto. Nada salta cuando llega.
        <span
          aria-hidden
          style={{ width: lado * 0.4, height: 2, background: color.renglon, borderRadius: 2 }}
        />
      )}
    </span>
  );
}
