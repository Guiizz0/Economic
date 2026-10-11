import { useMemo, useState } from 'react'
import { Search, Star } from 'lucide-react'
import { MARKET_LABEL, UNIVERSE, type Market } from '../../shared/universe'
import { AssetTable, type Row } from '../components/AssetTable'
import { ErrorBox, LiveBadge, PageHeader } from '../components/ui'
import { useFavoriteQuotes, useUniverseQuotes } from '../hooks/useMarket'
import { assetFor } from '../lib/assets'
import { useFavorites } from '../lib/favorites'

type Tab = 'ALL' | 'FAV' | Market

const TABS: { id: Tab; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'FAV', label: 'Favoritos' },
  ...(Object.keys(MARKET_LABEL) as Market[]).map((m) => ({ id: m as Tab, label: MARKET_LABEL[m] })),
]

export default function ExplorePage() {
  const { map, isLoading, isFetching, isError, error, dataUpdatedAt, refetch } = useUniverseQuotes()
  const { favorites } = useFavorites()
  const fav = useFavoriteQuotes(favorites)
  const [tab, setTab] = useState<Tab>('ALL')
  const [term, setTerm] = useState('')

  const rows: Row[] = useMemo(() => {
    const t = term.trim().toLowerCase()
    const base: Row[] =
      tab === 'FAV'
        ? favorites.map((s) => ({ asset: assetFor(s, fav.map[s]?.name), quote: fav.map[s] ?? map[s] }))
        : UNIVERSE.filter((a) => tab === 'ALL' || a.market === tab).map((a) => ({ asset: a, quote: map[a.symbol] }))
    return t
      ? base.filter((r) => r.asset.code.toLowerCase().includes(t) || r.asset.name.toLowerCase().includes(t) || (r.asset.sector ?? '').toLowerCase().includes(t))
      : base
  }, [tab, term, map, favorites, fav.map])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explorar ativos"
        subtitle="Ações, FIIs, ETFs, criptomoedas, moedas e commodities em um só lugar. Clique em um ativo para ver o gráfico e entender o momento dele."
        right={<LiveBadge updatedAt={dataUpdatedAt} isFetching={isFetching} isError={isError} />}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                tab === t.id ? 'border-brand bg-brand/15 text-text' : 'border-line bg-panel text-muted hover:text-text'
              }`}
            >
              {t.id === 'FAV' && <Star size={14} />}
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input className="input !pl-9" placeholder="Filtrar por nome, código ou setor" value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Filtrar ativos" />
        </div>
      </div>

      {isError && Object.keys(map).length === 0 && <ErrorBox message={String((error as Error)?.message ?? error)} onRetry={() => refetch()} />}

      {tab === 'FAV' && !favorites.length ? (
        <div className="card p-10 text-center text-sm text-muted">
          Você ainda não tem favoritos. Toque na <Star size={14} className="inline -translate-y-px" /> ao lado de um ativo para acompanhá-lo aqui.
        </div>
      ) : (
        <AssetTable rows={rows} loading={isLoading} />
      )}
    </div>
  )
}
