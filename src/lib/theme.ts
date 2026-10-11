import { useMemo, useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'
const KEY = 'economic-theme'

function initial(): Theme {
  try {
    const s = localStorage.getItem(KEY)
    if (s === 'light' || s === 'dark') return s
  } catch {
    /* storage indisponível */
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

let current: Theme = initial()
const subs = new Set<() => void>()

function apply() {
  document.documentElement.classList.toggle('light', current === 'light')
}
apply()

export function setTheme(t: Theme) {
  current = t
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* ignore */
  }
  apply()
  subs.forEach((f) => f())
}

export const toggleTheme = () => setTheme(current === 'dark' ? 'light' : 'dark')

export function useTheme(): Theme {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => current,
  )
}

export interface Colors {
  theme: Theme
  brand: string
  brand2: string
  up: string
  down: string
  muted: string
  line: string
  text: string
  panel: string
}

/** Cores do tema atual como strings `rgb(...)`, para bibliotecas de gráfico (canvas/SVG). */
export function useColors(): Colors {
  const theme = useTheme()
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement)
    const c = (name: string) => `rgb(${cs.getPropertyValue(name).trim().split(/\s+/).join(',')})`
    return {
      theme,
      brand: c('--brand'),
      brand2: c('--brand2'),
      up: c('--up'),
      down: c('--down'),
      muted: c('--muted'),
      line: c('--line'),
      text: c('--text'),
      panel: c('--panel'),
    }
  }, [theme])
}

export function withAlpha(rgb: string, alpha: number): string {
  return rgb.replace('rgb(', 'rgba(').replace(')', `,${alpha})`)
}
