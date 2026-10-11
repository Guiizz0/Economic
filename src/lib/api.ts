import type { HistoryResponse, MacroResponse, Quote, QuotesResponse } from '../../shared/types'

export type RangeKey = '1D' | '5D' | '1M' | '6M' | '1Y' | '5Y' | 'MAX'
export const RANGE_KEYS: RangeKey[] = ['1D', '5D', '1M', '6M', '1Y', '5Y', 'MAX']

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path)
  if (!r.ok) {
    let msg = `Erro ${r.status}`
    try {
      const j = await r.json()
      if (j?.error) msg = j.error
    } catch {
      /* corpo não é JSON */
    }
    throw new Error(msg)
  }
  return r.json() as Promise<T>
}

export function fetchQuotes(symbols: string[]): Promise<QuotesResponse> {
  return get(`/api/quotes?symbols=${encodeURIComponent(symbols.join(','))}`)
}

const CHUNK = 20

/** Busca muitos símbolos em lotes paralelos (cada lote é uma URL estável → bom aproveitamento do cache de borda). */
export async function fetchQuotesChunked(symbols: string[]): Promise<QuotesResponse> {
  const chunks: string[][] = []
  for (let i = 0; i < symbols.length; i += CHUNK) chunks.push(symbols.slice(i, i + CHUNK))
  const settled = await Promise.allSettled(chunks.map(fetchQuotes))
  const ok = settled.filter((s): s is PromiseFulfilledResult<QuotesResponse> => s.status === 'fulfilled')
  if (!ok.length) {
    const first = settled.find((s) => s.status === 'rejected') as PromiseRejectedResult | undefined
    throw first?.reason ?? new Error('Falha ao carregar cotações')
  }
  const quotes: Quote[] = ok.flatMap((s) => s.value.quotes)
  return {
    updatedAt: Math.min(...ok.map((s) => s.value.updatedAt)),
    quotes,
    missing: symbols.filter((s) => !quotes.some((q) => q.symbol === s)),
  }
}

export function fetchHistory(symbol: string, range: RangeKey): Promise<HistoryResponse> {
  return get(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`)
}

export function fetchMacro(): Promise<MacroResponse> {
  return get('/api/macro')
}
