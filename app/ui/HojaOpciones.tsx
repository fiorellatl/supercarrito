"use client";

import { color, lapiz, plata, soles } from "@/app/ui/sistema";
import type { ProductoWong } from "@/lib/catalog";
import Foto from "@/app/ui/Foto";
import Hoja from "@/app/ui/Hoja";
import Sello from "@/app/ui/Sello";
import { Dice } from "@/app/ui/Elenco";

// "Prefiero otra". Es la única puerta al aprendizaje del producto: si nadie
// entra aquí, el perfil nunca aprende nada.
//
// Por eso deja de ser un enlace de texto y pasa a ser una hoja con foto grande
// y precio: elegir comida es visual, y en una lista de nombres a 12 px cuatro
// arroces distintos son cuatro filas idénticas.
//
// ⚠️ El ORDEN es el que trae el catálogo, intacto. Reordenar aquí sería un motor
// de ranking, y eso está congelado hasta las entrevistas. Lo que sí decimos es
// cuál es la que ya compró: eso no es reordenar, es recordar.

export default function HojaOpciones({
  ingrediente,
  opciones,
  elegidaSku,
  primeraVez,
  agotado,
  onElegir,
  onCerrar,
  paso,
}: {
  ingrediente: string;
  opciones: ProductoWong[];
  elegidaSku?: string;
  // Lo escribió sin marca y no sabemos cuál compra: eligen ellos, y se dice
  // que la próxima vez ya no se pregunta. Sin «la que tienes puesta».
  primeraVez?: boolean;
  // Si se llega aquí porque lo que tenía puesto se acabó, la Piña lo dice una
  // vez, con la tienda que lo dijo, y deja paso a las opciones.
  agotado?: { nombre: string; tienda?: string };
  onElegir: (p: ProductoWong) => void;
  onCerrar: () => void;
  paso?: string;
}) {
  return (
    <Hoja
      titulo={primeraVez ? `¿Cuál “${ingrediente}”?` : `Para “${ingrediente}”`}
      sub={
        primeraVez
          ? "Eliges tú esta vez; la próxima me acuerdo."
          : "Estas son las que encontré. Toca la que compras tú."
      }
      onCerrar={onCerrar}
      paso={paso}
      pie={
        // 🚪 La salida abierta de esta pregunta: si ninguna es, la familia no
        // tiene que elegir una mentira. Se queda como está y se va.
        <p style={{ ...lapiz, margin: 0 }}>
          ¿Ninguna es? Ciérrala y escribe la marca en tu lista: la busco así.
        </p>
      }
    >
      {agotado && (
        <Dice quien="pina">
          Qué piña: {agotado.nombre} se acabó en {agotado.tienda ?? "tu Wong"}. Mira estas otras.
        </Dice>
      )}
      {opciones.map((o) => {
        const esta = o.sku === elegidaSku;
        const agotado = o.disponible === false;
        return (
          <button
            key={o.sku ?? o.nombre}
            onClick={() => onElegir(o)}
            className="sc-boton"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              marginBottom: 9,
              borderRadius: 15,
              background: color.blanco,
              border: `1px solid ${esta ? color.pino : color.renglon}`,
              boxShadow: esta ? `0 0 0 1.5px ${color.pino}` : "none",
              cursor: "pointer",
              font: "inherit",
              minHeight: 44,
            }}
          >
            <Foto src={o.imagen} alt={o.nombre ?? ingrediente} grande apagada={agotado} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  color: color.tinta,
                  lineHeight: 1.28,
                }}
              >
                {o.nombre ?? o.marca}
              </span>
              <span style={{ ...lapiz, display: "block", fontSize: 11.5, marginTop: 2 }}>
                {[o.marca, o.presentacion].filter(Boolean).join(" · ") || " "}
              </span>
              {(esta || agotado) && (
                <span style={{ display: "inline-block", marginTop: 5 }}>
                  {agotado ? (
                    <Sello tono="problema">hoy no hay</Sello>
                  ) : (
                    <Sello tono="confirmado">la que tienes puesta</Sello>
                  )}
                </span>
              )}
            </span>
            <span style={{ ...plata, fontSize: 14 }}>
              {o.precio != null ? soles(o.precio) : "—"}
            </span>
          </button>
        );
      })}
    </Hoja>
  );
}
