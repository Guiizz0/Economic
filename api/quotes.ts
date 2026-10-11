import type { IncomingMessage, ServerResponse } from 'http'
import type { Quote, QuotesResponse } from '../shared/types'
import { mapLimit, searchParams, sendJson } from './_lib/http'
import { SYMBOL_RE, getQuote } from './_lib/providers'

/** GET /api/quotes?symbols=PETR4.SA,AAPL,BTC-USD  (máx. 40 símbolos) */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const symbols = [
    ...new Set(
      (searchParams(req).get('symbols') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ]
  if (!symbols.length || symbols.length > 40 || symbols.some((s) => !SYMBOL_RE.test(s))) {
    return sendJson(res, 400, { error: 'Parâmetro "symbols" inválido.' })
  }

  const results = await mapLimit(symbols, 8, (s) => getQuote(s).catch(() => null))
  const quotes = results.filter((q): q is Quote => q !== null)
  const body: QuotesResponse = {
    updatedAt: Date.now(),
    quotes,
    missing: symbols.filter((s) => !quotes.some((q) => q.symbol === s)),
  }
  // 30s no cache de borda; depois serve o antigo enquanto atualiza em segundo plano.
  sendJson(res, 200, body, 's-maxage=30, stale-while-revalidate=120')
}
