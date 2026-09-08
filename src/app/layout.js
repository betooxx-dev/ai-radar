import "./globals.css";

export const metadata = {
  title: "AI Radar",
  description: "Señales verificables de inteligencia artificial para builders.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
