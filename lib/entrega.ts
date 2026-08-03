// Entrega: el último metro del producto. SuperCarrito no cobra ni compra —
// prepara la mejor compra posible y la ENTREGA a la tienda, donde la familia
// paga con su propia cuenta. El dinero y las credenciales nunca pasan por aquí.
//
// 🧱 Contrato, como todo proveedor externo (regla permanente de arquitectura):
// el producto no conoce a Wong, conoce `EntregaEnTienda`. Cambiar de tienda es
// escribir otra implementación.
//
// 🔑 TODO DEPENDE DEL CANAL DE VENTA, y es lo único que hay que entender aquí.
// Estuvimos dos sprints creyendo que Wong no dejaba entregar carritos desde
// fuera. Sí deja. Probábamos los canales 1 y 2, y su tienda opera en el **70**.
//
//   · `sc=1`  -> 401 «Seller no autorizado 1 con la política comercial 1».
//   · `sc=2`  -> 200 (y también un 302 en el enlace) sin añadir NADA: el
//     catálogo de ese canal no contiene los SKUs de la tienda.
//   · SIN `sc` -> 500.
//   · **`sc=70` -> el carrito se llena de verdad.**
//
// Verificado el 2026-08-03 leyendo el carrito, con 35 productos en un solo
// enlace y con productos al peso. Detalle en
// design/arquitecturas-ultima-milla.md.
//
// LA LECCIÓN, que vale más que el código: ni un 302 ni un 200 son prueba de
// nada —un SKU inexistente también devuelve 302, y `sc=2` respondía 200
// añadiendo cero—. **La única prueba de una entrega es leer el carrito.** Si
// alguien vuelve a tocar este archivo: no des por buena una respuesta; abre el
// carrito y cuenta los productos.

import type { ProductoWong, UnidadVenta } from "@/lib/catalog";

const BASE = "https://www.wong.pe";

// El canal de venta de la tienda. NO es un número mágico: Wong lo publica en
// `GET https://www.wong.pe/api/segments` -> `{"channel":"70", …}`. Si algún día
// el enlace deja de llenar el carrito, ese endpoint es lo primero que hay que
// mirar; leerlo en caliente en vez de fijarlo aquí es una mejora pendiente.
//
// Coherencia que conviene no romper: `lib/wongvtex.ts` busca SIN `sc`, y el
// valor por defecto de la tienda es justamente 70. Los SKUs que guardamos son,
// por tanto, los del mismo canal en el que escribimos.
const CANAL = "70";

// `seller=1` es correcto: la API de catálogo devuelve `sellerId: "1"`,
// `sellerName: "WongIO"`. Nunca fue el problema.
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

      // `qty` en el idioma de la tienda: cuántas unidades mínimas de venta. Hoy
      // no sale de aquí, pero es la traducción que cualquier entrega necesitará.
      const qty = unidadesDeVenta(cantidad, producto);
      const cruza = Math.round(qty * pasoDe(producto) * 1000) / 1000;

      partes.push(`sku=${producto.sku}&qty=${qty}&seller=${SELLER}`);

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
      // Sin nada que entregar no hay enlace: mandar a la familia a un carrito
      // vacío sería peor que no mandarla.
      //
      // Comportamiento comprobado del enlace con `sc=70`:
      //   · AÑADE a lo que la familia ya tuviera en el carrito, sin borrarlo.
      //   · Repetirlo no duplica líneas.
      //   · Sobre un producto que ya estaba, **se queda con la cantidad mayor y
      //     nunca la baja**: 4 en el carrito + un enlace que pide 6 -> 6; luego
      //     un enlace que pide 2 -> sigue en 6. Ojo: eso significa que el total
      //     que enseñamos aquí puede quedarse corto si la familia ya tenía más
      //     de ese producto. No es un fallo del enlace, es una diferencia que
      //     habrá que saber contar.
      //   · Un SKU que ya no exista se ignora sin arrastrar a los demás.
      //   · Cabe una compra semanal entera: 35 productos son ~1 000 caracteres,
      //     muy por debajo del límite práctico de una URL.
      //
      // `qcart=1` es la puerta que Wong deja abierta para el móvil. Su
      // `apple-app-site-association` **excluye** de la app cualquier URL con ese
      // parámetro, así que en iPhone el enlace abre Safari en vez de la app —que
      // se come los parámetros y deja el carrito vacío, comprobado con una
      // cuenta real el 2026-08-03—. En escritorio y en Android no cambia nada:
      // medido, mismo 302 y los mismos ítems dentro. Cuesta nueve caracteres.
      url:
        partes.length > 0
          ? `${BASE}/checkout/cart/add?${partes.join("&")}&sc=${CANAL}&qcart=1`
          : null,
      viajan,
      sequedan,
    };
  },
};
