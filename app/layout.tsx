export const metadata = {
  title: "Noticias IA en el Deporte",
  description:
    "Busca noticias sobre IA en el deporte y exporta a Excel f?cilmente."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          color: "#0f172a",
          backgroundColor: "#f8fafc",
          margin: 0
        }}
      >
        {children}
      </body>
    </html>
  );
}

