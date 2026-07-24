// Contrato del catálogo. Es lo ÚNICO que conoce el resto del sistema.
// FakeWong y WongVTEX devuelven exactamente esta forma. Cambiar de proveedor
// no cambia este tipo ni el código que lo consume.

export type ProductoWong = {
  ingrediente: string; // término buscado (contexto para la UI)
  encontrado: boolean;

  sku?: string;
  nombre?: string;
  marca?: string;
  imagen?: string;
  precio?: number; // en soles
  presentacion?: string; // "500 g", "1 kg", ...
  categoria?: string;
  disponible?: boolean;
  url?: string; // enlace al producto

  motivo?: string; // por qué no se encontró (debug / QA)
  proveedor?: "fake" | "wong"; // de dónde salió el dato (debug)
  degradado?: boolean; // true si Wong falló y se usó FakeWong de respaldo
};

// Función de un proveedor de catálogo. Misma firma para FakeWong y WongVTEX.
export type Proveedor = (ingrediente: string) => Promise<ProductoWong>;
