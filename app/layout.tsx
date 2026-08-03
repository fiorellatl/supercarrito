import type { Metadata, Viewport } from "next";
import "@/app/ui/sistema.css";

// Lo que el producto es FUERA de la aplicación: la pestaña, el icono, el enlace
// cuando alguien lo pega en un WhatsApp, y cómo se instala en el teléfono.
//
// Hasta hoy no había nada de esto. La consecuencia no era estética: una URL sin
// icono, sin nombre y sin previsualización no se comparte y no se guarda, y el
// producto no llegaba a existir fuera de la pestaña en la que estaba abierto.
//
// El icono, el manifiesto y la imagen del enlace se dibujan en `icon.svg`,
// `manifest.ts`, `apple-icon.tsx` y `opengraph-image.tsx`. Next los enlaza solo.

const DESCRIPCION =
  "Anota lo que falta en casa como te salga. Yo lo convierto en tu carrito de Wong, con los precios de tu tienda.";

export const metadata: Metadata = {
  metadataBase: new URL("https://supercarrito.netlify.app"),
  title: {
    default: "SuperCarrito",
    // Dentro de la aplicación la pestaña dice dónde estás. Con la aplicación
    // instalada no se ve; en el escritorio, con seis pestañas abiertas, sí.
    template: "%s · SuperCarrito",
  },
  description: DESCRIPCION,
  applicationName: "SuperCarrito",
  // No es una web que quiera tráfico: es la compra de una casa. No se indexa.
  robots: { index: false, follow: false },
  // Cómo se ve el enlace cuando alguien lo pega en un WhatsApp — que es
  // exactamente por donde va a llegar la primera familia. Sin esto salía la
  // caja gris con la URL cruda. La imagen se dibuja con `herramientas/marca.mjs`.
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "SuperCarrito",
    title: "SuperCarrito",
    description: DESCRIPCION,
    images: [
      {
        url: "/enlace.png",
        width: 1200,
        height: 630,
        alt: "SuperCarrito — anota lo que falta en casa como te salga",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SuperCarrito",
    description: DESCRIPCION,
    images: ["/enlace.png"],
  },
  icons: {
    icon: [{ url: "/icono.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icono-apple.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "SuperCarrito",
    // El papel también arriba: con la aplicación instalada, la barra de estado
    // tiene que ser la misma hoja, no una franja negra.
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // `cover` mete la aplicación debajo de la barra de gestos y del notch; quien
  // se aparta de ahí es el pie, con `env(safe-area-inset-*)`. Sin esto, en un
  // teléfono moderno queda una franja blanca del navegador y se nota que esto
  // es una web dentro de una web.
  viewportFit: "cover",
  themeColor: "#F5F3ED",
  // Se puede ampliar. Una lista de la compra la lee mucha gente que necesita
  // acercarla, y bloquear el zoom por estética es dejarla fuera.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
