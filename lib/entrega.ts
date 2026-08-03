// Entrega: el último metro del producto. SuperCarrito no cobra ni compra —
// prepara la mejor compra posible y la ENTREGA a la tienda, donde la familia
// paga con su propia cuenta. El dinero y las credenciales nunca pasan por aquí.
//
// 🧱 Contrato, como todo proveedor externo (regla permanente de arquitectura):
// el producto no conoce a Wong, conoce `EntregaEnTienda`. Cambiar de tienda es
// escribir otra implementación.
//
// ⛔ EL ENLACE DE CARRITO NO FUNCIONA. Falsado el 2026-08-03 con la cuenta real
// de una familia, después de haberlo dado por bueno durante dos sprints.
//
//   · `/checkout/cart/add?sku&qty&seller` SIN `sc`  -> HTTP 500.
//   · con `sc=2`  -> 302 a /checkout/#/cart y el carrito VACÍO: el catálogo de
//     esa política comercial no contiene nuestros SKUs (buscar con sc=2 devuelve
//     cero productos).
//
// LA LECCIÓN, que vale más que el código: **un 302 no era prueba de nada** —un
// SKU inexistente también lo devuelve—. En VTEX un código de éxito no significa
// que la operación hiciera algo. La única prueba de una entrega es leer el
// carrito de una cuenta real.
//
// Descartado con evidencia (ver design/integracion-wong-investigacion.md):
//   · API pública de Checkout: crear carrito da 200, pero añadir ítems da 401
//     «Seller no autorizado 1 con la política comercial 1»; con sc=2 da 200 y
//     añade CERO. Además la propiedad del carrito viaja en una cookie
//     HttpOnly+SameSite=Strict que no podemos traspasar.
//   · APIs de administración de VTEX: exigen appKey/appToken emitidos por Wong.
//     Es un acuerdo comercial, no una decisión técnica.
//   · En móvil da igual: la app de Wong reclama todas las URLs del dominio
//     (assetlinks.json, `handle_all_urls`) y descarta los parámetros.
//
// Lo que este archivo SIGUE haciendo bien, y por eso no se borra: traducir la
// compra al idioma de la tienda —redondeos al múltiplo de venta, qué cruza y
// qué no, y a qué precio— que es la parte difícil y la que seguirá valiendo
// cuando exista una vía de entrega de verdad.

import type { ProductoWong, UnidadVenta } from "@/lib/catalog";

// Nota para quien retome esto: `seller=1` era correcto —la API de catálogo
// devuelve `sellerId: "1"`, `sellerName: "WongIO"`—. Lo que no está autorizado
// no es el vendedor, somos nosotros escribiendo en su política comercial.

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

      // `qty` en el idioma de la tienda: cuántas unidades mínimas de venta. Hoy
      // no sale de aquí, pero es la traducción que cualquier entrega necesitará.
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

    }

    return {
      tienda: "Wong",
      // ⛔ `null` a propósito, no por falta de implementación. El enlace que
      // había aquí —`/checkout/cart/add?sku&qty&seller`— llevaba a un error de
      // Wong o a un carrito vacío. Preferimos una función menos que una promesa
      // rota. El contrato mantiene el campo porque el día que exista una vía de
      // entrega autorizada, volverá a llenarse y la pantalla ya sabe usarlo.
      url: null,
      viajan,
      sequedan,
    };
  },
};
