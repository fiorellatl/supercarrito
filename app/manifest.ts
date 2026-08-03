import type { MetadataRoute } from "next";

// Lo que convierte una URL en una aplicación en el teléfono.
//
// Sin esto, "añadir a la pantalla de inicio" guardaba un acceso directo con el
// icono genérico del navegador y abría una pestaña con barra de direcciones. Con
// esto se instala con su nombre, su icono y su papel — y arranca en pantalla
// completa, que es la diferencia entre "una web que uso" y "mi aplicación de la
// compra".
//
// `background_color` y `theme_color` son el papel, no el pino: lo primero que se
// ve al abrir tiene que ser la libreta, no una marca gritando.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SuperCarrito",
    short_name: "SuperCarrito",
    description:
      "Anota lo que falta en casa como te salga. Yo lo convierto en tu carrito de Wong, con los precios de tu tienda.",
    lang: "es-PE",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F5F3ED",
    theme_color: "#F5F3ED",
    categories: ["shopping", "food", "lifestyle"],
    icons: [
      { src: "/icono.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icono-recortable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
