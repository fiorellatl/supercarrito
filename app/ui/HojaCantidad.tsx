"use client";

import { useState } from "react";
import { color, fuente, lapiz, plata, soles } from "@/app/ui/sistema";
import type { ProductoWong } from "@/lib/catalog";
import { etiquetaUnitaria, formatearCantidad, opcionesDeCantidad } from "@/lib/cantidades";
import Boton from "@/app/ui/Boton";
import Foto from "@/app/ui/Foto";
import Hoja from "@/app/ui/Hoja";

// La ÚNICA pregunta que hace el producto, y solo aparece donde sin la respuesta
// no habría monto explicable. Se guarda para no volver a hacerla nunca:
// preguntar dos veces lo mismo rompe la promesa entera.
//
// 🚪 PRINCIPIO: toda pregunta cerrada tiene una salida abierta. Las opciones son
// múltiplos de la cantidad mínima real de Wong —la trucha se vende de 400 en
// 400 g—, así que ninguna es inventada; y "otra cantidad" existe porque una
// familia que compra 1,2 kg no puede verse obligada a enseñarnos un dato falso
// que se quedaría en su perfil para siempre.
//
// Mientras no responda, el pie dice "aún no suma". El total no miente ni
// mientras se está decidiendo.

export default function HojaCantidad({
  ingrediente,
  producto,
  onResponder,
  onCerrar,
}: {
  ingrediente: string;
  producto: ProductoWong;
  onResponder: (cantidad: number) => void;
  onCerrar: () => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const [texto, setTexto] = useState("");

  const unidad = producto.unidadVenta ?? "un";
  const opciones = opcionesDeCantidad(producto.cantidadMinima, unidad);

  // En kg se escribe en gramos, que es como habla la gente en el supermercado.
  const enGramos = unidad === "kg";
  const valor = Number(texto.replace(",", "."));
  const valido = Number.isFinite(valor) && valor > 0;
  const cantidadFinal = enGramos ? valor / 1000 : valor;

  const paso =
    producto.cantidadMinima && producto.cantidadMinima > 0 && enGramos
      ? ` · de ${Math.round(producto.cantidadMinima * 1000)} en ${Math.round(
          producto.cantidadMinima * 1000
        )} g`
      : "";

  return (
    <Hoja
      titulo={producto.nombre ?? ingrediente}
      sub={`${
        producto.precio != null ? soles(producto.precio) : "—"
      }${etiquetaUnitaria(unidad)}${paso}`}
      onCerrar={onCerrar}
      pie={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <span>
            <span style={{ ...lapiz, display: "block", fontSize: 11, letterSpacing: "0.13em", textTransform: "uppercase" }}>
              Aún no suma
            </span>
            <span style={{ ...plata, fontSize: 24, color: color.lapiz, letterSpacing: "-0.03em" }}>
              S/ —
            </span>
          </span>
          <Boton variante="fantasma" chico onClick={onCerrar}>
            Hoy no
          </Boton>
        </div>
      }
    >
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          paddingBottom: 16,
          borderBottom: `1px solid ${color.renglon}`,
        }}
      >
        <Foto src={producto.imagen} alt={producto.nombre ?? ingrediente} grande />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: color.tinta, letterSpacing: "-0.01em" }}>
            ¿Cuánto compras normalmente?
          </div>
          <div style={{ ...lapiz, marginTop: 3 }}>Lo recordaré y no te lo vuelvo a preguntar.</div>
        </div>
      </div>

      {abierta ? (
        <div style={{ paddingTop: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            autoFocus
            inputMode="decimal"
            className="sc-campo"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && valido && onResponder(cantidadFinal)}
            placeholder={enGramos ? "por ejemplo 1200" : "por ejemplo 3"}
            aria-label={enGramos ? "Cantidad en gramos" : "Cantidad de unidades"}
            style={{
              width: 130,
              minHeight: 44,
              padding: "10px 14px",
              borderRadius: 13,
              border: `1px solid ${color.papaya}`,
              background: color.blanco,
              fontFamily: fuente,
              fontSize: 15,
              fontWeight: 500,
              color: color.tinta,
              outline: "none",
            }}
          />
          <span style={{ ...lapiz, fontSize: 13 }}>{enGramos ? "gramos" : "unidades"}</span>
          <Boton variante="lleno" chico disabled={!valido} onClick={() => valido && onResponder(cantidadFinal)}>
            Listo
          </Boton>
          <Boton variante="suave" chico onClick={() => setAbierta(false)}>
            Volver
          </Boton>
        </div>
      ) : (
        <div
          style={{
            paddingTop: 14,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 9,
          }}
        >
          {opciones.map((c) => (
            <Boton key={c} variante="fantasma" onClick={() => onResponder(c)}>
              {formatearCantidad(c, unidad)}
            </Boton>
          ))}
          <Boton
            variante="fantasma"
            onClick={() => setAbierta(true)}
            style={{ gridColumn: "1 / -1", borderColor: color.papaya, justifyContent: "space-between" }}
          >
            <span>Otra cantidad</span>
            <span style={{ ...lapiz, fontSize: 13 }}>{enGramos ? "en gramos" : "en unidades"}</span>
          </Boton>
        </div>
      )}
    </Hoja>
  );
}
