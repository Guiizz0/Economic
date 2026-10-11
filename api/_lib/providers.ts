import type { Candle, DataSource, HistoryResponse, Quote } from '../../shared/types'
import { fetchJson } from './http'

/**
 * Camada de provedores de dados.
 *  - Principal: Yahoo Finance (endpoint público "chart", sem chave).
 *  - Alternativo (só ações/FIIs da B3): brapi.dev.
 *
 * Para trocar de fonte (Twelve Data, Alpha Vantage, Finnhub...), basta
 * reimplementar `getQuote` e `getHistory` mantendo os mesmos tipos de retorno.
 */

export const SYMBOL_RE = /^[A-Za-z0-9.^=\-]{1,20}$/

export const RANGES: Record<string, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '5D': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '5Y': { range: '5y', interval: '1d' },
  MAX: { range: 'max', interval: '1wk' },
}

const YAHOO_HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']

async function yahooChart(symbol: string, range: string, interval: string) {
  let lastErr: unknown
  for (const host of YAHOO_HOSTS) {
    try {
      const url = `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`
      const j = await fetchJson(url)
      const r = j?.chart?.result?.[0]
      if (!r) throw new Error(j?.chart?.error?.description ?? 'sem dados')
      return r
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

export function toCandles(r: any): Candle[] {
  const ts: number[] = r?.timestamp ?? []
  const q = r?.indicators?.quote?.[0] ?? {}
  const adj: (number | null)[] | undefined = r?.indicators?.adjclose?.[0]?.adjclose
  const out: Candle[] = []
  for (let i = 0; i < ts.length; i++) {
    const c = q.close?.[i]
    const o = q.open?.[i]
    const h = q.high?.[i]
    const l = q.low?.[i]
    if (c == null || o == null || h == null || l == null) continue
    const a = adj?.[i]
    out.push({ t: ts[i], o, h, l, c, v: q.volume?.[i] ?? 0, ...(a != null ? { a } : {}) })
  }
  return out
}

async function brapiChart(symbol: string, range: string, interval: string) {
  const code = symbol.replace(/\.SA$/i, '')
  const token = process.env.BRAPI_TOKEN
  const url = `https://brapi.dev/api/quote/${encodeURIComponent(code)}?range=${range}&interval=${interval}${token ? `&token=${token}` : ''}`
  const j = await fetchJson(url)
  const r = j?.results?.[0]
  if (!r) throw new Error('brapi sem dados')
  const candles: Candle[] = (r.historicalDataPrice ?? [])
    .filter((x: any) => x?.close != null)
    .map((x: any) => ({
      t: typeof x.date === 'number' ? x.date : Math.floor(Date.parse(x.date) / 1000),
      o: x.open ?? x.close,
      h: x.high ?? x.close,
      l: x.low ?? x.close,
      c: x.close,
      v: x.volume ?? 0,
      ...(x.adjustedClose != null ? { a: x.adjustedClose } : {}),
    }))
    .filter((c: Candle) => Number.isFinite(c.t))
  return { meta: { ...r, currency: r.currency ?? 'BRL', shortName: r.shortName ?? r.longName }, candles }
}

function buildQuote(symbol: string, meta: any, candles: Candle[], source: DataSource): Quote {
  const closes = candles.map((c) => c.c)
  const price: number = meta?.regularMarketPrice ?? closes[closes.length - 1]
  if (typeof price !== 'number' || !Number.isFinite(price)) throw new Error('sem preço')
  // Variação do dia = preço atual vs. fechamento do pregão anterior.
  const prev: number =
    closes.length >= 2 ? closes[closes.length - 2] : (meta?.chartPreviousClose ?? meta?.previousClose ?? price)
  const change = price - prev
  return {
    symbol,
    name: meta?.shortName ?? meta?.longName ?? symbol,
    price,
    prevClose: prev,
    change,
    changePct: prev ? (change / prev) * 100 : 0,
    currency: meta?.currency ?? 'USD',
    high52: meta?.fiftyTwoWeekHigh ?? undefined,
    low52: meta?.fiftyTwoWeekLow ?? undefined,
    dayHigh: meta?.regularMarketDayHigh ?? undefined,
    dayLow: meta?.regularMarketDayLow ?? undefined,
    volume: meta?.regularMarketVolume ?? undefined,
    marketTime: meta?.regularMarketTime ?? undefined,
    spark: closes.slice(-22),
    source,
  }
}

const isBR = (s: string) => /\.SA$/i.test(s)

export async function getQuote(symbol: string): Promise<Quote> {
  try {
    const r = await yahooChart(symbol, '1mo', '1d')
    return buildQuote(symbol, r.meta, toCandles(r), 'yahoo')
  } catch (e) {
    if (!isBR(symbol)) throw e
    const b = await brapiChart(symbol, '1mo', '1d')
    return buildQuote(symbol, b.meta, b.candles, 'brapi')
  }
}

export async function getHistory(symbol: string, rangeKey: string): Promise<HistoryResponse> {
  const { range, interval } = RANGES[rangeKey]
  try {
    const r = await yahooChart(symbol, range, interval)
    return {
      symbol,
      range: rangeKey,
      currency: r.meta?.currency ?? 'USD',
      candles: toCandles(r),
      source: 'yahoo',
    }
  } catch (e) {
    if (!isBR(symbol)) throw e
    const b = await brapiChart(symbol, range, interval)
    return { symbol, range: rangeKey, currency: b.meta.currency, candles: b.candles, source: 'brapi' }
  }
}
