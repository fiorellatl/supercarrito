export const metadata = {
  title: "Super Carrito",
  description: "Compra tu menú con un mensaje",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#f4f4f5",
        }}
      >
        {children}
      </body>
    </html>
  );
}
