import type { Metadata } from "next";
import "./globals.css"; // Dacă nu ai un fișier globals.css, Next.js îl va ignora sau îl poți crea ulterior.

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
