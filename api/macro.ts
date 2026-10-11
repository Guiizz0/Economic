import type { IncomingMessage, ServerResponse } from 'http'
import type { MacroResponse, MacroSeries } from '../shared/types'
import { fetchJson, safe, sendJson } from './_lib/http'

/**
 * GET /api/macro — indicadores do Banco Central (API aberta do SGS, sem chave).
 *  432 Selic meta · 4389 CDI anualizado · 433 IPCA mensal · 13522 IPCA 12 meses · 1 dólar (venda)
 */
const SERIES = {
  selic: { id: 432, n: 260 },
  cdi: { id: 4389, n: 260 },
  ipca: { id: 433, n: 14 },
  ipca12: { id: 13522, n: 14 },
  usd: { id: 1, n: 60 },
} as const

const parseDate = (s: string) => {
  const [d, m, y] = s.split('/')
  return `${y}-${m}-${d}`
}

async function load(id: number, n: number): Promise<MacroSeries> {
  try {
    const j = await fetchJson(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${id}/dados/ultimos/${n}?formato=json`,
      10000,
    )
    let pts = (j as { data: string; valor: string }[])
      .map((x) => ({ d: parseDate(x.data), v: Number(x.valor) }))
      .filter((p) => Number.isFinite(p.v))
    // proteção: ignora pontos com data futura (a folga de 36h cobre fuso horário)
    const limit = new Date(Date.now() + 36 * 3600 * 1000).toISOString().slice(0, 10)
    const valid = pts.filter((p) => p.d <= limit)
    if (valid.length) pts = valid
    pts.sort((a, b) => a.d.localeCompare(b.d))
    return { id, last: pts.at(-1) ?? null, points: pts }
  } catch {
    return { id, last: null, points: [] }
  }
}

async function handler(_req: IncomingMessage, res: ServerResponse) {
  const [selic, cdi, ipca, ipca12, usd] = await Promise.all(
    Object.values(SERIES).map((s) => load(s.id, s.n)),
  )
  const body: MacroResponse = { updatedAt: Date.now(), selic, cdi, ipca, ipca12, usd }
  sendJson(res, 200, body, 's-maxage=1800, stale-while-revalidate=7200')
}

export default safe(handler)
