import { Suspense, lazy } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { Skeleton } from './components/ui'
import MarketPage from './pages/MarketPage'

// páginas pesadas (gráficos) carregam sob demanda para o site abrir mais rápido
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const AssetPage = lazy(() => import('./pages/AssetPage'))
const SimulatorPage = lazy(() => import('./pages/SimulatorPage'))
const LearnPage = lazy(() => import('./pages/LearnPage'))

function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <p className="text-5xl font-bold">404</p>
      <p className="mt-2 text-muted">Essa página não existe.</p>
      <Link to="/" className="btn-primary mt-5">
        Voltar ao mercado
      </Link>
    </div>
  )
}

const Fallback = (
  <div className="space-y-4" aria-busy="true">
    <Skeleton className="h-10 w-64" />
    <Skeleton className="h-64 w-full" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={Fallback}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<MarketPage />} />
          <Route path="explorar" element={<ExplorePage />} />
          <Route path="ativo/:symbol" element={<AssetPage />} />
          <Route path="simulador" element={<SimulatorPage />} />
          <Route path="aprender" element={<LearnPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
