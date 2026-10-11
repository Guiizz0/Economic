import type { IncomingMessage, ServerResponse } from 'http'

export function searchParams(req: IncomingMessage): URLSearchParams {
  return new URL(req.url ?? '/', 'http://localhost').searchParams
}

/**
 * Responde JSON. O cache de borda da Vercel (s-maxage) é o que mantém a
 * plataforma gratuita: milhares de visitantes compartilham a mesma resposta.
 */
export function sendJson(res: ServerResponse, status: number, body: unknown, cache?: string) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', status === 200 && cache ? cache : 'no-store')
  res.end(JSON.stringify(body))
}

/** Envolve o handler: qualquer exceção vira JSON com a causa (e fica no log da Vercel). */
export function safe(fn: (req: IncomingMessage, res: ServerResponse) => Promise<void>) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      await fn(req, res)
    } catch (e) {
      console.error('[api]', req.url, e)
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'Erro interno', detail: String((e as Error)?.message ?? e) })
      }
    }
  }
}

export const UA = 'Mozilla/5.0 (compatible; EconomicApp/1.0; +https://vercel.com)'

export async function fetchJson(url: string, timeoutMs = 8000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, {
      headers: { 'user-agent': UA, accept: 'application/json' },
      signal: ctrl.signal,
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  } finally {
    clearTimeout(timer)
  }
}

/** map com limite de concorrência (evita disparar dezenas de requisições de uma vez) */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return out
}
