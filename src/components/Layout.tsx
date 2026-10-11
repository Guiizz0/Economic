import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Calculator, Compass, GraduationCap, LayoutDashboard, Moon, Search, Sun } from 'lucide-react'
import { resolveSymbol, searchAssets } from '../../shared/universe'
import { useUniverseQuotes } from '../hooks/useMarket'
import { assetPath, priceLabel } from '../lib/assets'
import { assetFor } from '../lib/assets'
import { fmtPct, trendClass } from '../lib/format'
import { toggleTheme, useTheme } from '../lib/theme'
import { AssetLogo, Disclaimer } from './ui'

const NAV = [
  { to: '/', label: 'Mercado', icon: LayoutDashboard, end: true },
  { to: '/explorar', label: 'Explorar', icon: Compass, end: false },
  { to: '/simulador', label: 'Simulador', icon: Calculator, end: false },
  { to: '/aprender', label: 'Aprender', icon: GraduationCap, end: false },
]

const TAPE = ['^BVSP', '^GSPC', 'BRL=X', 'BTC-USD', 'PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'WEGE3.SA', 'AAPL', 'NVDA', 'ETH-USD', 'GC=F']

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Economic — página inicial">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand2 shadow-glow">
        <svg width="20" height="20" viewBox="0 0 64 64" aria-hidden>
          <path d="M12 46 L26 30 L35 39 L52 16" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight">
        Econom<span className="bg-gradient-to-r from-brand to-brand2 bg-clip-text text-transparent">ic</span>
      </span>
    </Link>
  )
}

function SearchBox() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const results = useMemo(() => searchAssets(q), [q])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const go = (symbol: string) => {
    if (!symbol) return
    nav(assetPath(symbol))
    setQ('')
    setOpen(false)
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          go(results[0]?.symbol ?? resolveSymbol(q))
        }}
        role="search"
      >
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          className="input !pl-9"
          placeholder="Buscar ativo: PETR4, AAPL, Bitcoin…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          aria-label="Buscar ativo"
        />
      </form>
      {open && q.trim() && (
        <div className="card absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden shadow-2xl">
          {results.map((a) => (
            <button
              key={a.symbol}
              onMouseDown={() => go(a.symbol)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-panel2"
            >
              <AssetLogo code={a.code} size={28} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{a.code}</span>
                <span className="block truncate text-xs text-muted">{a.name}</span>
              </span>
              <span className="chip">{a.kind}</span>
            </button>
          ))}
          <button onMouseDown={() => go(resolveSymbol(q))} className="w-full border-t border-line px-3 py-2.5 text-left text-xs text-muted hover:bg-panel2">
            Abrir “{resolveSymbol(q)}” diretamente
          </button>
        </div>
      )}
    </div>
  )
}

function TickerTape() {
  const { map } = useUniverseQuotes()
  const items = TAPE.map((s) => map[s]).filter(Boolean)
  if (!items.length) return <div className="h-9 border-b border-line bg-panel" aria-hidden />
  const row = items.map((q) => {
    const a = assetFor(q.symbol, q.name)
    return (
      <Link key={q.symbol} to={assetPath(q.symbol)} className="flex items-center gap-2 px-5 text-xs hover:text-brand2">
        <span className="font-semibold">{a.code}</span>
        <span className="text-muted">{priceLabel(a.kind, q)}</span>
        <span className={trendClass(q.changePct)}>{fmtPct(q.changePct)}</span>
      </Link>
    )
  })
  return (
    <div className="ticker-wrap overflow-hidden border-b border-line bg-panel" aria-label="Cotações em destaque">
      <div className="ticker-track flex w-max items-center py-2">
        <div className="flex">{row}</div>
        <div className="flex" aria-hidden>
          {row}
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const theme = useTheme()
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])

  return (
    <div className="min-h-screen lg:flex">
      {/* barra lateral (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-panel p-5 lg:flex">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1" aria-label="Principal">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand/15 text-text shadow-glow' : 'text-muted hover:bg-panel2 hover:text-text'
                }`
              }
            >
              <Icon size={18} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-line bg-panel2 p-4 text-xs text-muted">
          <p className="mb-1 font-semibold text-text">Novo por aqui?</p>
          Comece pela aba <Link to="/aprender" className="text-brand2 underline">Aprender</Link> e depois teste o{' '}
          <Link to="/simulador" className="text-brand2 underline">Simulador</Link>.
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex w-full items-center justify-end gap-3 lg:ml-0 lg:justify-between">
              <div className="hidden w-full max-w-md sm:block">
                <SearchBox />
              </div>
              <button
                onClick={toggleTheme}
                className="btn-ghost !p-2.5"
                aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
          <div className="px-4 pb-3 sm:hidden">
            <SearchBox />
          </div>
          <TickerTape />
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          <Outlet />
          <footer className="mt-12 border-t border-line pt-6">
            <Disclaimer />
          </footer>
        </main>
      </div>

      {/* navegação inferior (celular) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-panel/95 backdrop-blur lg:hidden" aria-label="Principal">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${isActive ? 'text-brand2' : 'text-muted'}`
            }
          >
            <Icon size={20} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
