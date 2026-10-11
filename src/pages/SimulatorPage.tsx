import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Info, RotateCcw } from 'lucide-react'
import { MARKET_LABEL, UNIVERSE, findAsset, resolveSymbol, type Market } from '../../shared/universe'
import { FanChart } from '../components/FanChart'
import { Disclaimer, ErrorBox, PageHeader, Skeleton } from '../components/ui'
import { useHistory, useMacro, useQuote } from '../hooks/useMarket'
import { assetFor } from '../lib/assets'
import { clamp, fmtDate, fmtMoney, fmtNum, fmtPct, trendClass } from '../lib/format'
import { backtest, computeStats, monteCarlo } from '../lib/simulate'

const MARKETS = Object.keys(MARKET_LABEL) as Market[]
const toNum = (v: string) => Math.max(0, Number(v.replace(',', '.')) || 0)

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  )
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: number }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone != null ? trendClass(tone) : ''}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  )
}

export default function SimulatorPage() {
  const [sp, setSp] = useSearchParams()
  const symbol = sp.get('ativo') ? resolveSymbol(sp.get('ativo')!) : 'BOVA11.SA'
  const [initial, setInitial] = useState('1000')
  const [monthly, setMonthly] = useState('300')
  const [years, setYears] = useState(10)
  const [override, setOverride] = useState<string | null>(null)
  const [customSymbol, setCustomSymbol] = useState('')

  const hist = useHistory(symbol, '5Y')
  const quote = useQuote(symbol)
  const macro = useMacro()

  const asset = assetFor(symbol, quote.data?.quote.name)
  const currency = hist.data?.currency ?? quote.data?.quote.currency ?? 'BRL'
  const stats = useMemo(() => (hist.data ? computeStats(hist.data.candles) : null), [hist.data])

  // retorno anual "mediano" histórico (CAGR sem aportes) e o valor usado na simulação
  const histG = stats ? Math.exp(stats.mu) - 1 : null
  const defaultG = histG == null ? null : clamp(histG, -0.2, 0.3)
  const wasClamped = histG != null && defaultG != null && Math.abs(histG - defaultG) > 1e-9
  const g = override != null ? clamp(Number(override.replace(',', '.')) / 100 || 0, -0.9, 1) : defaultG

  const cdi = macro.data?.cdi.last?.v
  const bench = cdi != null ? cdi / 100 : null

  const init = toNum(initial)
  const mon = toNum(monthly)

  const result = useMemo(() => {
    if (!stats || g == null || (init === 0 && mon === 0)) return null
    return monteCarlo({
      initial: init,
      monthly: mon,
      months: years * 12,
      mu: Math.log(1 + g),
      sigma: stats.sigma,
      benchmarkAnnual: bench ?? 0,
    })
  }, [stats, g, init, mon, years, bench])

  const tests = useMemo(
    () => (hist.data ? [1, 3, 5].map((y) => backtest(hist.data!.candles, y, init || 1000)) : []),
    [hist.data, init],
  )

  const setSymbol = (s: string) => {
    setSp({ ativo: s })
    setOverride(null)
  }

  const inUniverse = !!findAsset(symbol)
  const f = result?.final

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulador de investimentos"
        subtitle="Escolha um ativo, quanto vai investir e por quanto tempo. O simulador usa o comportamento real do preço nos últimos anos para projetar cenários — do pessimista ao otimista."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* ----------------------------- controles ----------------------------- */}
        <aside className="card h-fit space-y-5 p-5">
          <Field label="Ativo">
            <select className="input" value={symbol} onChange={(e) => setSymbol(e.target.value)} aria-label="Ativo">
              {!inUniverse && <option value={symbol}>{symbol}</option>}
              {MARKETS.map((m) => (
                <optgroup key={m} label={MARKET_LABEL[m]}>
                  {UNIVERSE.filter((a) => a.market === m).map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (customSymbol.trim()) {
                  setSymbol(resolveSymbol(customSymbol))
                  setCustomSymbol('')
                }
              }}
            >
              <input className="input" placeholder="ou digite outro código" value={customSymbol} onChange={(e) => setCustomSymbol(e.target.value)} aria-label="Outro código de ativo" />
              <button className="btn-ghost" type="submit">
                Ir
              </button>
            </form>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Valor inicial (${currency})`}>
              <input className="input" inputMode="decimal" value={initial} onChange={(e) => setInitial(e.target.value)} />
            </Field>
            <Field label={`Aporte mensal (${currency})`}>
              <input className="input" inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
            </Field>
          </div>

          <Field label={`Prazo: ${years} ${years === 1 ? 'ano' : 'anos'}`}>
            <input type="range" min={1} max={30} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full" aria-label="Prazo em anos" />
            <div className="mt-1 flex justify-between text-[11px] text-muted">
              <span>1 ano</span>
              <span>30 anos</span>
            </div>
          </Field>

          <Field
            label="Retorno anual esperado (%)"
            hint={histG != null ? `Média dos últimos ${fmtNum(stats!.years, 1)} anos: ${fmtPct(histG * 100, { digits: 1 })} ao ano.` : undefined}
          >
            <div className="flex gap-2">
              <input
                className="input"
                inputMode="decimal"
                value={override ?? (defaultG != null ? fmtNum(defaultG * 100, 1).replace('.', '') : '')}
                onChange={(e) => setOverride(e.target.value)}
                placeholder="—"
                aria-label="Retorno anual esperado em porcentagem"
              />
              <button className="btn-ghost !px-3" onClick={() => setOverride(null)} title="Voltar para a média histórica" aria-label="Usar média histórica">
                <RotateCcw size={16} />
              </button>
            </div>
          </Field>

          {wasClamped && override == null && (
            <p className="flex gap-2 rounded-xl bg-panel2 p-3 text-xs text-muted">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-400" />
              O histórico recente ({fmtPct(histG! * 100, { digits: 0 })} ao ano) é extremo; limitamos a projeção a {fmtPct(defaultG! * 100, { digits: 0 })} para não criar expectativas irreais. Você pode editar o campo acima.
            </p>
          )}
        </aside>

        {/* ----------------------------- resultados ---------------------------- */}
        <div className="min-w-0 space-y-6">
          {hist.isError && <ErrorBox message={(hist.error as Error).message} onRetry={() => hist.refetch()} />}
          {!hist.isError && hist.data && !stats && (
            <ErrorBox message="Este ativo não tem histórico suficiente para uma simulação confiável (precisamos de pelo menos alguns meses de dados)." />
          )}

          {hist.isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-[340px] w-full" />
            </div>
          )}

          {!result && stats && (
            <div className="card p-8 text-center text-sm text-muted">Informe um valor inicial ou um aporte mensal para ver a simulação.</div>
          )}

          {result && f && stats && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Você investe" value={fmtMoney(f.invested, currency, 0)} sub={`em ${years} ${years === 1 ? 'ano' : 'anos'}`} />
                <Metric
                  label="Cenário provável"
                  value={fmtMoney(f.p50, currency, 0)}
                  sub={`${f.p50 >= f.invested ? 'Ganho' : 'Perda'} de ${fmtMoney(Math.abs(f.p50 - f.invested), currency, 0)}`}
                  tone={f.p50 - f.invested}
                />
                <Metric label="Pessimista (10%)" value={fmtMoney(f.p10, currency, 0)} sub="Em 9 de cada 10 cenários você termina acima disso" />
                <Metric label="Otimista (90%)" value={fmtMoney(f.p90, currency, 0)} sub="Só 1 em cada 10 cenários supera isso" />
              </div>

              <div className="card p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">Como seu dinheiro pode evoluir</h2>
                  <div className="flex flex-wrap gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1.5"><i className="h-0.5 w-5 bg-brand" /> Provável</span>
                    <span className="flex items-center gap-1.5"><i className="h-3 w-5 rounded-sm bg-brand/25" /> Faixa 10%–90%</span>
                    <span className="flex items-center gap-1.5"><i className="h-0.5 w-5 border-t border-dashed border-muted" /> Investido</span>
                    {bench != null && <span className="flex items-center gap-1.5"><i className="h-0.5 w-5 border-t border-dotted border-brand2" /> Renda fixa (CDI)</span>}
                  </div>
                </div>
                <FanChart rows={result.rows} currency={currency} showBench={bench != null} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="card space-y-2 p-4">
                  <h3 className="text-sm font-semibold">E a renda fixa?</h3>
                  {bench != null ? (
                    <>
                      <p className="text-sm text-muted">
                        Com o CDI atual ({fmtNum(cdi!)}% ao ano, bruto de impostos), o mesmo dinheiro chegaria a{' '}
                        <b className="text-text">{fmtMoney(f.bench, currency, 0)}</b>.
                      </p>
                      <p className="text-sm text-muted">
                        Em <b className="text-text">{fmtPct(result.probBeatBench * 100, { signed: false, digits: 0 })}</b> dos cenários simulados este ativo termina à frente da renda fixa — e em{' '}
                        <b className="text-text">{fmtPct(result.probLoss * 100, { signed: false, digits: 0 })}</b> termina com menos do que você colocou.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted">Não foi possível carregar o CDI agora, então a comparação com a renda fixa está indisponível.</p>
                  )}
                </div>

                <div className="card space-y-2 p-4">
                  <h3 className="text-sm font-semibold">O que o histórico mostra ({fmtNum(stats.years, 1)} anos)</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-muted">Retorno anual médio</dt>
                    <dd className={`text-right font-semibold ${trendClass(stats.cagr)}`}>{fmtPct(stats.cagr * 100, { digits: 1 })}</dd>
                    <dt className="text-muted">Oscilação anual</dt>
                    <dd className="text-right font-semibold">{fmtNum(stats.sigma * 100, 0)}%</dd>
                    <dt className="text-muted">Maior queda</dt>
                    <dd className="text-right font-semibold text-down">{fmtPct(stats.maxDrawdown * 100, { digits: 0 })}</dd>
                  </dl>
                </div>
              </div>

              <div className="card p-4">
                <h3 className="text-sm font-semibold">E se você tivesse investido no passado?</h3>
                <p className="mb-3 text-xs text-muted">Aporte único de {fmtMoney(init || 1000, currency, 0)}, sem retiradas, com dividendos reinvestidos quando a fonte informa.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[1, 3, 5].map((y, i) => {
                    const t = tests[i]
                    return (
                      <div key={y} className="rounded-xl border border-line bg-panel2 p-3">
                        <div className="text-xs text-muted">Há {y} {y === 1 ? 'ano' : 'anos'}</div>
                        {t ? (
                          <>
                            <div className={`text-lg font-bold ${trendClass(t.totalReturn)}`}>{fmtMoney(t.finalValue, currency, 0)}</div>
                            <div className="text-xs text-muted">
                              {fmtPct(t.totalReturn * 100, { digits: 1 })} desde {fmtDate(new Date(t.startDate * 1000).toISOString().slice(0, 10))}
                            </div>
                          </>
                        ) : (
                          <div className="mt-1 text-sm text-muted">Sem histórico suficiente</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          <div className="card flex gap-3 p-4 text-xs leading-relaxed text-muted">
            <Info size={16} className="mt-0.5 shrink-0 text-brand2" aria-hidden />
            <div>
              <p className="mb-1 font-semibold text-text">Como a simulação funciona</p>
              Sorteamos 2.000 trajetórias possíveis para o preço de {asset.code}, usando a oscilação histórica real do ativo e o retorno anual esperado que você definiu. A faixa do gráfico mostra onde ficam 80% dos
              resultados. É uma estimativa estatística: o futuro pode ser melhor ou pior, impostos e taxas não estão incluídos
              {currency !== 'BRL' ? ` e os valores estão em ${currency} (o câmbio também influencia o resultado em reais)` : ''}.
            </div>
          </div>
          <Disclaimer />
        </div>
      </div>
    </div>
  )
}
