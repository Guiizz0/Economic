import type { IncomingMessage, ServerResponse } from 'http'
import { safe, searchParams, sendJson } from './_lib/http'
import { RANGES, SYMBOL_RE, getHistory } from './_lib/providers'

/** GET /api/history?symbol=PETR4.SA&range=6M   (range: 1D 5D 1M 6M 1Y 5Y MAX) */
async function handler(req: IncomingMessage, res: ServerResponse) {
  const p = searchParams(req)
  const symbol = (p.get('symbol') ?? '').trim()
  const range = (p.get('range') ?? '6M').toUpperCase()
  if (!SYMBOL_RE.test(symbol) || !RANGES[range]) {
    return sendJson(res, 400, { error: 'Parâmetros inválidos.' })
  }
  try {
    const data = await getHistory(symbol, range)
    if (!data.candles.length) return sendJson(res, 404, { error: 'Sem dados para este ativo.' })
    const intraday = range === '1D' || range === '5D'
    sendJson(res, 200, data, intraday ? 's-maxage=60, stale-while-revalidate=300' : 's-maxage=600, stale-while-revalidate=3600')
  } catch {
    sendJson(res, 502, { error: 'Não foi possível obter os dados agora.' })
  }
}

export default safe(handler)
