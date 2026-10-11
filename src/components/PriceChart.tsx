import { useEffect, useMemo, useRef, useState } from 'react'
import { ColorType, CrosshairMode, createChart, type UTCTimestamp } from 'lightweight-charts'
import type { Candle } from '../../shared/types'
import { fmtNum } from '../lib/format'
import { useColors, withAlpha } from '../lib/theme'

interface Props {
  candles: Candle[]
  mode: 'candle' | 'area'
  height?: number
  intraday?: boolean
}

/** Gráfico de preços (TradingView Lightweight Charts — open source e gratuito). */
export function PriceChart({ candles, mode, height = 380, intraday = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const colors = useColors()
  const [hover, setHover] = useState<Candle | null>(null)

  // ajusta o horário para o fuso local do navegador (a biblioteca exibe em UTC)
  const data = useMemo(() => {
    const offset = new Date().getTimezoneOffset() * 60
    const out: (Candle & { time: UTCTimestamp })[] = []
    let prev = -Infinity
    for (const c of candles) {
      const time = (c.t - offset) as UTCTimestamp
      if (time <= prev) continue
      prev = time
      out.push({ ...c, time })
    }
    return out
  }, [candles])

  useEffect(() => {
    const el = ref.current
    if (!el || !data.length) return

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: colors.muted,
        fontFamily: 'inherit',
      },
      grid: {
        vertLines: { color: withAlpha(colors.line, 0.45) },
        horzLines: { color: withAlpha(colors.line, 0.45) },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: intraday, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
      localization: { locale: 'pt-BR' },
    })

    const byTime = new Map(data.map((d) => [d.time as number, d]))
    const up = data[data.length - 1].c >= data[0].c

    if (mode === 'candle') {
      const s = chart.addCandlestickSeries({
        upColor: colors.up,
        downColor: colors.down,
        wickUpColor: colors.up,
        wickDownColor: colors.down,
        borderVisible: false,
      })
      s.setData(data.map((d) => ({ time: d.time, open: d.o, high: d.h, low: d.l, close: d.c })))
    } else {
      const line = up ? colors.up : colors.down
      const s = chart.addAreaSeries({
        lineColor: line,
        topColor: withAlpha(line, 0.35),
        bottomColor: withAlpha(line, 0),
        lineWidth: 2,
      })
      s.setData(data.map((d) => ({ time: d.time, value: d.c })))
    }

    if (data.some((d) => d.v > 0)) {
      const vol = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
        lastValueVisible: false,
        priceLineVisible: false,
      })
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })
      vol.setData(
        data.map((d) => ({
          time: d.time,
          value: d.v,
          color: withAlpha(d.c >= d.o ? colors.up : colors.down, 0.35),
        })),
      )
    }

    chart.subscribeCrosshairMove((p) => {
      setHover(p.time ? (byTime.get(p.time as number) ?? null) : null)
    })
    chart.timeScale().fitContent()

    return () => {
      chart.remove()
    }
  }, [data, mode, intraday, colors])

  const shown = hover ?? data[data.length - 1]

  return (
    <div className="relative" style={{ height }}>
      {shown && (
        <div className="pointer-events-none absolute left-2 top-1 z-10 flex flex-wrap gap-x-3 text-xs text-muted">
          <span>
            {new Date(shown.t * 1000).toLocaleString('pt-BR', intraday ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'medium' })}
          </span>
          <span>A <b className="text-text">{fmtNum(shown.o)}</b></span>
          <span>Máx <b className="text-text">{fmtNum(shown.h)}</b></span>
          <span>Mín <b className="text-text">{fmtNum(shown.l)}</b></span>
          <span>F <b className="text-text">{fmtNum(shown.c)}</b></span>
        </div>
      )}
      <div ref={ref} className="h-full w-full" />
    </div>
  )
}
