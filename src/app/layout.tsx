import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader";
import "./globals.css";
import "./cockpit.css";

export const metadata: Metadata = {
  title: "MilesAI · Inteligência para cada viagem",
  description: "Cockpit premium de decisão para agentes de viagem: clientes, passagens, milhas e oportunidades em um único lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
