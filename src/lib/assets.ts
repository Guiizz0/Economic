import { findAsset, type Asset, type AssetKind } from '../../shared/universe'
import type { Quote } from '../../shared/types'
import { fmtMoney, fmtNum } from './format'

export function guessKind(symbol: string): AssetKind {
  const s = symbol.toUpperCase()
  if (s.startsWith('^')) return 'Índice'
  if (s.endsWith('=X')) return 'Câmbio'
  if (s.endsWith('=F')) return 'Commodity'
  if (s.endsWith('-USD')) return 'Cripto'
  if (/^[A-Z]{4}11\.SA$/.test(s)) return 'FII'
  return 'Ação'
}

/** Devolve o ativo do universo ou monta um genérico para qualquer outro símbolo digitado. */
export function assetFor(symbol: string, name?: string): Asset {
  const known = findAsset(symbol)
  if (known) return known
  const kind = guessKind(symbol)
  return {
    symbol,
    code: symbol.replace(/\.SA$/i, '').replace(/-USD$/i, ''),
    name: name ?? symbol,
    market: symbol.toUpperCase().endsWith('.SA') ? 'BR' : kind === 'Cripto' ? 'CRYPTO' : 'US',
    kind,
  }
}

export function assetPath(symbol: string): string {
  return `/ativo/${encodeURIComponent(symbol)}`
}

/** Formata o preço de acordo com o tipo do ativo (pontos, moeda, câmbio...). */
export function priceLabel(kind: AssetKind, q: Pick<Quote, 'price' | 'currency'>): string {
  if (kind === 'Índice') return fmtNum(q.price, 2)
  if (kind === 'Câmbio') return fmtMoney(q.price, 'BRL', 4)
  return fmtMoney(q.price, q.currency, q.price < 1 ? 4 : 2)
}
