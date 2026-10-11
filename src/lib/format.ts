const LOCALE = 'pt-BR'

export function fmtNum(n: number | undefined | null, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)
}

export function fmtMoney(n: number | undefined | null, currency = 'BRL', digits = 2): string {
  if (n == null || !Number.isFinite(n)) return '—'
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n)
  } catch {
    return `${fmtNum(n, digits)} ${currency}`
  }
}

export function fmtPct(n: number | undefined | null, opts: { signed?: boolean; digits?: number } = {}): string {
  const { signed = true, digits = 2 } = opts
  if (n == null || !Number.isFinite(n)) return '—'
  const s = fmtNum(Math.abs(n), digits)
  const sign = n > 0 ? (signed ? '+' : '') : n < 0 ? '−' : ''
  return `${sign}${s}%`
}

export function fmtCompact(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return '—'
  return new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function trendClass(n: number | undefined | null): string {
  if (n == null || n === 0) return 'text-muted'
  return n > 0 ? 'text-up' : 'text-down'
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
