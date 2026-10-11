import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { Disclaimer, PageHeader } from '../components/ui'

const STEPS = [
  {
    title: 'Organize suas contas',
    text: 'Antes de investir, saiba quanto entra e quanto sai por mês. Só dá para investir o que sobra de forma recorrente.',
  },
  {
    title: 'Monte a reserva de emergência',
    text: 'Guarde de 6 a 12 meses de gastos em um investimento seguro e de resgate rápido (como Tesouro Selic ou CDB com liquidez diária). Ela evita vender investimentos na hora errada.',
  },
  {
    title: 'Defina objetivos e prazos',
    text: 'Dinheiro que você vai usar em 1 ano pede investimentos diferentes do que serve para a aposentadoria. Quanto menor o prazo, menor deve ser o risco.',
  },
  {
    title: 'Comece pequeno e invista todo mês',
    text: 'Aportes regulares reduzem o risco de entrar “na hora errada” e aproveitam os juros compostos. Teste valores no Simulador antes de decidir.',
  },
]

interface Question {
  q: string
  options: string[]
}

const QUESTIONS: Question[] = [
  { q: 'Por quanto tempo pretende deixar o dinheiro investido?', options: ['Menos de 2 anos', 'De 2 a 5 anos', 'Mais de 5 anos'] },
  { q: 'Seu investimento caiu 20% em um mês. O que você faria?', options: ['Venderia tudo para não perder mais', 'Esperaria a recuperação sem mexer', 'Aproveitaria para comprar mais'] },
  { q: 'Qual é seu objetivo principal?', options: ['Preservar o dinheiro, mesmo ganhando pouco', 'Crescer com equilíbrio entre segurança e retorno', 'Maximizar o crescimento, aceitando oscilações fortes'] },
  { q: 'Você já tem reserva de emergência?', options: ['Ainda não', 'Tenho, mas ainda é pequena', 'Sim, cobre 6 meses ou mais de gastos'] },
  { q: 'Qual é sua experiência com investimentos?', options: ['Nenhuma ou só poupança', 'Já invisto em renda fixa', 'Já invisto em ações, fundos ou outros ativos de risco'] },
]

const PROFILES = [
  {
    id: 'Conservador',
    max: 3,
    text: 'Você valoriza segurança e previsibilidade. Prefere ver o saldo crescer devagar a lidar com sustos.',
    mix: [80, 10, 5, 5],
  },
  {
    id: 'Moderado',
    max: 7,
    text: 'Você aceita alguma oscilação em troca de um potencial de retorno maior, desde que parte do dinheiro esteja protegida.',
    mix: [50, 25, 15, 10],
  },
  {
    id: 'Arrojado',
    max: 10,
    text: 'Você tem prazo longo e estômago para oscilações fortes em busca de crescimento. Disciplina e diversificação são essenciais.',
    mix: [25, 35, 25, 15],
  },
]
const BUCKETS = [
  { label: 'Renda fixa', cls: 'bg-brand2' },
  { label: 'Ações e ETFs do Brasil', cls: 'bg-brand' },
  { label: 'Exterior', cls: 'bg-up' },
  { label: 'FIIs e outros', cls: 'bg-muted' },
]

function RiskQuiz() {
  const [answers, setAnswers] = useState<(number | null)[]>(QUESTIONS.map(() => null))
  const done = answers.every((a) => a !== null)
  const score = answers.reduce<number>((s, a) => s + (a ?? 0), 0)
  const profile = PROFILES.find((p) => score <= p.max) ?? PROFILES[2]

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="quiz-title">
      <h2 id="quiz-title" className="text-lg font-semibold">
        Descubra seu perfil de investidor
      </h2>
      <p className="mb-5 text-sm text-muted">Cinco perguntas rápidas. Não há resposta certa — o objetivo é entender o quanto de risco faz sentido para você.</p>

      <ol className="space-y-5">
        {QUESTIONS.map((item, qi) => (
          <li key={item.q}>
            <p className="mb-2 text-sm font-medium">
              {qi + 1}. {item.q}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {item.options.map((opt, oi) => {
                const selected = answers[qi] === oi
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswers((a) => a.map((x, i) => (i === qi ? oi : x)))}
                    aria-pressed={selected}
                    className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      selected ? 'border-brand bg-brand/15' : 'border-line bg-panel2 text-muted hover:border-brand/50 hover:text-text'
                    }`}
                  >
                    <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${selected ? 'border-brand bg-brand text-white' : 'border-muted'}`}>
                      {selected && <Check size={11} />}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </li>
        ))}
      </ol>

      {done && (
        <div className="mt-6 rounded-2xl border border-brand/40 bg-brand/10 p-5" role="status">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Seu perfil</p>
          <p className="text-2xl font-bold">{profile.id}</p>
          <p className="mt-1 text-sm text-muted">{profile.text}</p>

          <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-muted">Exemplo ilustrativo de distribuição</p>
          <div className="flex h-3 overflow-hidden rounded-full bg-panel2" role="img" aria-label={BUCKETS.map((b, i) => `${b.label} ${profile.mix[i]}%`).join(', ')}>
            {profile.mix.map((v, i) => (
              <div key={BUCKETS[i].label} className={BUCKETS[i].cls} style={{ width: `${v}%` }} />
            ))}
          </div>
          <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {BUCKETS.map((b, i) => (
              <li key={b.label} className="flex items-center gap-2">
                <i className={`h-2.5 w-2.5 rounded-sm ${b.cls}`} /> {b.label}
                <b className="ml-auto">{profile.mix[i]}%</b>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            É apenas um exemplo educacional de como investidores com esse perfil costumam pensar a divisão da carteira — não é uma recomendação personalizada. Para decidir, considere sua situação completa e, se
            possível, converse com um profissional certificado.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/simulador" className="btn-primary">
              Testar no simulador <ArrowRight size={16} />
            </Link>
            <button className="btn-ghost" onClick={() => setAnswers(QUESTIONS.map(() => null))}>
              Refazer
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

const GLOSSARY: [string, string][] = [
  ['Ação', 'Menor fração do capital de uma empresa. Quem tem ações é sócio: pode receber parte do lucro (dividendos) e ganhar ou perder conforme o preço sobe ou desce.'],
  ['Dividendos', 'Parte do lucro que a empresa distribui aos acionistas. Nem toda empresa paga, e o valor pode variar de ano para ano.'],
  ['Renda fixa', 'Investimentos cuja regra de remuneração é definida na contratação (Tesouro Direto, CDB, LCI/LCA...). Em geral têm risco menor que ações, mas não são isentos de risco.'],
  ['Selic', 'Taxa básica de juros do Brasil, definida pelo Copom. Influencia o rendimento da renda fixa, o custo do crédito e até o preço das ações.'],
  ['CDI', 'Taxa de referência entre bancos que anda muito próxima da Selic. Muitos CDBs prometem “100% do CDI”, ou seja, rendem o mesmo que essa taxa.'],
  ['Inflação (IPCA)', 'Aumento geral dos preços. Se seu investimento rende menos que a inflação, você perde poder de compra mesmo vendo o saldo subir.'],
  ['Diversificação', 'Dividir o dinheiro entre ativos diferentes para que um tropeço isolado não derrube todo o patrimônio. É a “regra de ouro” para reduzir risco.'],
  ['Volatilidade', 'O quanto o preço de um ativo sobe e desce. Alta volatilidade significa mais emoção — e mais risco — no curto prazo.'],
  ['Liquidez', 'Facilidade de transformar um investimento em dinheiro sem perder valor. Ações têm liquidez alta; um imóvel, baixa.'],
  ['ETF', 'Fundo negociado na bolsa como se fosse uma ação, que replica um índice. Por exemplo, o BOVA11 acompanha o Ibovespa, comprando um pouquinho de várias empresas de uma vez.'],
  ['FII', 'Fundo de investimento imobiliário. Reúne dinheiro de vários investidores para comprar imóveis ou títulos do setor e costuma distribuir rendimentos mensais.'],
  ['Juros compostos', 'Juros que rendem sobre juros. Quanto mais tempo o dinheiro fica investido, mais o efeito “bola de neve” aparece.'],
  ['Reserva de emergência', 'Dinheiro separado para imprevistos (de 6 a 12 meses de gastos), aplicado onde seja seguro e possa ser resgatado rápido.'],
  ['Corretora', 'Instituição autorizada que dá acesso à bolsa e a outros investimentos. Compare custos (corretagem, taxas) antes de abrir conta.'],
]

function Glossary() {
  return (
    <section aria-labelledby="gloss-title">
      <h2 id="gloss-title" className="mb-3 text-lg font-semibold">
        Glossário sem complicação
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        {GLOSSARY.map(([term, def]) => (
          <details key={term} className="card group p-4 open:border-brand/50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">
              {term}
              <ChevronDown size={16} className="text-muted transition group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">{def}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function CandleGuide() {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="candle-title">
      <h2 id="candle-title" className="text-lg font-semibold">
        Como ler um gráfico de velas (candles)
      </h2>
      <p className="mb-5 text-sm text-muted">Cada vela resume um período (um dia, por exemplo) em quatro preços: abertura, máxima, mínima e fechamento.</p>
      <div className="grid items-center gap-6 sm:grid-cols-2">
        <svg viewBox="0 0 320 200" className="mx-auto w-full max-w-sm" role="img" aria-label="Exemplo de vela de alta e vela de baixa">
          {/* vela de alta */}
          <line x1="80" y1="20" x2="80" y2="170" className="stroke-up" strokeWidth="3" />
          <rect x="60" y="55" width="40" height="80" rx="3" className="fill-up" />
          <text x="108" y="26" className="fill-muted" fontSize="11">Máxima</text>
          <text x="108" y="62" className="fill-muted" fontSize="11">Fechamento</text>
          <text x="108" y="140" className="fill-muted" fontSize="11">Abertura</text>
          <text x="108" y="176" className="fill-muted" fontSize="11">Mínima</text>
          <text x="80" y="195" textAnchor="middle" className="fill-up" fontSize="12" fontWeight="600">Alta</text>
          {/* vela de baixa */}
          <line x1="250" y1="20" x2="250" y2="170" className="stroke-down" strokeWidth="3" />
          <rect x="230" y="55" width="40" height="80" rx="3" className="fill-down" />
          <text x="250" y="195" textAnchor="middle" className="fill-down" fontSize="12" fontWeight="600">Baixa</text>
        </svg>
        <ul className="space-y-3 text-sm text-muted">
          <li>
            <b className="text-up">Vela verde:</b> o preço fechou acima do que abriu — o período terminou em alta.
          </li>
          <li>
            <b className="text-down">Vela vermelha:</b> o preço fechou abaixo da abertura — o período terminou em queda.
          </li>
          <li>
            <b className="text-text">Pavios (linhas finas):</b> mostram até onde o preço chegou no máximo e no mínimo, mesmo que depois tenha voltado.
          </li>
          <li>
            <b className="text-text">Barras de volume:</b> indicam quanto foi negociado. Movimentos com volume alto costumam ter mais força.
          </li>
        </ul>
      </div>
    </section>
  )
}

export default function LearnPage() {
  return (
    <div className="space-y-10">
      <PageHeader title="Aprenda a investir" subtitle="Do zero ao primeiro investimento, em linguagem simples e sem promessas de dinheiro fácil." />

      <section aria-labelledby="steps-title">
        <h2 id="steps-title" className="mb-3 text-lg font-semibold">
          4 passos para começar
        </h2>
        <ol className="grid gap-4 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card flex gap-4 p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand2 text-sm font-bold text-white">{i + 1}</span>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <RiskQuiz />
      <CandleGuide />
      <Glossary />

      <section className="card p-5 sm:p-6" aria-labelledby="mistakes-title">
        <h2 id="mistakes-title" className="mb-3 text-lg font-semibold">
          Erros comuns de quem está começando
        </h2>
        <ul className="grid gap-x-8 gap-y-2 text-sm text-muted md:grid-cols-2">
          <li>• Investir em ativos de risco o dinheiro que será necessário em poucos meses.</li>
          <li>• Comprar por “dica quente” sem entender o que está comprando.</li>
          <li>• Colocar tudo em um único ativo ou setor.</li>
          <li>• Olhar só o retorno do passado: ele não garante o futuro.</li>
          <li>• Entrar em pânico e vender na queda, transformando perda temporária em perda real.</li>
          <li>• Ignorar custos, taxas e impostos no cálculo do retorno.</li>
        </ul>
      </section>

      <Disclaimer />
    </div>
  )
}
