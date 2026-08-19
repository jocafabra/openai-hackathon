import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MilesAI",
  description: "O especialista em pontos de todo pequeno agente de viagens.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

