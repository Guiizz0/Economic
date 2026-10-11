import { useMemo } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MCRow } from '../lib/simulate'
import { fmtCompact, fmtMoney } from '../lib/format'
import { useColors, withAlpha } from '../lib/theme'

function FanTooltip({
  active,
  payload,
  currency,
  showBench,
}: {
  active?: boolean
  payload?: { payload: MCRow }[]
  currency: string
  showBench: boolean
}) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload
  const years = r.m / 12
  const label = r.m === 0 ? 'Hoje' : years >= 1 && r.m % 12 === 0 ? `${years} ${years === 1 ? 'ano' : 'anos'}` : `${r.m} meses`
  const row = (name: string, v: number, strong = false) => (
    <div className="flex justify-between gap-6">
      <span className="text-muted">{name}</span>
      <span className={strong ? 'font-semibold' : ''}>{fmtMoney(v, currency, 0)}</span>
    </div>
  )
  return (
    <div className="card min-w-[200px] space-y-1 p-3 text-xs shadow-xl">
      <div className="mb-1 font-semibold">{label}</div>
      {row('Investido', r.invested)}
      {row('Otimista (90%)', r.p90)}
      {row('Provável (mediana)', r.p50, true)}
      {row('Pessimista (10%)', r.p10)}
      {showBench && row('Renda fixa (CDI)', r.bench)}
    </div>
  )
}

export function FanChart({ rows, currency, showBench }: { rows: MCRow[]; currency: string; showBench: boolean }) {
  const colors = useColors()
  const { data, ticks, lastM } = useMemo(() => {
    const lastM = rows[rows.length - 1].m
    const step = Math.max(1, Math.ceil(rows.length / 140))
    const data = rows
      .filter((_, i) => i % step === 0 || i === rows.length - 1)
      .map((r) => ({ ...r, base: r.p10, band: r.p90 - r.p10 }))
    const years = lastM / 12
    const yStep = Math.max(1, Math.ceil(years / 8))
    const ticks: number[] = []
    for (let y = 0; y <= years; y += yStep) ticks.push(y * 12)
    return { data, ticks, lastM }
  }, [rows])

  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke={withAlpha(colors.line, 0.6)} vertical={false} />
        <XAxis
          dataKey="m"
          type="number"
          domain={[0, lastM]}
          ticks={ticks}
          tickFormatter={(m) => (m === 0 ? 'Hoje' : `${m / 12} a`)}
          stroke={colors.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => fmtCompact(v)}
          stroke={colors.muted}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <Tooltip content={<FanTooltip currency={currency} showBench={showBench} />} />
        <Area dataKey="base" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
        <Area dataKey="band" stackId="band" stroke="none" fill={withAlpha(colors.brand, 0.22)} isAnimationActive={false} />
        <Line dataKey="p50" stroke={colors.brand} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        <Line dataKey="invested" stroke={colors.muted} strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
        {showBench && (
          <Line dataKey="bench" stroke={colors.brand2} strokeWidth={1.8} strokeDasharray="2 3" dot={false} isAnimationActive={false} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
