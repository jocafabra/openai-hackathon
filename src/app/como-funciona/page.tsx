import type { Metadata } from "next";

import HowItWorksPage from "@/components/HowItWorksPage";

export const metadata: Metadata = {
  title: "Como funciona · MilesAI",
  description:
    "Entenda como o MilesAI ajuda agentes de viagem a cadastrar clientes, comparar dinheiro e milhas, monitorar oportunidades e agir com segurança.",
};

export default function ComoFuncionaPage() {
  return <HowItWorksPage />;
}
