import "@/app/ui/sistema.css";

export const metadata = {
  title: "SuperCarrito",
  description: "Anota lo que falta en casa. Yo lo convierto en tu compra.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5F3ED",
};

// Lo único global: el papel y la tipografía. Todo lo demás —keyframes, renglón,
// foco, scroll— vive en `app/ui/sistema.css`, una sola vez.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          background: "#F5F3ED",
          WebkitFontSmoothing: "antialiased",
          fontFamily:
            "ui-rounded, 'SF Pro Rounded', 'Segoe UI Variable Display', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
