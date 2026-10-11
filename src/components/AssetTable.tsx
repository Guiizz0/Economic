import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, Star } from 'lucide-react'
import type { Asset } from '../../shared/universe'
import type { Quote } from '../../shared/types'
import { assetPath, priceLabel } from '../lib/assets'
import { fmtCompact } from '../lib/format'
import { useFavorites } from '../lib/favorites'
import { AssetLogo, ChangePill, Skeleton, Sparkline } from './ui'

export interface Row {
  asset: Asset
  quote?: Quote
}

type SortKey = 'name' | 'price' | 'changePct' | 'volume'

export function AssetTable({ rows, loading }: { rows: Row[]; loading?: boolean }) {
  const nav = useNavigate()
  const { isFavorite, toggle } = useFavorites()
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const val = (r: Row): number | string => {
      switch (sort.key) {
        case 'name':
          return r.asset.code
        case 'price':
          return r.quote?.price ?? -Infinity
        case 'volume':
          return r.quote?.volume ?? -Infinity
        default:
          return r.quote?.changePct ?? -Infinity
      }
    }
    return [...rows].sort((a, b) => {
      const x = val(a)
      const y = val(b)
      return (typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number)) * sort.dir
    })
  }, [rows, sort])

  const head = (key: SortKey, label: string, align = 'text-right', extra = '') => (
    <th className={`px-3 py-3 font-medium ${align} ${extra}`}>
      <button
        className="inline-flex items-center gap-1 hover:text-text"
        onClick={() => setSort((s) => (s?.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === 'name' ? 1 : -1 }))}
      >
        {label}
        {sort?.key === key && (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  )

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="w-10 px-3 py-3" aria-label="Favorito" />
              {head('name', 'Ativo', 'text-left')}
              {head('price', 'Preço')}
              {head('changePct', 'Dia')}
              <th className="hidden px-3 py-3 text-right font-medium sm:table-cell">1 mês</th>
              {head('volume', 'Volume', 'text-right', 'hidden lg:table-cell')}
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ asset, quote }) => (
              <tr
                key={asset.symbol}
                onClick={() => nav(assetPath(asset.symbol))}
                className="cursor-pointer border-b border-line/60 transition last:border-0 hover:bg-panel2"
              >
                <td className="px-3 py-3">
                  <button
                    aria-label={isFavorite(asset.symbol) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    aria-pressed={isFavorite(asset.symbol)}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(asset.symbol)
                    }}
                    className="text-muted hover:text-text"
                  >
                    <Star size={16} className={isFavorite(asset.symbol) ? 'fill-yellow-400 text-yellow-400' : ''} />
                  </button>
                </td>
                <td className="px-3 py-3">
                  <Link to={assetPath(asset.symbol)} onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
                    <AssetLogo code={asset.code} />
                    <span className="min-w-0">
                      <span className="block font-semibold">{asset.code}</span>
                      <span className="block max-w-[190px] truncate text-xs text-muted">{asset.name}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-right font-medium">
                  {quote ? priceLabel(asset.kind, quote) : loading ? <Skeleton className="ml-auto h-4 w-20" /> : '—'}
                </td>
                <td className="px-3 py-3 text-right">
                  {quote ? <ChangePill value={quote.changePct} /> : loading ? <Skeleton className="ml-auto h-6 w-16" /> : '—'}
                </td>
                <td className="hidden px-3 py-3 sm:table-cell">
                  <div className="flex justify-end">{quote ? <Sparkline values={quote.spark} /> : null}</div>
                </td>
                <td className="hidden px-3 py-3 text-right text-muted lg:table-cell">{fmtCompact(quote?.volume)}</td>
              </tr>
            ))}
            {!sorted.length && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted">
                  Nenhum ativo encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
