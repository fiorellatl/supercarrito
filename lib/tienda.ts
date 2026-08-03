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

const BASE = "https://www.wong.pe";
const TIMEOUT_MS = 9000;

// El canal de venta de la tienda, el mismo que usa la entrega. Ver lib/entrega.ts.
const CANAL = "70";
const SELLER = "1";

export type Tienda = {
  id: string;
  nombre: string; // "Wong Óvalo Gutiérrez"
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
};

export type PreciosDeTienda = {
  tienda: string;
  lineas: PrecioEnTienda[];
  // El total tal y como lo calcula la tienda, no como lo calculamos nosotros.
  // Es la razón de ser de todo esto.
  total?: number;
};

export type LineaAValorar = { sku: string; unidades: number };

export interface CatalogoDeTienda {
  tiendas(): Promise<Tienda[]>;
  precios(lineas: LineaAValorar[], tienda: Tienda): Promise<PreciosDeTienda>;
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
let cache: { ts: number; tiendas: Tienda[] } | null = null;
const VIDA_CACHE_MS = 6 * 60 * 60 * 1000;

const limpiar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

export const wongTienda: CatalogoDeTienda = {
  async tiendas() {
    if (cache && Date.now() - cache.ts < VIDA_CACHE_MS) return cache.tiendas;

    const respuestas = await Promise.all(
      ANCLAS.map(async ([lon, lat]) => {
        try {
          const res = await fetch(
            `${BASE}/api/checkout/pub/pickup-points?geoCoordinates=${lon};${lat}&sc=${CANAL}`,
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
      // Nos quedamos con las entradas "Retiro en tienda X": son las que traen el
      // nombre escrito como lo escribiría una persona. La misma tienda aparece
      // también en MAYÚSCULAS por otra vía, y no queremos duplicados.
      if (!/^retiro en tienda/i.test(bruto) || !coords || coords.length < 2) continue;

      const nombre = bruto.replace(/^retiro en tienda\s+/i, "").trim();
      // Hoy el producto es de Wong. El directorio trae también los Metro de
      // Cencosud —comparten cuenta de VTEX—, y ese es exactamente el camino por
      // el que esta preferencia crecerá a otras cadenas. Pero no se enseña una
      // tienda que el producto todavía no sabe atender.
      if (!/^wong/i.test(nombre)) continue;

      const clave = limpiar(nombre);
      if (porNombre.has(clave)) continue;
      porNombre.set(clave, {
        id: p?.id ?? clave,
        nombre,
        distrito: p?.address?.neighborhood ?? undefined,
        lon: coords[0],
        lat: coords[1],
      });
    }

    const tiendas = [...porNombre.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es")
    );
    if (tiendas.length > 0) cache = { ts: Date.now(), tiendas };
    return tiendas;
  },

  async precios(lineas, tienda) {
    if (lineas.length === 0) return { tienda: tienda.nombre, lineas: [] };

    const res = await fetch(`${BASE}/api/checkout/pub/orderForms/simulation?sc=${CANAL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        items: lineas.map((l) => ({ id: l.sku, quantity: l.unidades, seller: SELLER })),
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

    return {
      tienda: tienda.nombre,
      // Un SKU que no vuelve en la respuesta no existe para esta tienda. Ausencia
      // es respuesta: se marca como no disponible, no como desconocido.
      lineas: lineas.map((l) => {
        const it = porSku.get(l.sku);
        return {
          sku: l.sku,
          precio: it?.price != null ? it.price / 100 : undefined,
          disponible: it?.availability === "available",
        };
      }),
      total: sumarTotales(d),
    };
  },
};

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
