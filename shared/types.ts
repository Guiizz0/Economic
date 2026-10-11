/** Tipos compartilhados entre as funções /api (servidor) e o front-end. */

export interface Candle {
  /** timestamp em segundos (UTC) */
  t: number
  o: number
  h: number
  l: number
  c: number
  v: number
  /** fechamento ajustado (inclui dividendos), quando disponível */
  a?: number
}

export type DataSource = 'yahoo' | 'brapi'

export interface Quote {
  symbol: string
  name: string
  price: number
  prevClose: number
  change: number
  changePct: number
  currency: string
  high52?: number
  low52?: number
  dayHigh?: number
  dayLow?: number
  volume?: number
  marketTime?: number
  /** últimos fechamentos diários (para mini-gráficos) */
  spark: number[]
  source: DataSource
}

export interface QuotesResponse {
  updatedAt: number
  quotes: Quote[]
  missing: string[]
}

export interface HistoryResponse {
  symbol: string
  range: string
  currency: string
  candles: Candle[]
  source: DataSource
}

export interface MacroPoint {
  /** data ISO (YYYY-MM-DD) */
  d: string
  v: number
}

export interface MacroSeries {
  id: number
  last: MacroPoint | null
  points: MacroPoint[]
}

export interface MacroResponse {
  updatedAt: number
  selic: MacroSeries
  cdi: MacroSeries
  ipca: MacroSeries
  ipca12: MacroSeries
  usd: MacroSeries
}
