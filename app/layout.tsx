import type { Metadata } from "next";
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

export const metadata: Metadata = {
  title: "AI Farm Copilot",
  description: "Asistentul tău inteligent pentru agricultură",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body>
        {children}
      </body>
    </html>
  );
}
