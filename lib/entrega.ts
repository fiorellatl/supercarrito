// Entrega: el último metro del producto. SuperCarrito no cobra ni compra —
// prepara la mejor compra posible y la ENTREGA a la tienda, donde la familia
// paga con su propia cuenta. El dinero y las credenciales nunca pasan por aquí.
//
// 🧱 Contrato, como todo proveedor externo (regla permanente de arquitectura):
// el producto no conoce a Wong, conoce `EntregaEnTienda`. Cambiar de tienda es
// escribir otra implementación.
//
// Mecanismo elegido (verificado contra www.wong.pe el 2026-08-03):
//   GET /checkout/cart/add?sku=<id>&qty=<n>&seller=1  [&sku&qty&seller ...]
//   -> 302 /checkout/#/cart
// `sku`, `qty` y `seller` se repiten por producto. Deliberadamente NO enviamos
// `sc` (política comercial): el enlace se abre en el navegador de la familia y
// hereda SU sesión —su tienda asignada, su zona, su login—. Fijar un `sc`
// nuestro sería sobrescribir su contexto con uno que no conocemos.
//
// Descartado con evidencia, para que nadie lo reintente:
//   · API pública de Checkout (orderForm): crear carrito anónimo devuelve 200,
//     pero añadirle ítems devuelve 401, y la cookie de propiedad del carrito
//     (CheckoutOrderFormOwnership, HttpOnly + SameSite=Strict, dominio wong.pe)
//     hace imposible traspasarle ese carrito al navegador de la familia.
//   · APIs de administración de VTEX: exigen appKey/appToken emitidos por Wong.
//     Es un acuerdo comercial, no una decisión técnica.

import type { ProductoWong, UnidadVenta } from "@/lib/catalog";

const WONG = "https://www.wong.pe";
const SELLER = "1";

// Lo que el producto le pide a la entrega: una línea ya decidida.
export type LineaAEntregar = {
  ingrediente: string;
  producto: ProductoWong;
  cantidad: number;
};

// Una línea que sí cruza, ya traducida al lenguaje de la tienda.
export type LineaViajera = {
  ingrediente: string;
  nombre: string;
  cantidad: number;
  unidad: UnidadVenta;
  // 🔍 Cuando la tienda solo vende en múltiplos, la cantidad que cruza puede no
  // ser exactamente la pedida. Nunca lo ajustamos en silencio: se guarda aquí
  // para que la pantalla lo enseñe.
  cantidadQueCruza: number;
  precio?: number;
  // Y con ella el monto que se va a cobrar de verdad. El total de esta pantalla
  // se suma con estos, no con los del carrito: enseñar S/ 16.95 y que Wong
  // cobre S/ 27.12 sería un monto inexplicable en el peor momento posible.
  subtotalQueCruza?: number;
};

export type LineaQueSeQueda = { nombre: string; motivo: string };

export type Entrega = {
  tienda: string;
  url: string | null;
  viajan: LineaViajera[];
  sequedan: LineaQueSeQueda[];
};

export interface EntregaEnTienda {
  readonly tienda: string;
  preparar(lineas: LineaAEntregar[]): Entrega;
}

// `qty` en VTEX se cuenta en múltiplos de la cantidad mínima de venta: la trucha
// se vende de 400 en 400 g, así que 1,2 kg son 3. Para lo envasado el múltiplo
// es 1 y `qty` es, simplemente, cuántos.
//
// ⬆️ Hacia ARRIBA, siempre. Redondear a la baja deja a la familia corta para lo
// que iba a cocinar —el fallo que no se puede arreglar en la cocina—, mientras
// que pasarse solo deja sobras. Quedarse corto en silencio sería, además, la
// versión pequeña de mentir sobre el carrito.
export function unidadesDeVenta(cantidad: number, producto: ProductoWong): number {
  const paso = pasoDe(producto);
  return Math.max(1, Math.ceil(cantidad / paso - 0.0001));
}

function pasoDe(producto: ProductoWong): number {
  return producto.unidadVenta === "kg" &&
    producto.cantidadMinima &&
    producto.cantidadMinima > 0
    ? producto.cantidadMinima
    : 1;
}

export const wongDeepLink: EntregaEnTienda = {
  tienda: "Wong",

  preparar(lineas) {
    const viajan: LineaViajera[] = [];
    const sequedan: LineaQueSeQueda[] = [];
    const partes: string[] = [];

    for (const { producto, ingrediente, cantidad } of lineas) {
      const nombre = producto.nombre ?? ingrediente;

      // Sin SKU no hay nada que entregar: es un producto que encontramos de
      // vista pero no sabemos nombrar en el idioma de la tienda.
      if (!producto.sku) {
        sequedan.push({ nombre, motivo: "no sé pedirlo en Wong" });
        continue;
      }
      if (producto.disponible === false) {
        sequedan.push({ nombre, motivo: "hoy no hay en Wong" });
        continue;
      }

      const qty = unidadesDeVenta(cantidad, producto);
      const cruza = Math.round(qty * pasoDe(producto) * 1000) / 1000;

      viajan.push({
        ingrediente,
        nombre,
        cantidad,
        unidad: producto.unidadVenta ?? "un",
        cantidadQueCruza: cruza,
        precio: producto.precio,
        subtotalQueCruza:
          producto.precio != null
            ? Math.round(producto.precio * cruza * 100) / 100
            : undefined,
      });

      partes.push(
        `sku=${encodeURIComponent(producto.sku)}&qty=${qty}&seller=${SELLER}`
      );
    }

    return {
      tienda: "Wong",
      url: partes.length ? `${WONG}/checkout/cart/add?${partes.join("&")}` : null,
      viajan,
      sequedan,
    };
  },
};
