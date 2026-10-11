import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { fmtPct, trendClass } from '../lib/format'

export function Sparkline({
  values,
  width = 84,
  height = 28,
}: {
  values: number[]
  width?: number
  height?: number
}) {
  if (values.length < 2) return <div style={{ width, height }} aria-hidden />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * width).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`)
    .join(' ')
  const up = values[values.length - 1] >= values[0]
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={up ? 'text-up' : 'text-down'}
      aria-hidden
    >
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function AssetLogo({ code, size = 36 }: { code: string; size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand2 font-bold text-white"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.3) }}
      aria-hidden
    >
      {code.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()}
    </div>
  )
}

export function ChangePill({ value }: { value: number | undefined | null }) {
  const bg = value == null || value === 0 ? 'bg-panel2' : value > 0 ? 'bg-up/15' : 'bg-down/15'
  return (
    <span className={`inline-block min-w-[4.5rem] rounded-lg px-2 py-1 text-center text-xs font-semibold ${bg} ${trendClass(value)}`}>
      {fmtPct(value)}
    </span>
  )
}

export function LiveBadge({
  updatedAt,
  isFetching,
  isError,
}: {
  updatedAt?: number
  isFetching?: boolean
  isError?: boolean
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const secs = updatedAt ? Math.max(0, Math.round((now - updatedAt) / 1000)) : null
  const label = isError && !updatedAt ? 'Sem conexão com os dados' : secs == null ? 'Carregando…' : secs < 5 ? 'Atualizado agora' : `Atualizado há ${secs}s`
  const dot = isError ? 'bg-down' : 'bg-up'
  return (
    <span className="chip" title="Os dados se atualizam automaticamente enquanto esta aba está aberta.">
      <span className={`live-dot h-2 w-2 rounded-full ${dot} ${isFetching ? '' : 'opacity-80'}`} />
      {label}
    </span>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`flex gap-2 text-xs leading-relaxed text-muted ${className}`}>
      <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
      <span>
        Conteúdo educacional — não é recomendação de compra ou venda. Rentabilidade passada não garante resultados
        futuros e investir envolve risco de perda. Cotações podem ter atraso e vêm de fontes públicas gratuitas.
      </span>
    </p>
  )
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex items-start gap-3 border-down/40 p-4 text-sm" role="alert">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-down" aria-hidden />
      <div className="flex-1">
        <p className="font-medium">Não foi possível carregar os dados.</p>
        <p className="mt-0.5 text-muted">{message}</p>
      </div>
      {onRetry && (
        <button className="btn-ghost !px-3 !py-1.5" onClick={onRetry}>
          Tentar de novo
        </button>
      )}
    </div>
  )
}
