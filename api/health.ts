import type { IncomingMessage, ServerResponse } from 'http'
import { UA, safe, sendJson } from './_lib/http'

/**
 * GET /api/health — diagnóstico: mostra se o servidor da Vercel consegue
 * alcançar cada fonte de dados (e em quanto tempo). Sem cache.
 */
async function probe(name: string, url: string) {
  const t = Date.now()
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: ctrl.signal })
    clearTimeout(timer)
    return { name, ok: r.ok, status: r.status, ms: Date.now() - t }
  } catch (e) {
    return { name, ok: false, error: String((e as Error)?.message ?? e), ms: Date.now() - t }
  }
}

async function handler(_req: IncomingMessage, res: ServerResponse) {
  const results = await Promise.all([
    probe('yahoo', 'https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=5d&interval=1d'),
    probe('brapi', 'https://brapi.dev/api/quote/PETR4'),
    probe('bcb', 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json'),
  ])
  sendJson(res, 200, {
    ok: results.some((r) => r.ok),
    node: process.version,
    region: process.env.VERCEL_REGION ?? null,
    results,
  })
}

export default safe(handler)
