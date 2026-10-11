import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import type { MacroSeries } from '../../shared/types'
import { useMacro } from '../hooks/useMarket'
import { fmtDate, fmtMoney, fmtNum } from '../lib/format'
import { useColors, withAlpha } from '../lib/theme'
import { Skeleton } from './ui'

function MiniArea({ series, color }: { series: MacroSeries; color: string }) {
  const data = useMemo(() => {
    const pts = series.points
    const step = Math.max(1, Math.ceil(pts.length / 60))
    return pts.filter((_, i) => i % step === 0 || i === pts.length - 1)
  }, [series])
  if (data.length < 2) return <div className="h-12" />
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <Area dataKey="v" stroke={color} strokeWidth={1.8} fill={withAlpha(color, 0.18)} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function MacroCards() {
  const { data, isLoading } = useMacro()
  const colors = useColors()

  const cards = data
    ? [
        {
          title: 'Selic (meta)',
          series: data.selic,
          value: (v: number) => `${fmtNum(v)}% a.a.`,
          help: 'Juros básicos da economia. Quanto maior, mais a renda fixa rende — e mais caro fica o crédito.',
        },
        {
          title: 'CDI',
          series: data.cdi,
          value: (v: number) => `${fmtNum(v)}% a.a.`,
          help: 'Referência de rentabilidade da renda fixa. Acompanha de perto a Selic.',
        },
        {
          title: 'Inflação (IPCA 12m)',
          series: data.ipca12,
          value: (v: number) => `${fmtNum(v)}%`,
          help: 'Quanto os preços subiram em 12 meses. Para ganhar de verdade, o investimento precisa render mais que isso.',
        },
        {
          title: 'Dólar (venda)',
          series: data.usd,
          value: (v: number) => fmtMoney(v, 'BRL', 4),
          help: 'Preço de 1 dólar em reais, segundo o Banco Central.',
        },
      ]
    : []

  return (
    <section aria-labelledby="macro-title">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="macro-title" className="text-lg font-semibold">
          Termômetro da economia
        </h2>
        <span className="text-xs text-muted">Fonte: Banco Central do Brasil</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading &&
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
              <Skeleton className="mt-3 h-12 w-full" />
            </div>
          ))}
        {cards.map((c) => (
          <div key={c.title} className="card flex flex-col p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">{c.title}</div>
            <div className="mt-1 text-2xl font-bold">{c.series.last ? c.value(c.series.last.v) : '—'}</div>
            <MiniArea series={c.series} color={colors.brand2} />
            <p className="mt-2 text-xs leading-relaxed text-muted">{c.help}</p>
            {c.series.last && <p className="mt-1 text-[11px] text-muted/80">Ref.: {fmtDate(c.series.last.d)}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}
