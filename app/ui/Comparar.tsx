"use client";

// La misma compra en la otra cadena (bloque B, 2026-11-27). Wireframe aprobado:
//
//   Wong   S/ 182.40 + envío 9.90
//   Metro  S/ 165.10 + envío 7.90
//   3 productos no están en Metro
//   [ Pedir en Metro ]
//
// Los dos montos son de EXACTAMENTE los mismos productos (ver lib/comparar.ts) y
// los da cada tienda. El envío se ve aparte, y la diferencia se explica con la
// cuenta a la vista. Lo que no entra se cuenta y se puede ver con su motivo.

import { useState } from "react";
import Boton from "@/app/ui/Boton";
import { color, lapiz, plata, rotulo, soles } from "@/app/ui/sistema";
import type { ProductoWong } from "@/lib/catalog";
import type { Tienda } from "@/lib/tienda";

export type Lado = { tienda: Tienda; total?: number; envio?: { hay: boolean; precio?: number } };

export type EstadoComparar =
  | { tipo: "nada" }
  | { tipo: "cargando" }
  | { tipo: "sin-respuesta" }
  | {
      tipo: "listo";
      comparados: number;
      origen: Lado;
      destino: Lado;
      fuera: { nombre: string; motivo: string }[];
      equivalentes: Record<string, ProductoWong>;
    };

const redondo = (n: number) => Math.round(n * 100) / 100;

export default function Comparar({
  estado,
  conDistrito,
  nombreCadena,
  onPedirAlla,
}: {
  estado: EstadoComparar;
  conDistrito: boolean;
  nombreCadena: (t: Tienda) => string; // «Wong», «Metro»
  onPedirAlla: () => void;
}) {
  const [verFuera, setVerFuera] = useState(false);
  if (estado.tipo === "nada") return null;

  const otra =
    estado.tipo === "listo" ? nombreCadena(estado.destino.tienda) : "la otra cadena";

  return (
    <div style={{ borderTop: `1px solid ${color.renglon}`, marginTop: 12, paddingTop: 12, marginBottom: 6 }}>
      <span style={rotulo}>La misma compra en {otra}</span>

      {estado.tipo === "cargando" && (
        <p className="sc-pulso" style={{ ...lapiz, margin: "8px 0 0" }}>
          Preguntando precios en la otra cadena…
        </p>
      )}
      {estado.tipo === "sin-respuesta" && (
        <p style={{ ...lapiz, margin: "8px 0 0" }}>Ahora no pude comparar: una de las tiendas no contestó.</p>
      )}

      {estado.tipo === "listo" &&
        (estado.comparados === 0 || estado.origen.total == null || estado.destino.total == null ? (
          <p style={{ ...lapiz, margin: "8px 0 0" }}>
            Ninguno de tus productos está igual en {otra}, así que no hay nada que comparar sin
            inventar.
          </p>
        ) : (
          <Cuenta
            estado={estado}
            conDistrito={conDistrito}
            otra={otra}
            verFuera={verFuera}
            setVerFuera={setVerFuera}
            onPedirAlla={onPedirAlla}
          />
        ))}
    </div>
  );
}

function Cuenta({
  estado,
  conDistrito,
  otra,
  verFuera,
  setVerFuera,
  onPedirAlla,
}: {
  estado: Extract<EstadoComparar, { tipo: "listo" }>;
  conDistrito: boolean;
  otra: string;
  verFuera: boolean;
  setVerFuera: (f: (x: boolean) => boolean) => void;
  onPedirAlla: () => void;
}) {
  const { origen, destino, comparados, fuera } = estado;
  // El envío solo cuenta si se conoce en los DOS lados; si no, se comparan
  // productos y se dice.
  const conEnvio =
    conDistrito && origen.envio?.hay && destino.envio?.hay &&
    origen.envio.precio != null && destino.envio.precio != null;
  const total = (l: Lado) => redondo((l.total ?? 0) + (conEnvio ? l.envio!.precio! : 0));
  const diferencia = redondo(total(origen) - total(destino));

  const fila = (l: Lado) => (
    <div
      key={l.tienda.id}
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        padding: "6px 0",
        fontSize: 14,
        color: color.tinta,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span style={{ minWidth: 0 }}>{l.tienda.nombre}</span>
      <span style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        {soles(l.total!)}
        {conEnvio && (
          <span style={{ color: color.lapiz }}>
            {" "}+ envío {l.envio!.precio! > 0 ? soles(l.envio!.precio!) : "gratis"}
          </span>
        )}
      </span>
    </div>
  );

  return (
    <>
      <p style={{ ...lapiz, margin: "6px 0 4px" }}>
        Comparo {comparados === 1 ? "el producto que es" : `los ${comparados} productos que son`}{" "}
        exactamente iguales en las dos, con los precios de hoy de cada tienda.
      </p>
      {fila(origen)}
      {fila(destino)}

      <p style={{ margin: "6px 0 4px", fontSize: 15, fontWeight: 600, color: color.tinta }}>
        {diferencia > 0 ? (
          <>
            En {otra} ahorras <span style={{ ...plata, fontSize: 15 }}>{soles(diferencia)}</span>
            {conEnvio ? " con el envío" : ""}.
          </>
        ) : diferencia < 0 ? (
          <>Tu tienda sale {soles(-diferencia)} más barata{conEnvio ? " con el envío" : ""}.</>
        ) : (
          <>Sale igual en las dos.</>
        )}
      </p>
      <p style={{ ...lapiz, margin: "0 0 6px" }}>
        {soles(total(origen))} − {soles(total(destino))}
        {!conDistrito ? ". Elige tu distrito arriba para sumar el envío." : ""}
      </p>

      {fuera.length > 0 && (
        <>
          <button
            onClick={() => setVerFuera((x) => !x)}
            aria-expanded={verFuera}
            style={{
              font: "inherit",
              fontSize: 13.5,
              color: color.tinta,
              background: "none",
              border: "none",
              padding: "8px 0",
              minHeight: 40,
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            {fuera.length === 1 ? "1 producto no entra" : `${fuera.length} productos no entran`} en la
            comparación
          </button>
          {verFuera &&
            fuera.map((f) => (
              <p key={f.nombre} style={{ ...lapiz, margin: "2px 0" }}>
                {f.nombre}: {f.motivo}.
              </p>
            ))}
        </>
      )}

      {diferencia > 0 && (
        <div style={{ marginTop: 8 }}>
          <Boton chico variante="lleno" onClick={onPedirAlla} style={{ minHeight: 44 }}>
            Pedir en {destino.tienda.nombre}
          </Boton>
          <p style={{ ...lapiz, margin: "6px 0 0" }}>
            Cambio tu tienda a {destino.tienda.nombre}, la de {otra} más cerca de la tuya.
            {fuera.length > 0 ? ` Lo que no entra en la comparación lo vuelvo a buscar allá.` : ""}
          </p>
        </div>
      )}
    </>
  );
}
