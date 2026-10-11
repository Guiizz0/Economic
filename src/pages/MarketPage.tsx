import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, Calculator, GraduationCap, TrendingDown, TrendingUp } from 'lucide-react'
import { UNIVERSE, type Market } from '../../shared/universe'
import type { Quote } from '../../shared/types'
import { MacroCards } from '../components/MacroCards'
import { AssetLogo, ChangePill, ErrorBox, LiveBadge, PageHeader, Skeleton, Sparkline } from '../components/ui'
import { useFavoriteQuotes, useUniverseQuotes } from '../hooks/useMarket'
import { assetFor, assetPath, priceLabel } from '../lib/assets'
import { fmtNum, fmtPct, trendClass } from '../lib/format'
import { useFavorites } from '../lib/favorites'
import { useColors } from '../lib/theme'

const KEY_SYMBOLS = ['^BVSP', '^GSPC', '^IXIC', 'BRL=X', 'BTC-USD', 'GC=F']

function QuoteCard({ symbol, quote }: { symbol: string; quote?: Quote }) {
  const a = assetFor(symbol, quote?.name)
  return (
    <Link to={assetPath(symbol)} className="card group flex flex-col gap-3 p-4 transition hover:border-brand/60 hover:shadow-glow">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{a.code}</div>
          <div className="text-xs text-muted">{a.name}</div>
        </div>
        {quote ? <ChangePill value={quote.changePct} /> : <Skeleton className="h-6 w-16" />}
      </div>
      <div className="flex items-end justify-between gap-2">
        {quote ? <div className="text-xl font-bold">{priceLabel(a.kind, quote)}</div> : <Skeleton className="h-7 w-28" />}
        {quote && <Sparkline values={quote.spark} width={72} height={30} />}
      </div>
    </Link>
  )
}

const MOVER_TABS: { id: Market; label: string }[] = [
  { id: 'BR', label: 'Brasil' },
  { id: 'US', label: 'EUA' },
  { id: 'CRYPTO', label: 'Cripto' },
]

function MoverList({ title, icon, items }: { title: string; icon: 'up' | 'down'; items: { symbol: string; quote: Quote }[] }) {
  return (
    <div className="card p-4">
      <h3 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${icon === 'up' ? 'text-up' : 'text-down'}`}>
        {icon === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        {title}
      </h3>
      <ul className="divide-y divide-line/60">
        {items.map(({ symbol, quote }) => {
          const a = assetFor(symbol, quote.name)
          return (
            <li key={symbol}>
              <Link to={assetPath(symbol)} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                <AssetLogo code={a.code} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{a.code}</span>
                  <span className="block truncate text-xs text-muted">{a.name}</span>
                </span>
                <span className="text-sm font-medium">{priceLabel(a.kind, quote)}</span>
                <ChangePill value={quote.changePct} />
              </Link>
            </li>
          )
        })}
        {!items.length && <li className="py-6 text-center text-sm text-muted">Sem dados no momento.</li>}
      </ul>
    </div>
  )
}

function Movers({ map, loading }: { map: Record<string, Quote>; loading: boolean }) {
  const [tab, setTab] = useState<Market>('BR')
  const { gainers, losers } = useMemo(() => {
    const list = UNIVERSE.filter((a) => a.market === tab && map[a.symbol]).map((a) => ({ symbol: a.symbol, quote: map[a.symbol] }))
    const sorted = [...list].sort((x, y) => y.quote.changePct - x.quote.changePct)
    return {
      gainers: sorted.filter((x) => x.quote.changePct > 0).slice(0, 5),
      losers: sorted.filter((x) => x.quote.changePct < 0).reverse().slice(0, 5),
    }
  }, [map, tab])

  return (
    <section aria-labelledby="movers-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="movers-title" className="text-lg font-semibold">
          Em alta e em baixa hoje
        </h2>
        <div className="flex gap-1 rounded-xl border border-line bg-panel p-1" role="tablist">
          {MOVER_TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? 'bg-brand text-white' : 'text-muted hover:text-text'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="card space-y-3 p-4">
              {Array.from({ length: 5 }, (_, j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <MoverList title="Maiores altas" icon="up" items={gainers} />
          <MoverList title="Maiores quedas" icon="down" items={losers} />
        </div>
      )}
    </section>
  )
}

function SectorPanel({ map }: { map: Record<string, Quote> }) {
  const colors = useColors()
  const data = useMemo(() => {
    const acc = new Map<string, { sum: number; n: number }>()
    for (const a of UNIVERSE) {
      if (a.market !== 'BR' || a.kind !== 'Ação' || !a.sector) continue
      const q = map[a.symbol]
      if (!q) continue
      const cur = acc.get(a.sector) ?? { sum: 0, n: 0 }
      acc.set(a.sector, { sum: cur.sum + q.changePct, n: cur.n + 1 })
    }
    return [...acc.entries()]
      .map(([sector, v]) => ({ sector, value: +(v.sum / v.n).toFixed(2), n: v.n }))
      .sort((a, b) => b.value - a.value)
  }, [map])

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold">Setores da bolsa brasileira</h3>
      <p className="mb-2 text-xs text-muted">Variação média do dia das ações de cada setor.</p>
      {data.length ? (
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
            <XAxis type="number" hide domain={['dataMin - 0.3', 'dataMax + 0.3']} />
            <YAxis type="category" dataKey="sector" width={150} tick={{ fill: colors.muted, fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              formatter={(v: number) => [fmtPct(v), 'Variação média']}
              contentStyle={{ background: colors.panel, border: `1px solid ${colors.line}`, borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: colors.text }}
            />
            <Bar dataKey="value" radius={4} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.sector} fill={d.value >= 0 ? colors.up : colors.down} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Skeleton className="h-44 w-full" />
      )}
    </div>
  )
}

function BreadthPanel({ map }: { map: Record<string, Quote> }) {
  const { up, down, flat } = useMemo(() => {
    let up = 0
    let down = 0
    let flat = 0
    for (const a of UNIVERSE) {
      if (a.market !== 'BR' || a.kind !== 'Ação') continue
      const q = map[a.symbol]
      if (!q) continue
      if (q.changePct > 0) up++
      else if (q.changePct < 0) down++
      else flat++
    }
    return { up, down, flat }
  }, [map])
  const total = up + down + flat

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold">Humor do mercado</h3>
      <p className="mb-4 text-xs text-muted">Quantas ações brasileiras acompanhadas sobem e quantas caem hoje.</p>
      {total ? (
        <>
          <div className="flex h-3 overflow-hidden rounded-full bg-panel2" role="img" aria-label={`${up} em alta, ${down} em queda, ${flat} estáveis`}>
            <div className="bg-up" style={{ width: `${(up / total) * 100}%` }} />
            <div className="bg-muted/40" style={{ width: `${(flat / total) * 100}%` }} />
            <div className="bg-down" style={{ width: `${(down / total) * 100}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-up">{up} em alta</span>
            {flat > 0 && <span className="text-muted">{flat} estáveis</span>}
            <span className="text-down">{down} em queda</span>
          </div>
          <p className="mt-4 text-sm text-muted">
            {up > down * 1.5
              ? 'Dia de otimismo: a maioria das ações está subindo.'
              : down > up * 1.5
                ? 'Dia de cautela: a maioria das ações está caindo.'
                : 'Dia dividido: altas e quedas se equilibram.'}
          </p>
        </>
      ) : (
        <Skeleton className="h-24 w-full" />
      )}
    </div>
  )
}

function FavoritesPanel() {
  const { favorites } = useFavorites()
  const { map } = useFavoriteQuotes(favorites)
  if (!favorites.length) return null
  return (
    <section aria-labelledby="fav-title">
      <h2 id="fav-title" className="mb-3 text-lg font-semibold">
        Seus favoritos
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {favorites.slice(0, 8).map((s) => (
          <QuoteCard key={s} symbol={s} quote={map[s]} />
        ))}
      </div>
    </section>
  )
}

export default function MarketPage() {
  const { map, isLoading, isFetching, isError, error, dataUpdatedAt, refetch } = useUniverseQuotes()
  const noData = !isLoading && Object.keys(map).length === 0

  return (
    <div className="space-y-10">
      <PageHeader
        title="Mercado hoje"
        subtitle="Veja o que está subindo e caindo, entenda o cenário econômico e simule quanto seu dinheiro pode render."
        right={<LiveBadge updatedAt={dataUpdatedAt} isFetching={isFetching} isError={isError} />}
      />

      {noData && <ErrorBox message={isError ? String((error as Error)?.message ?? error) : 'Nenhuma cotação retornada.'} onRetry={() => refetch()} />}

      <section aria-label="Principais indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {KEY_SYMBOLS.map((s) => (
          <QuoteCard key={s} symbol={s} quote={map[s]} />
        ))}
      </section>

      <FavoritesPanel />

      <MacroCards />

      <Movers map={map} loading={isLoading} />

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectorPanel map={map} />
        </div>
        <div className="lg:col-span-2">
          <BreadthPanel map={map} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2" aria-label="Próximos passos">
        <Link to="/aprender" className="card group flex items-center gap-4 p-5 transition hover:border-brand/60 hover:shadow-glow">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/15 text-brand"><GraduationCap /></span>
          <span className="flex-1">
            <span className="block font-semibold">Nunca investiu?</span>
            <span className="text-sm text-muted">Aprenda o essencial em linguagem simples e descubra seu perfil.</span>
          </span>
          <ArrowRight className="text-muted transition group-hover:translate-x-1 group-hover:text-text" />
        </Link>
        <Link to="/simulador" className="card group flex items-center gap-4 p-5 transition hover:border-brand/60 hover:shadow-glow">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand2/15 text-brand2"><Calculator /></span>
          <span className="flex-1">
            <span className="block font-semibold">Quanto isso renderia?</span>
            <span className="text-sm text-muted">Escolha um ativo, um valor e um prazo e veja os cenários possíveis.</span>
          </span>
          <ArrowRight className="text-muted transition group-hover:translate-x-1 group-hover:text-text" />
        </Link>
      </section>

      {/* referência rápida de como ler as cores */}
      <p className="text-xs text-muted">
        <span className={trendClass(1)}>Verde</span> = em alta · <span className={trendClass(-1)}>vermelho</span> = em queda. A variação
        compara o preço atual com o fechamento do pregão anterior; as cotações podem ter alguns minutos de atraso.
      </p>
    </div>
  )
}
