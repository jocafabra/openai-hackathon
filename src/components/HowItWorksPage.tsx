import Link from "next/link";
import Image from "next/image";

import styles from "@/app/como-funciona/how-it-works.module.css";

const journey = [
  {
    number: "01",
    title: "Cadastre o cliente",
    description: "Guarde contato, preferências e contexto da viagem em um único atendimento.",
    detail: "Você começa com o essencial. Nenhuma planilha paralela é necessária.",
    icon: "person",
  },
  {
    number: "02",
    title: "Monte a carteira",
    description: "Informe os programas, saldos e o valor de referência de cada milheiro.",
    detail: "Esse valor transforma pontos em custo econômico comparável.",
    icon: "wallet",
  },
  {
    number: "03",
    title: "Descreva a viagem",
    description: "Defina origem, destino, datas, passageiros, orçamento e tolerância a conexões.",
    detail: "Quanto melhor o contexto, mais útil fica a recomendação.",
    icon: "pin",
  },
  {
    number: "04",
    title: "Pesquise opções",
    description: "Consulte passagens em dinheiro e combine os resultados com a carteira do cliente.",
    detail: "Cada informação exibe a origem e o momento da consulta.",
    icon: "search",
  },
  {
    number: "05",
    title: "Compare de verdade",
    description: "Veja desembolso, custo econômico, economia e elegibilidade lado a lado.",
    detail: "A opção com menos pontos nem sempre é a mais vantajosa.",
    icon: "compare",
  },
  {
    number: "06",
    title: "Monitore mudanças",
    description: "Acompanhe promoções, bônus e variações que podem alterar a estratégia.",
    detail: "O radar destaca o que merece atenção, sem decidir sozinho.",
    icon: "radar",
  },
  {
    number: "07",
    title: "Aja com segurança",
    description: "Revise a recomendação, confirme os dados e execute a ação fora da plataforma.",
    detail: "A decisão e a emissão continuam sob responsabilidade do agente.",
    icon: "check",
  },
] as const;

const glossary = [
  {
    term: "Cash",
    plain: "O preço da passagem pago integralmente em dinheiro.",
    example: "Ex.: R$ 2.480 no cartão.",
  },
  {
    term: "Pontos",
    plain: "Moeda acumulada em bancos, cartões ou programas de fidelidade.",
    example: "Ex.: 84.000 pontos Livelo.",
  },
  {
    term: "Milhas",
    plain: "Pontos usados por programas de companhias aéreas para emitir viagens.",
    example: "Ex.: 32.000 milhas Smiles.",
  },
  {
    term: "Milheiro",
    plain: "Um bloco de mil pontos ou milhas. É a unidade usada para estimar valor.",
    example: "Ex.: R$ 20 por 1.000 pontos.",
  },
  {
    term: "Award",
    plain: "Passagem emitida com pontos ou milhas, normalmente acrescida de taxas.",
    example: "Ex.: 28.000 milhas + R$ 96.",
  },
  {
    term: "Custo econômico",
    plain: "Soma do valor estimado das milhas usadas com as taxas pagas em dinheiro.",
    example: "28 mil × R$ 20/mil + R$ 96 = R$ 656.",
  },
] as const;

const faqs = [
  {
    question: "O MilesAI compra ou emite a passagem por mim?",
    answer:
      "Não. Ele organiza informações, compara cenários e recomenda o próximo passo. A conferência final, a emissão e qualquer pagamento são feitos pelo agente nos canais oficiais.",
  },
  {
    question: "A menor quantidade de milhas é sempre a melhor opção?",
    answer:
      "Não. Uma emissão pode usar poucas milhas caras, cobrar taxas altas ou comprometer um saldo estratégico. O custo econômico permite comparar alternativas em uma mesma base.",
  },
  {
    question: "De onde vêm preços, saldos e promoções?",
    answer:
      "Cada dado recebe uma etiqueta de origem: ao vivo, manual ou simulado. Saldos e valores de referência normalmente são cadastrados pelo agente; pesquisas podem vir de uma integração ou do modo demonstrativo.",
  },
  {
    question: "Preciso ter uma chave da OpenAI para usar?",
    answer:
      "Não. O MVP possui um motor determinístico que continua funcionando sem chave. Quando a IA está configurada, ela ajuda a redigir e explicar a recomendação, sem substituir as regras de cálculo.",
  },
  {
    question: "Por que preciso informar o preço do milheiro?",
    answer:
      "Porque pontos não são gratuitos: eles têm valor e poderiam ser usados em outra oportunidade. O preço de referência traduz esse saldo para reais e torna a comparação honesta.",
  },
  {
    question: "Posso confiar na recomendação sem conferir?",
    answer:
      "Não. Tarifas, disponibilidade e regras podem mudar rapidamente. Use o MilesAI como copiloto: valide valores e condições nos canais oficiais antes de prometer ou emitir.",
  },
] as const;

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? styles.brandMarkCompact : styles.brandMark} aria-hidden="true">
      <Image src="/brand/milesai-mark-light.png" width={48} height={48} alt="" priority />
    </span>
  );
}

function JourneyIcon({ name }: { name: (typeof journey)[number]["icon"] }) {
  const paths: Record<typeof name, React.ReactNode> = {
    person: <><circle cx="12" cy="8" r="3"/><path d="M5.5 20c.5-4.3 2.7-6.5 6.5-6.5s6 2.2 6.5 6.5"/></>,
    wallet: <><path d="M3.5 7.5h17v12h-17z"/><path d="M4.5 7.5V5h13v2.5M15 12h5.5v4H15z"/></>,
    pin: <><path d="M18 10c0 5-6 10-6 10S6 15 6 10a6 6 0 1 1 12 0Z"/><circle cx="12" cy="10" r="2"/></>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,
    compare: <><path d="M4 7h15M15 3l4 4-4 4M20 17H5M9 13l-4 4 4 4"/></>,
    radar: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 12 18 6"/></>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m7.5 12 3 3 6-7"/></>,
  };

  return (
    <svg className={styles.journeyIcon} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function DataBadge({ type }: { type: "mock" | "live" | "manual" }) {
  const labels = { mock: "Simulado", live: "Ao vivo", manual: "Manual" } as const;
  return (
    <span className={`${styles.dataBadge} ${styles[`dataBadge${type}`]}`}>
      <i aria-hidden="true" />
      {labels[type]}
    </span>
  );
}

export default function HowItWorksPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="MilesAI — voltar ao cockpit">
          <BrandMark compact />
          <span>MilesAI</span>
        </Link>
        <nav className={styles.nav} aria-label="Navegação da página">
          <a href="#fluxo">Fluxo</a>
          <a href="#tour">Tour visual</a>
          <a href="#glossario">Glossário</a>
          <a href="#faq">Dúvidas</a>
        </nav>
        <Link className={styles.headerCta} href="/">
          Abrir cockpit <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Seu copiloto de decisão</span>
          <h1>De uma conversa solta a uma viagem bem decidida.</h1>
          <p>
            O MilesAI organiza o contexto do cliente, coloca dinheiro e milhas na mesma conta e mostra
            o próximo passo com clareza. Você continua no comando do atendimento.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryCta} href="#fluxo">
              Entender em 3 minutos <span aria-hidden="true">↓</span>
            </a>
            <Link className={styles.secondaryCta} href="/">
              Ir direto ao cockpit
            </Link>
          </div>
          <div className={styles.heroTrust} aria-label="Características do produto">
            <span><b>7</b> etapas simples</span>
            <i aria-hidden="true" />
            <span><b>1</b> visão do cliente</span>
            <i aria-hidden="true" />
            <span><b>100%</b> decisão humana</span>
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="Exemplo ilustrativo de recomendação do MilesAI">
          <div className={styles.visualTopline}>
            <span>Recomendação preparada</span>
            <DataBadge type="mock" />
          </div>
          <div className={styles.visualRoute}>
            <div><b>GRU</b><span>São Paulo</span></div>
            <span className={styles.routeLine}><i />✦<i /></span>
            <div><b>LIS</b><span>Lisboa</span></div>
          </div>
          <div className={styles.visualDecision}>
            <span>Melhor equilíbrio agora</span>
            <strong>Usar milhas</strong>
            <p>Economia econômica estimada de <b>R$ 1.824</b>, mantendo reserva para a volta.</p>
          </div>
          <div className={styles.visualMetrics}>
            <div><span>Em dinheiro</span><b>R$ 4.280</b></div>
            <div><span>Custo econômico</span><b>R$ 2.456</b></div>
            <div><span>Confiança</span><b>Alta</b></div>
          </div>
          <p className={styles.visualFootnote}>Exemplo didático com valores simulados.</p>
        </div>
      </section>

      <section className={styles.promise} aria-label="Resumo da proposta">
        <p>O MilesAI não é uma agência automática.</p>
        <h2>Ele é a mesa de decisão do agente de viagens.</h2>
        <span>Menos abas. Menos conta de cabeça. Mais segurança para orientar cada cliente.</span>
      </section>

      <section className={styles.section} id="fluxo">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>O fluxo completo</span>
            <h2>Uma jornada clara, do cadastro à ação.</h2>
          </div>
          <p>Cada etapa prepara a próxima. Você pode voltar, ajustar informações e recalcular quando o cenário mudar.</p>
        </div>

        <ol className={styles.journey}>
          {journey.map((step, index) => (
            <li className={styles.journeyStep} key={step.number}>
              <div className={styles.journeyRail} aria-hidden="true">
                <span>{step.number}</span>
                {index < journey.length - 1 && <i />}
              </div>
              <div className={styles.journeyCard}>
                <span className={styles.journeyIconWrap}><JourneyIcon name={step.icon} /></span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <small>{step.detail}</small>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${styles.section} ${styles.tourSection}`} id="tour">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Tour guiado visual</span>
            <h2>Veja o raciocínio acontecer.</h2>
          </div>
          <p>Este tour é ilustrativo. Os valores abaixo são simulados para explicar o produto sem alterar nenhum atendimento.</p>
        </div>

        <div className={styles.tourTimeline}>
          <article className={styles.tourScene}>
            <div className={styles.sceneLabel}><b>1</b><span>Entenda o contexto</span></div>
            <div className={styles.sceneWindow}>
              <div className={styles.windowBar}><i/><i/><i/><span>Novo atendimento</span></div>
              <div className={styles.clientMini}>
                <span className={styles.avatar}>AM</span>
                <div><b>Ana Martins</b><small>Férias em casal</small></div>
              </div>
              <div className={styles.formGrid}>
                <span><small>Origem</small><b>São Paulo</b></span>
                <span><small>Destino</small><b>Lisboa</b></span>
                <span><small>Orçamento</small><b>R$ 5.000</b></span>
                <span><small>Passageiros</small><b>2 adultos</b></span>
              </div>
            </div>
            <p>Cliente, viagem e preferências ficam conectados no mesmo caso.</p>
          </article>

          <article className={styles.tourScene}>
            <div className={styles.sceneLabel}><b>2</b><span>Traduza pontos em reais</span></div>
            <div className={styles.sceneWindow}>
              <div className={styles.windowBar}><i/><i/><i/><span>Carteira de fidelidade</span></div>
              <div className={styles.walletMini}>
                <div><span>Programa</span><b>Livelo</b></div>
                <div><span>Saldo</span><b>92.000 pts</b></div>
                <div className={styles.walletHighlight}><span>Valor do milheiro</span><b>R$ 20,00</b></div>
              </div>
              <div className={styles.formula}>
                <span>40.000 pontos</span><i>×</i><span>R$ 20 / mil</span><i>+</i><span>R$ 92 taxas</span><b>= R$ 892</b>
              </div>
            </div>
            <p>O custo econômico evita tratar pontos como se não tivessem valor.</p>
          </article>

          <article className={styles.tourScene}>
            <div className={styles.sceneLabel}><b>3</b><span>Compare e decida</span></div>
            <div className={styles.sceneWindow}>
              <div className={styles.windowBar}><i/><i/><i/><span>Laboratório de cenários</span></div>
              <div className={styles.compareMini}>
                <div><span>Dinheiro</span><b>R$ 2.716</b><small>Maior desembolso</small></div>
                <div className={styles.recommended}><em>Recomendado</em><span>Milhas + taxas</span><b>R$ 1.504</b><small>Economia de R$ 1.212</small></div>
              </div>
              <div className={styles.humanCheck}><span>✓</span><p><b>Revisão humana necessária</b>Confirme tarifa e disponibilidade antes de emitir.</p></div>
            </div>
            <p>O MilesAI explica o porquê. O agente confere e escolhe a ação.</p>
          </article>
        </div>
      </section>

      <section className={styles.section} id="dados">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Transparência por padrão</span>
            <h2>Saiba de onde veio cada número.</h2>
          </div>
          <p>As etiquetas evitam misturar uma consulta real com um valor informado pela equipe ou com dados de demonstração.</p>
        </div>

        <div className={styles.dataCards}>
          <article>
            <DataBadge type="live" />
            <h3>Dado ao vivo</h3>
            <p>Veio de uma integração ativa e possui horário de consulta. Pode mudar depois da pesquisa.</p>
            <small>Ex.: tarifa retornada pelo hub de voos.</small>
          </article>
          <article>
            <DataBadge type="manual" />
            <h3>Dado manual</h3>
            <p>Foi informado pelo agente e deve ser atualizado quando o cliente enviar um novo saldo ou referência.</p>
            <small>Ex.: saldo e preço do milheiro.</small>
          </article>
          <article>
            <DataBadge type="mock" />
            <h3>Dado simulado</h3>
            <p>É gerado para testar o fluxo quando uma integração não está configurada. Nunca é escondido.</p>
            <small>Ex.: ofertas determinísticas da demo.</small>
          </article>
        </div>
      </section>

      <section className={`${styles.section} ${styles.glossarySection}`} id="glossario">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Glossário sem enrolação</span>
            <h2>Seis conceitos para decidir melhor.</h2>
          </div>
          <p>O vocabulário do produto é explicado em linguagem simples, com um exemplo prático para cada termo.</p>
        </div>
        <dl className={styles.glossary}>
          {glossary.map((item, index) => (
            <div key={item.term}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <dt>{item.term}</dt>
              <dd>{item.plain}<small>{item.example}</small></dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.guardrailSection}>
        <div className={styles.guardrailIntro}>
          <span className={styles.eyebrow}>Copiloto, não piloto automático</span>
          <h2>O que o MilesAI faz — e onde ele para.</h2>
          <p>Velocidade sem transparência cria risco. Por isso, o MVP deixa os limites explícitos.</p>
        </div>
        <div className={styles.guardrails}>
          <article className={styles.doesCard}>
            <span>O produto ajuda a</span>
            <ul>
              <li><i>✓</i>Centralizar dados do atendimento</li>
              <li><i>✓</i>Calcular e comparar cenários</li>
              <li><i>✓</i>Explicar vantagens e restrições</li>
              <li><i>✓</i>Sinalizar promoções relevantes</li>
              <li><i>✓</i>Registrar fontes e atualizações</li>
            </ul>
          </article>
          <article className={styles.doesNotCard}>
            <span>O produto não</span>
            <ul>
              <li><i>—</i>Garante preço ou disponibilidade</li>
              <li><i>—</i>Compra, transfere ou emite sozinho</li>
              <li><i>—</i>Substitui regras dos programas</li>
              <li><i>—</i>Promete economia futura</li>
              <li><i>—</i>Dispensa a conferência do agente</li>
            </ul>
          </article>
        </div>
        <div className={styles.reviewStrip}>
          <span aria-hidden="true">!</span>
          <p><b>Antes de agir:</b> confirme disponibilidade, preço final, regras, validade e dados do passageiro no canal oficial.</p>
        </div>
      </section>

      <section className={styles.section} id="faq">
        <div className={styles.faqLayout}>
          <div className={styles.faqIntro}>
            <span className={styles.eyebrow}>Perguntas frequentes</span>
            <h2>O que vale saber antes de começar.</h2>
            <p>Ainda com uma dúvida específica? Use o cockpit em modo demonstrativo: todos os dados simulados estarão identificados.</p>
            <Link href="/" className={styles.secondaryCta}>Explorar o cockpit</Link>
          </div>
          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <details key={faq.question} open={index === 0}>
                <summary><span>{faq.question}</span><i aria-hidden="true">+</i></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <BrandMark />
        <span className={styles.eyebrow}>Pronto para experimentar?</span>
        <h2>Transforme o próximo pedido em uma decisão clara.</h2>
        <p>Cadastre um atendimento, ajuste a carteira e compare os cenários. O modo simulado permite conhecer tudo sem depender de integrações externas.</p>
        <div className={styles.heroActions}>
          <Link href="/" className={styles.primaryCta}>Abrir o cockpit <span aria-hidden="true">→</span></Link>
          <a href="#tour" className={styles.secondaryCta}>Rever o tour</a>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link className={styles.brand} href="/">
          <BrandMark compact />
          <span>MilesAI</span>
        </Link>
        <p>Inteligência para cada viagem. Decisão humana em cada etapa.</p>
        <span>MVP demonstrativo · Dados simulados identificados</span>
      </footer>
    </main>
  );
}
