import type { Candle } from '../../shared/types'

/* ------------------------------------------------------------------ *
 *  Estatísticas históricas
 * ------------------------------------------------------------------ */

export interface HistStats {
  /** média anualizada dos retornos logarítmicos */
  mu: number
  /** volatilidade anualizada (desvio-padrão dos retornos logarítmicos) */
  sigma: number
  /** crescimento anual composto (CAGR) do período */
  cagr: number
  /** retorno total do período */
  totalReturn: number
  /** maior queda de pico a vale */
  maxDrawdown: number
  years: number
  observations: number
}

const price = (c: Candle) => c.a ?? c.c // usa fechamento ajustado (com dividendos) quando existir

export function computeStats(candles: Candle[]): HistStats | null {
  if (candles.length < 30) return null
  const rets: number[] = []
  let peak = price(candles[0])
  let maxDd = 0
  for (let i = 1; i < candles.length; i++) {
    const p0 = price(candles[i - 1])
    const p1 = price(candles[i])
    if (p0 > 0 && p1 > 0) rets.push(Math.log(p1 / p0))
    peak = Math.max(peak, p1)
    maxDd = Math.min(maxDd, p1 / peak - 1)
  }
  const years = (candles[candles.length - 1].t - candles[0].t) / (365.25 * 86400)
  if (rets.length < 20 || years <= 0.1) return null
  const perYear = rets.length / years
  const mean = rets.reduce((s, x) => s + x, 0) / rets.length
  const variance = rets.reduce((s, x) => s + (x - mean) ** 2, 0) / (rets.length - 1)
  const total = price(candles[candles.length - 1]) / price(candles[0]) - 1
  return {
    mu: mean * perYear,
    sigma: Math.sqrt(variance) * Math.sqrt(perYear),
    cagr: Math.pow(1 + total, 1 / years) - 1,
    totalReturn: total,
    maxDrawdown: maxDd,
    years,
    observations: rets.length,
  }
}

export interface Backtest {
  yearsBack: number
  startDate: number
  startPrice: number
  endPrice: number
  totalReturn: number
  finalValue: number
}

/** "E se eu tivesse investido X há N anos?" (aporte único, sem retiradas) */
export function backtest(candles: Candle[], yearsBack: number, amount: number): Backtest | null {
  if (candles.length < 2) return null
  const last = candles[candles.length - 1]
  const target = last.t - yearsBack * 365.25 * 86400
  // exige dados cobrindo (quase) todo o período pedido
  if (candles[0].t > target + 20 * 86400) return null
  const start = candles.find((c) => c.t >= target)
  if (!start) return null
  const ret = price(last) / price(start) - 1
  return {
    yearsBack,
    startDate: start.t,
    startPrice: price(start),
    endPrice: price(last),
    totalReturn: ret,
    finalValue: amount * (1 + ret),
  }
}

/* ------------------------------------------------------------------ *
 *  Simulação de Monte Carlo
 * ------------------------------------------------------------------ */

export interface MCParams {
  initial: number
  monthly: number
  months: number
  /** média anual dos retornos logarítmicos (crescimento mediano = exp(mu) − 1) */
  mu: number
  /** volatilidade anual */
  sigma: number
  /** taxa anual de referência (ex.: CDI), em fração: 0.105 = 10,5% */
  benchmarkAnnual: number
  paths?: number
  seed?: number
}

export interface MCRow {
  m: number
  invested: number
  p10: number
  p50: number
  p90: number
  bench: number
}

export interface MCResult {
  rows: MCRow[]
  final: MCRow
  /** probabilidade de terminar com menos do que o total investido */
  probLoss: number
  /** probabilidade de terminar acima da referência (renda fixa) */
  probBeatBench: number
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function monteCarlo(p: MCParams): MCResult {
  const N = p.paths ?? 2000
  const rnd = mulberry32(p.seed ?? 20260101)
  const gauss = () => {
    let u = 0
    while (u === 0) u = rnd()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd())
  }
  const drift = p.mu / 12
  const vol = p.sigma / Math.sqrt(12)
  const benchMonthly = Math.pow(1 + p.benchmarkAnnual, 1 / 12)

  const vals = new Float64Array(N).fill(p.initial)
  const tmp = new Float64Array(N)
  let bench = p.initial
  const rows: MCRow[] = [
    { m: 0, invested: p.initial, p10: p.initial, p50: p.initial, p90: p.initial, bench: p.initial },
  ]

  for (let m = 1; m <= p.months; m++) {
    for (let i = 0; i < N; i++) vals[i] = (vals[i] + p.monthly) * Math.exp(drift + vol * gauss())
    bench = (bench + p.monthly) * benchMonthly
    tmp.set(vals)
    tmp.sort()
    rows.push({
      m,
      invested: p.initial + p.monthly * m,
      p10: tmp[Math.floor(N * 0.1)],
      p50: tmp[Math.floor(N * 0.5)],
      p90: tmp[Math.floor(N * 0.9)],
      bench,
    })
  }

  const final = rows[rows.length - 1]
  let loss = 0
  let beat = 0
  for (let i = 0; i < N; i++) {
    if (vals[i] < final.invested) loss++
    if (vals[i] > final.bench) beat++
  }
  return { rows, final, probLoss: loss / N, probBeatBench: beat / N }
}
