import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calculator, CandlestickChart, LineChart, Star } from 'lucide-react'
import { PriceChart } from '../components/PriceChart'
import { AssetLogo, ChangePill, Disclaimer, ErrorBox, LiveBadge, Skeleton } from '../components/ui'
import { useHistory, useQuote } from '../hooks/useMarket'
import { RANGE_KEYS, type RangeKey } from '../lib/api'
import { assetFor, priceLabel } from '../lib/assets'
import { fmtCompact, fmtMoney, fmtNum, fmtPct, trendClass } from '../lib/format'
import { useFavorites } from '../lib/favorites'
import { computeStats } from '../lib/simulate'

const RANGE_LABEL: Record<RangeKey, string> = {
  '1D': '1 dia',
  '5D': '5 dias',
  '1M': '1 mês',
  '6M': '6 meses',
  '1Y': '1 ano',
  '5Y': '5 anos',
  MAX: 'Máximo',
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel2 p-3" title={hint}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  )
}

export default function AssetPage() {
  const { symbol = '' } = useParams()
  const [range, setRange] = useState<RangeKey>('6M')
  const [mode, setMode] = useState<'candle' | 'area'>('area')
  const { isFavorite, toggle } = useFavorites()

  const q = useQuote(symbol)
  const hist = useHistory(symbol, range)
  const year = useHistory(symbol, '1Y')

  const quote = q.data?.quote
  const asset = assetFor(symbol, quote?.name)
  const money = (n: number | undefined) =>
    n == null ? '—' : asset.kind === 'Índice' ? fmtNum(n) : priceLabel(asset.kind, { price: n, currency: quote?.currency ?? 'BRL' })

  const yearCandles = year.data?.candles
  const high52 = quote?.high52 ?? (yearCandles?.length ? Math.max(...yearCandles.map((c) => c.h)) : undefined)
  const low52 = quote?.low52 ?? (yearCandles?.length ? Math.min(...yearCandles.map((c) => c.l)) : undefined)
  const yearStats = useMemo(() => (yearCandles ? computeStats(yearCandles) : null), [yearCandles])

  const candles = hist.data?.candles
  const periodChange = useMemo(() => {
    if (!candles || candles.length < 2) return null
    return (candles[candles.length - 1].c / candles[0].c - 1) * 100
  }, [candles])

  const insights = useMemo(() => {
    if (!quote) return []
    const out: string[] = []
    out.push(`Hoje, ${asset.code} ${quote.changePct >= 0 ? 'sobe' : 'cai'} ${fmtPct(Math.abs(quote.changePct), { signed: false })} em relação ao fechamento anterior.`)
    if (high52) {
      const dist = (quote.price / high52 - 1) * 100
      out.push(
        dist > -0.5
          ? 'O preço está praticamente na máxima das últimas 52 semanas.'
          : `O preço está ${fmtPct(Math.abs(dist), { signed: false, digits: 1 })} abaixo da máxima das últimas 52 semanas.`,
      )
    }
    if (yearStats) {
      const v = yearStats.sigma * 100
      const level = v < 20 ? 'baixa' : v < 40 ? 'moderada' : 'alta'
      out.push(
        `Nos últimos 12 meses a oscilação anual foi de cerca de ${fmtNum(v, 0)}% — volatilidade ${level}. Quanto maior, mais o preço sobe e desce (e maior o risco no curto prazo).`,
      )
    }
    return out
  }, [quote, asset.code, high52, yearStats])

  if (q.isError && !quote) {
    return (
      <div className="space-y-4">
        <Link to="/explorar" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <ErrorBox message={(q.error as Error).message} onRetry={() => q.refetch()} />
      </div>
    )
  }

  const intraday = range === '1D' || range === '5D'

  return (
    <div className="space-y-6">
      <Link to="/explorar" className="inline-flex items-center gap-1 text-sm text-muted hover:text-text">
        <ArrowLeft size={16} /> Explorar
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <AssetLogo code={asset.code} size={52} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{asset.code}</h1>
              <span className="chip">{asset.kind}</span>
              {asset.sector && <span className="chip">{asset.sector}</span>}
            </div>
            <p className="text-sm text-muted">{quote?.name ?? asset.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LiveBadge updatedAt={q.dataUpdatedAt} isFetching={q.isFetching} isError={q.isError} />
          <button
            onClick={() => toggle(symbol)}
            aria-pressed={isFavorite(symbol)}
            className="btn-ghost !px-3"
            aria-label={isFavorite(symbol) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Star size={16} className={isFavorite(symbol) ? 'fill-yellow-400 text-yellow-400' : ''} />
          </button>
        </div>
      </header>

      <section className="flex flex-wrap items-end gap-x-6 gap-y-2">
        {quote ? (
          <>
            <div className="text-4xl font-bold tracking-tight">{priceLabel(asset.kind, quote)}</div>
            <div className={`flex items-center gap-2 pb-1 text-lg font-semibold ${trendClass(quote.change)}`}>
              {quote.change >= 0 ? '▲' : '▼'} {fmtNum(Math.abs(quote.change), quote.price < 1 ? 4 : 2)}
              <ChangePill value={quote.changePct} />
              <span className="text-sm font-normal text-muted">hoje</span>
            </div>
          </>
        ) : (
          <Skeleton className="h-12 w-64" />
        )}
      </section>

      <section className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Período">
            {RANGE_KEYS.map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={range === r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${range === r ? 'bg-brand text-white' : 'text-muted hover:bg-panel2 hover:text-text'}`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {periodChange != null && (
              <span className="text-xs text-muted">
                {RANGE_LABEL[range]}: <b className={trendClass(periodChange)}>{fmtPct(periodChange)}</b>
              </span>
            )}
            <div className="flex gap-1 rounded-lg border border-line p-0.5">
              <button onClick={() => setMode('area')} aria-pressed={mode === 'area'} aria-label="Gráfico de linha" className={`rounded-md p-1.5 ${mode === 'area' ? 'bg-panel2 text-text' : 'text-muted'}`}>
                <LineChart size={16} />
              </button>
              <button onClick={() => setMode('candle')} aria-pressed={mode === 'candle'} aria-label="Gráfico de velas" className={`rounded-md p-1.5 ${mode === 'candle' ? 'bg-panel2 text-text' : 'text-muted'}`}>
                <CandlestickChart size={16} />
              </button>
            </div>
          </div>
        </div>
        {hist.isError ? (
          <ErrorBox message={(hist.error as Error).message} onRetry={() => hist.refetch()} />
        ) : candles?.length ? (
          <PriceChart candles={candles} mode={mode} intraday={intraday} />
        ) : (
          <Skeleton className="h-[380px] w-full" />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Números do ativo</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Fech. anterior" value={money(quote?.prevClose)} />
            <Stat label="Máx. do dia" value={money(quote?.dayHigh)} />
            <Stat label="Mín. do dia" value={money(quote?.dayLow)} />
            <Stat label="Máx. 52 semanas" value={money(high52)} hint="Maior preço dos últimos 12 meses" />
            <Stat label="Mín. 52 semanas" value={money(low52)} hint="Menor preço dos últimos 12 meses" />
            <Stat label="Volume" value={fmtCompact(quote?.volume)} hint="Quantidade negociada no dia" />
            {yearStats && <Stat label="Oscilação (12m)" value={`${fmtNum(yearStats.sigma * 100, 0)}% a.a.`} hint="Volatilidade anualizada" />}
            {yearStats && <Stat label="Maior queda (12m)" value={fmtPct(yearStats.maxDrawdown * 100, { digits: 1 })} hint="Do pico ao vale no período" />}
            {quote && <Stat label="Moeda" value={asset.kind === 'Índice' ? 'Pontos' : quote.currency} />}
          </div>
          {high52 && low52 && quote && high52 > low52 && (
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs text-muted">
                <span>Mín. 52s {money(low52)}</span>
                <span>Máx. 52s {money(high52)}</span>
              </div>
              <div className="relative h-2 rounded-full bg-panel2">
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-gradient-to-br from-brand to-brand2"
                  style={{ left: `${Math.min(100, Math.max(0, ((quote.price - low52) / (high52 - low52)) * 100))}%` }}
                  aria-label="Posição do preço atual dentro da faixa de 52 semanas"
                />
              </div>
            </div>
          )}
        </div>

        <div className="card flex flex-col gap-3 p-4">
          <h2 className="text-sm font-semibold">Em palavras simples</h2>
          {insights.length ? (
            <ul className="space-y-2 text-sm leading-relaxed text-muted">
              {insights.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          ) : (
            <Skeleton className="h-28 w-full" />
          )}
          <Link to={`/simulador?ativo=${encodeURIComponent(symbol)}`} className="btn-primary mt-auto">
            <Calculator size={16} /> Simular investimento
          </Link>
        </div>
      </section>

      {quote && (
        <p className="text-xs text-muted">
          Preço de referência: {fmtMoney(quote.price, quote.currency, 2)} · fonte {quote.source === 'yahoo' ? 'Yahoo Finance' : 'brapi.dev'} · pode haver atraso de alguns minutos.
        </p>
      )}
      <Disclaimer />
    </div>
  )
}
