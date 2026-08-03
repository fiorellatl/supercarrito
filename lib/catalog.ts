// Contrato del catálogo. Es lo ÚNICO que conoce el resto del sistema.
// FakeWong y WongVTEX devuelven exactamente esta forma. Cambiar de proveedor
// no cambia este tipo ni el código que lo consume.

// Cómo se vende el producto. Es lo que decide si un monto se puede explicar
// solo ("1 × S/ 12.90") o necesita una cantidad ("0,25 kg × S/ 49.90/kg").
export type UnidadVenta = "kg" | "un";

export type ProductoWong = {
  ingrediente: string; // término buscado (contexto para la UI)
  encontrado: boolean;

  sku?: string;
  nombre?: string;
  marca?: string;
  imagen?: string;

  // ⚠️ `precio` es el precio POR UNIDAD DE VENTA, no el precio de "una pieza".
  // Para un producto por peso es el precio del KILO. Confundir ambas cosas fue
  // un error real: mostrábamos "0.1 kg — S/ 49.90" cuando S/ 49.90 es el kilo.
  precio?: number; // soles por `unidadVenta`
  unidadVenta?: UnidadVenta; // "kg" = se vende al peso · "un" = por pieza
  cantidadMinima?: number; // mínimo (y paso) de compra, en `unidadVenta`

  presentacion?: string; // "500 g", "Pack x6"… solo para productos envasados
  categoria?: string; // hoja legible: "Arroz Extra y Superior"

  // Ruta completa tal como la clasifica la tienda: "Abarrotes/Arroz/Arroz Extra
  // y Superior". No es para pintarla: es la única señal barata que distingue un
  // arroz de un *combo de pollo con arroz chaufa*, y la tienda ya nos la da.
  // Opcional a propósito: un proveedor que no clasifique sigue siendo válido.
  categoriaRuta?: string;
  disponible?: boolean;
  url?: string; // enlace al producto

  motivo?: string; // por qué no se encontró (debug / QA)
  proveedor?: "fake" | "wong"; // de dónde salió el dato (debug)
  degradado?: boolean; // true si Wong falló y se usó FakeWong de respaldo

  // Ciclo 5: los otros candidatos del catálogo para el MISMO ingrediente.
  // Son la materia prima de la corrección ("esta no, quiero otra") y, por tanto,
  // de todo el aprendizaje. Nunca anidan: los candidatos no traen candidatos.
  alternativas?: ProductoWong[];
};

// Función de un proveedor de catálogo. Misma firma para FakeWong y WongVTEX.
export type Proveedor = (ingrediente: string) => Promise<ProductoWong>;
