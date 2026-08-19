import type { Metadata } from "next";
import "./globals.css";
import "./cockpit.css";

export const metadata: Metadata = {
  title: "MilesAI · Cockpit do agente",
  description: "Clientes, viagens, ofertas e oportunidades em um cockpit de decisão para pequenas agências.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
