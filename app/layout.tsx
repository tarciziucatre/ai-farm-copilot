import type { Metadata } from "next";

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
