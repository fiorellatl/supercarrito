// La tienda de la familia. NO es una integración con Wong: es una preferencia de
// compra, del mismo tipo que "compro Gloria" o "el arroz de 5 kg". Por eso vive
// en el perfil (lib/preferencias.ts) y no en una sesión ni en un token.
//
// 🧱 Contrato, como todo proveedor externo: el producto no conoce a Wong,
// conoce `CatalogoDeTienda`. El día que la preferencia diga "Plaza Vea
// Primavera", cambia la implementación y no el modelo mental de nadie.
//
// POR QUÉ EXISTE ESTE ARCHIVO, medido el 2026-08-03 contra wong.pe: el catálogo
// público NO tiene tienda. Devuelve `AvailableQuantity: 100` para todo y un
// precio único. La realidad es otra: la misma trucha cuesta S/ 30.50 en
// Miraflores, S/ 33.90 en San Isidro y NO EXISTE en Los Olivos. De una compra
// semanal de 35 productos, 12 no estaban en una zona real de Lima. Los
// enseñábamos todos, con precio, sumados al total.
//
// La pieza que lo arregla es `orderForms/simulation`, que es la que Wong usa
// para calcular su propio carrito. Con ella dejamos de CALCULAR el total y
// pasamos a PREGUNTARLO. Un total que calculamos nosotros puede desviarse de lo
// que cobra la tienda; uno que nos da la tienda, no.

import { cadenaDe, type Cadena, type CadenaId } from "@/lib/cadenas";
import { preciosConTarjeta, teasersDeCatalogo, type ConTarjeta, type Teaser } from "@/lib/tarjetas";

const TIMEOUT_MS = 9000;

// Dirección, canal de venta y seller salen de la cadena (lib/cadenas.ts): son
// los mismos que usa la entrega. Ver lib/entrega.ts.

export type Tienda = {
  id: string;
  nombre: string; // "Wong Óvalo Gutiérrez"
  // Opcional: una tienda guardada antes de que hubiera cadenas es de Wong.
  cadena?: CadenaId;
  distrito?: string;
  lon: number;
  lat: number;
};

// Lo que la tienda dice de un producto concreto. `disponible: false` no es un
// error: es una respuesta, y de las importantes.
export type PrecioEnTienda = {
  sku: string;
  precio?: number; // soles por unidad de venta (kg o pieza)
  disponible: boolean;
  // Precio con tarjeta sobre el precio de ESTA tienda. Ausente = no se pudo
  // preguntar (se conserva lo que ya sabíamos); [] = hoy no hay.
  conTarjeta?: ConTarjeta[];
};

export type PreciosDeTienda = {
  tienda: string;
  lineas: PrecioEnTienda[];
  // El total tal y como lo calcula la tienda, no como lo calculamos nosotros.
  // Es la razón de ser de todo esto.
  total?: number;
};

export type LineaAValorar = { sku: string; unidades: number };

// Lo que la tienda cobraría por llevar la compra a un lugar. Es SU tarifa, tal
// cual la devuelve: no la calculamos ni la estimamos. `hay: false` también es
// una respuesta: la tienda no hace despacho a esa zona.
export type EnvioDeTienda = {
  hay: boolean;
  precio?: number; // soles, la franja más barata
  precioMaximo?: number; // si otras franjas cuestan más
  desde?: string; // ISO, inicio de la primera franja a ese precio
  hasta?: string; // ISO
};

export type Lugar = { lon: number; lat: number };

export interface CatalogoDeTienda {
  tiendas(): Promise<Tienda[]>;
  precios(lineas: LineaAValorar[], tienda: Tienda): Promise<PreciosDeTienda>;
  envio(lineas: LineaAValorar[], lugar: Lugar): Promise<EnvioDeTienda>;
}

// --- Implementación Wong ------------------------------------------------------

// Puntos desde los que preguntamos por tiendas. NO son la ubicación de nadie: la
// API de puntos de retiro solo sabe responder "las 30 más cercanas a aquí", así
// que barremos el país con anclas fijas y unimos. La familia elige de la lista;
// nunca inferimos dónde está.
const ANCLAS: [number, number][] = [
  [-77.0428, -12.0464], // Lima centro
  [-77.0300, -12.1200], // Miraflores
  [-76.9900, -12.1450], // Surco
  [-77.0700, -11.9700], // Los Olivos
  [-77.1200, -12.0500], // Callao
  [-76.9200, -12.0300], // Ate
  [-77.0200, -12.1800], // Chorrillos
  [-76.9950, -11.9800], // San Juan de Lurigancho
  [-76.9500, -12.0800], // La Molina
  [-76.7000, -11.9400], // Chosica
  [-76.5300, -12.7900], // Asia
];

type PuntoVtex = {
  pickupPoint?: {
    id?: string;
    friendlyName?: string;
    address?: { neighborhood?: string; city?: string; geoCoordinates?: number[] };
  };
};

// El directorio cambia como mucho cuando abre una tienda: no tiene sentido
// pedirlo en cada compra. Doce llamadas cacheadas seis horas.
const cache = new Map<CadenaId, { ts: number; tiendas: Tienda[] }>();
const VIDA_CACHE_MS = 6 * 60 * 60 * 1000;

const limpiar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

// Las promociones de cada SKU, del catálogo público (de 50 en 50).
async function teasersPorSku(base: string, skus: string[]) {
  const porSku = new Map<string, Teaser[]>();
  type Oferta = { PromotionTeasers?: Parameters<typeof teasersDeCatalogo>[0] };
  for (let i = 0; i < skus.length; i += 50) {
    const fq = skus.slice(i, i + 50).map((s) => `fq=skuId:${encodeURIComponent(s)}`).join("&");
    const res = await fetch(`${base}/api/catalog_system/pub/products/search?${fq}&_from=0&_to=49`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`catálogo ${res.status}`);
    const productos = (await res.json()) as {
      items?: { itemId?: string; sellers?: { commertialOffer?: Oferta }[] }[];
    }[];
    for (const p of productos)
      for (const it of p.items ?? [])
        if (it.itemId)
          porSku.set(it.itemId, teasersDeCatalogo(it.sellers?.[0]?.commertialOffer?.PromotionTeasers));
  }
  return porSku;
}

export function catalogoDeTienda(cadena: Cadena): CatalogoDeTienda {
  const { base, canal, seller } = cadena;
  return {
  async tiendas() {
    const guardado = cache.get(cadena.id);
    if (guardado && Date.now() - guardado.ts < VIDA_CACHE_MS) return guardado.tiendas;

    const respuestas = await Promise.all(
      ANCLAS.map(async ([lon, lat]) => {
        try {
          const res = await fetch(
            `${base}/api/checkout/pub/pickup-points?geoCoordinates=${lon};${lat}&sc=${canal}`,
            { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS) }
          );
          if (!res.ok) return [];
          const d = await res.json();
          return (d?.items ?? d ?? []) as PuntoVtex[];
        } catch {
          return []; // un ancla caída no puede tumbar el directorio entero
        }
      })
    );

    const porNombre = new Map<string, Tienda>();
    for (const punto of respuestas.flat()) {
      const p = punto.pickupPoint;
      const bruto = p?.friendlyName ?? "";
      const coords = p?.address?.geoCoordinates;
      // Cada cadena dice cuáles de estas entradas son sus tiendas y cómo se
      // llaman (lib/cadenas.ts). El directorio de Wong trae también los Metro,
      // y una tienda se atiende con el catálogo, los precios y el carrito de SU
      // cadena, nunca con los de otra.
      const nombre = bruto.match(cadena.puntoDeRetiro)?.[1]?.trim();
      if (!nombre || !coords || coords.length < 2) continue;
      // La misma tienda llega también en MAYÚSCULAS por otra vía: fuera.
      if (nombre === nombre.toUpperCase()) continue;

      const clave = limpiar(nombre);
      if (porNombre.has(clave)) continue;
      porNombre.set(clave, {
        id: p?.id ?? clave,
        nombre,
        cadena: cadena.id,
        distrito: p?.address?.neighborhood ?? undefined,
        lon: coords[0],
        lat: coords[1],
      });
    }

    const tiendas = [...porNombre.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es")
    );
    if (tiendas.length > 0) cache.set(cadena.id, { ts: Date.now(), tiendas });
    return tiendas;
  },

  async precios(lineas, tienda) {
    if (lineas.length === 0) return { tienda: tienda.nombre, lineas: [] };
    // La simulación trae las promociones de tarjeta, pero sin decir de qué
    // producto son. El catálogo sí las da por producto: se le pregunta a la vez,
    // y si no contesta, el precio de siempre sigue valiendo.
    const promos = teasersPorSku(base, lineas.map((l) => l.sku)).catch(() => undefined);

    const res = await fetch(`${base}/api/checkout/pub/orderForms/simulation?sc=${canal}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        items: lineas.map((l) => ({ id: l.sku, quantity: l.unidades, seller })),
        country: "PER",
        // Las coordenadas son el único dato que resuelve la zona. Medido: el
        // código postal NO sirve en esta cuenta —devuelve todo sin stock—, que
        // es justo lo único que daría una geolocalización por IP.
        geoCoordinates: [tienda.lon, tienda.lat],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // Igual que el catálogo: un fallo de transporte LANZA y quien llama degrada.
    if (!res.ok) throw new Error(`simulation ${res.status}`);
    const d = await res.json();

    const porSku = new Map<string, { price?: number; availability?: string }>();
    for (const it of d?.items ?? []) porSku.set(String(it.id), it);
    const teasers = await promos;

    return {
      tienda: tienda.nombre,
      // Un SKU que no vuelve en la respuesta no existe para esta tienda. Ausencia
      // es respuesta: se marca como no disponible, no como desconocido.
      lineas: lineas.map((l) => {
        const it = porSku.get(l.sku);
        const precio = it?.price != null ? it.price / 100 : undefined;
        return {
          sku: l.sku,
          precio,
          disponible: it?.availability === "available",
          conTarjeta:
            teasers && precio ? preciosConTarjeta(teasers.get(l.sku) ?? [], precio) : teasers ? [] : undefined,
        };
      }),
      total: sumarTotales(d),
    };
  },

  // Medido el 2026-11-27 contra wong.pe: el precio del despacho NO viene en
  // `sla.price` (sale 0) sino en cada franja horaria de
  // `availableDeliveryWindows[].price`. Para Miraflores, «Despacho a domicilio»
  // a S/ 9.90 y el retiro en tienda gratis. La dirección se da como
  // coordenadas: el código postal no sirve en esta cuenta (ver `precios`).
  async envio(lineas, lugar) {
    if (lineas.length === 0) return { hay: false };
    const res = await fetch(`${base}/api/checkout/pub/orderForms/simulation?sc=${canal}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        items: lineas.map((l) => ({ id: l.sku, quantity: l.unidades, seller })),
        country: "PER",
        geoCoordinates: [lugar.lon, lugar.lat],
        shippingData: {
          address: { addressType: "residential", country: "PER", geoCoordinates: [lugar.lon, lugar.lat] },
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`simulation ${res.status}`);
    return leerEnvio(await res.json());
  },
  };
}

type FranjaVtex = { startDateUtc?: string; endDateUtc?: string; price?: number };
type SlaVtex = { deliveryChannel?: string; price?: number; availableDeliveryWindows?: FranjaVtex[] };

function leerEnvio(d: unknown): EnvioDeTienda {
  const info = (d as { logisticsInfo?: { slas?: SlaVtex[] }[] })?.logisticsInfo ?? [];
  const franjas: { precio: number; desde?: string; hasta?: string }[] = [];
  for (const li of info) {
    for (const sla of li.slas ?? []) {
      if (sla.deliveryChannel !== "delivery") continue;
      const ventanas = sla.availableDeliveryWindows ?? [];
      if (ventanas.length === 0 && typeof sla.price === "number") {
        franjas.push({ precio: sla.price });
      }
      for (const v of ventanas) {
        if (typeof v.price === "number") {
          franjas.push({ precio: v.price, desde: v.startDateUtc, hasta: v.endDateUtc });
        }
      }
    }
  }
  if (franjas.length === 0) return { hay: false };
  const min = Math.min(...franjas.map((f) => f.precio));
  const max = Math.max(...franjas.map((f) => f.precio));
  const primera = franjas
    .filter((f) => f.precio === min && f.desde)
    .sort((a, b) => (a.desde! < b.desde! ? -1 : 1))[0];
  return {
    hay: true,
    precio: min / 100,
    precioMaximo: max > min ? max / 100 : undefined,
    desde: primera?.desde,
    hasta: primera?.hasta,
  };
}

// La tienda de una cadena, por su id. Lo que no se reconoce es Wong.
export function catalogoDeLaTienda(tienda?: Pick<Tienda, "cadena">): CatalogoDeTienda {
  return catalogoDeTienda(cadenaDe(tienda?.cadena));
}

// VTEX devuelve el total desglosado ("Items", "Discounts", "Shipping"…). Nos
// quedamos con los conceptos de producto: el envío no es parte de la compra que
// preparamos y sumarlo aquí sería otro monto inexplicable.
function sumarTotales(d: unknown): number | undefined {
  const totals = (d as { totals?: { id?: string; value?: number }[] })?.totals;
  if (!Array.isArray(totals)) return undefined;
  const suma = totals
    .filter((t) => t.id === "Items" || t.id === "Discounts")
    .reduce((s, t) => s + (t.value ?? 0), 0);
  return Number.isFinite(suma) ? Math.round(suma) / 100 : undefined;
}
