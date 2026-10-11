import { useCallback, useSyncExternalStore } from 'react'

const KEY = 'economic-favorites'

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

let list: string[] = load()
const subs = new Set<() => void>()

function save(next: string[]) {
  list = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f())
}

const subscribe = (cb: () => void) => {
  subs.add(cb)
  return () => subs.delete(cb)
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, () => list)
  const toggle = useCallback((symbol: string) => {
    save(list.includes(symbol) ? list.filter((s) => s !== symbol) : [...list, symbol])
  }, [])
  const isFavorite = useCallback((symbol: string) => favorites.includes(symbol), [favorites])
  return { favorites, toggle, isFavorite }
}
