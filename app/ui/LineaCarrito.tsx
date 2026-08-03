"use client";

import { color, lapiz, plata, soles } from "@/app/ui/sistema";
import type { ProductoWong } from "@/lib/catalog";
import { etiquetaUnitaria, formatearCantidad } from "@/lib/cantidades";
import Boton from "@/app/ui/Boton";
import Foto from "@/app/ui/Foto";
import Sello from "@/app/ui/Sello";

// Una línea del carrito. Es la pantalla donde se gana o se pierde la confianza,
// así que el orden de lectura está decidido y no se toca:
//
//   foto · nombre · LA MULTIPLICACIÓN · cuánto puede fiarse · monto
//
// La multiplicación va justo debajo del nombre porque es la pieza que construye
// la confianza, no una nota al pie: la familia nunca debería preguntarse de
// dónde salió un precio.
//
// Lo agotado se MUESTRA —en gris y con su sello—, nunca se esconde ni se
// sustituye en silencio: si desaparece, la familia cree que no la entendimos;
// viéndolo, entiende que el problema es la tienda.

export type EstadoLinea = "confirmado" | "pendiente" | "agotado" | "sin-resultado";

export default function LineaCarrito({
  ingrediente,
  producto,
  estado,
  cantidad,
  subtotal,
  confianza,
  acciones,
  mostrarPara,
  atenuada,
}: {
  ingrediente: string;
  producto?: ProductoWong;
  estado: EstadoLinea;
  cantidad?: number;
  subtotal?: number;
  confianza?: { tono: "confirmado" | "sabido" | "pendiente" | "problema"; texto: string };
  acciones?: { texto: string; onClick: () => void }[];
  mostrarPara?: boolean;
  atenuada?: boolean; // "dejarlo anotado": sigue a la vista, ya no compra
}) {
  const agotado = estado === "agotado";

  // Sin resultado no es un error de la familia: es algo que no supimos
  // encontrar. Se dice en primera persona y se deja su palabra intacta.
  if (estado === "sin-resultado") {
    return (
      <Fila>
        <Foto alt={ingrediente} apagada />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 500, color: color.tinta, lineHeight: 1.28 }}>
            {ingrediente}
          </div>
          <div style={{ ...lapiz, fontSize: 11.5, marginTop: 2 }}>no lo encontré en Wong</div>
        </div>
        <Monto>—</Monto>
      </Fila>
    );
  }

  return (
    <Fila atenuada={atenuada}>
      {producto?.url ? (
        <a
          href={producto.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", flex: "0 0 auto" }}
          aria-label={`Ver ${producto.nombre ?? ingrediente} en Wong`}
        >
          <Foto src={producto.imagen} alt={producto.nombre ?? ingrediente} apagada={agotado} />
        </a>
      ) : (
        <Foto src={producto?.imagen} alt={producto?.nombre ?? ingrediente} apagada={agotado} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14.5,
            fontWeight: 500,
            color: color.tinta,
            lineHeight: 1.28,
            textWrap: "pretty",
          }}
        >
          {producto?.nombre ?? ingrediente}
        </div>

        {/* La multiplicación. Nunca el resultado a secas. */}
        <div
          style={{
            ...lapiz,
            fontSize: 11.5,
            marginTop: 2,
            fontVariantNumeric: "tabular-nums",
            color: agotado ? color.ladrillo : color.lapiz,
          }}
        >
          {agotado
            ? "hoy no hay en Wong"
            : subtotal === undefined
              ? `${producto?.precio != null ? soles(producto.precio) : "—"}${etiquetaUnitaria(
                  producto?.unidadVenta ?? "un"
                )} · falta la cantidad`
              : `${cantidad != null ? formatearCantidad(cantidad, producto?.unidadVenta ?? "un") : "—"} × ${
                  producto?.precio != null ? soles(producto.precio) : "—"
                }${etiquetaUnitaria(producto?.unidadVenta ?? "un")}`}
        </div>

        {(producto?.marca || producto?.presentacion) && (
          <div style={{ ...lapiz, fontSize: 11, color: color.lapiz2, marginTop: 2 }}>
            {[producto.marca, producto.presentacion].filter(Boolean).join(" · ")}
          </div>
        )}

        {/* "para X" solo cuando dice algo: si lo pedido ya está en el nombre, la
            línea es ruido. Cuando NO lo está, es justo la señal que hay que ver
            en una entrevista — ahí el emparejamiento pudo fallar. */}
        {mostrarPara && (
          <div
            style={{
              ...lapiz,
              fontSize: 11,
              color: color.lapiz2,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            para {ingrediente}
          </div>
        )}

        {confianza && (
          <div style={{ marginTop: 6 }}>
            <Sello tono={confianza.tono}>{confianza.texto}</Sello>
          </div>
        )}

        {acciones && acciones.length > 0 && (
          <div style={{ marginTop: 7, display: "flex", flexWrap: "wrap", gap: 7 }}>
            {acciones.map((a) => (
              <Boton key={a.texto} variante="fantasma" chico onClick={a.onClick}>
                {a.texto}
              </Boton>
            ))}
          </div>
        )}
      </div>

      {/* Lo que no sabemos vale un guion, jamás un cero: un S/ 0.00 al lado de
          su propia multiplicación es un monto que ya no se puede explicar. */}
      <Monto apagado={subtotal === undefined || agotado}>
        {subtotal === undefined || agotado ? "—" : soles(subtotal)}
      </Monto>
    </Fila>
  );
}

function Fila({ children, atenuada }: { children: React.ReactNode; atenuada?: boolean }) {
  return (
    <div
      className="sc-entra"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 11,
        padding: "10px 0",
        borderBottom: `1px solid ${color.renglon}`,
        // Lo que se deja anotado no se borra ni se esconde: se apaga. Sigue a
        // la vista para poder volver a ponerlo sin buscarlo.
        opacity: atenuada ? 0.45 : 1,
      }}
    >
      {children}
    </div>
  );
}

function Monto({ children, apagado }: { children: React.ReactNode; apagado?: boolean }) {
  return (
    <div
      style={{
        ...plata,
        fontSize: 14,
        color: apagado ? color.lapiz2 : color.tinta,
        paddingTop: 1,
        flex: "0 0 auto",
      }}
    >
      {children}
    </div>
  );
}
