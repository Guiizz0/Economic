import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { UNIVERSE } from '../../shared/universe'
import type { Quote } from '../../shared/types'
import { fetchHistory, fetchMacro, fetchQuotes, fetchQuotesChunked, type RangeKey } from '../lib/api'

/**
 * Dados reativos: as consultas se atualizam sozinhas enquanto a aba está aberta
 * (refetchInterval) e também ao voltar para a aba (refetchOnWindowFocus).
 */
const UNIVERSE_SYMBOLS = UNIVERSE.map((a) => a.symbol)

export function useUniverseQuotes() {
  const q = useQuery({
    queryKey: ['universe-quotes'],
    queryFn: () => fetchQuotesChunked(UNIVERSE_SYMBOLS),
    refetchInterval: 30_000,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  })
  const map = useMemo(() => {
    const m: Record<string, Quote> = {}
    for (const x of q.data?.quotes ?? []) m[x.symbol] = x
    return m
  }, [q.data])
  return { ...q, map }
}

/** Cotações dos favoritos (inclui símbolos fora do universo). */
export function useFavoriteQuotes(symbols: string[]) {
  const list = useMemo(() => [...new Set(symbols)].slice(0, 40), [symbols])
  const q = useQuery({
    queryKey: ['favorite-quotes', list],
    queryFn: () => fetchQuotes(list),
    enabled: list.length > 0,
    refetchInterval: 30_000,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  })
  const map = useMemo(() => {
    const m: Record<string, Quote> = {}
    for (const x of q.data?.quotes ?? []) m[x.symbol] = x
    return m
  }, [q.data])
  return { ...q, map }
}

export function useQuote(symbol: string) {
  return useQuery({
    queryKey: ['quote', symbol],
    queryFn: async () => {
      const r = await fetchQuotes([symbol])
      const quote = r.quotes[0]
      if (!quote) throw new Error('Ativo não encontrado. Confira o código e tente de novo.')
      return { quote, updatedAt: r.updatedAt }
    },
    enabled: !!symbol,
    refetchInterval: 20_000,
    staleTime: 10_000,
    retry: 0,
  })
}

export function useHistory(symbol: string, range: RangeKey) {
  const intraday = range === '1D' || range === '5D'
  return useQuery({
    queryKey: ['history', symbol, range],
    queryFn: () => fetchHistory(symbol, range),
    enabled: !!symbol,
    staleTime: intraday ? 30_000 : 5 * 60_000,
    refetchInterval: range === '1D' ? 60_000 : range === '5D' ? 120_000 : false,
    retry: 1,
  })
}

export function useMacro() {
  return useQuery({
    queryKey: ['macro'],
    queryFn: fetchMacro,
    staleTime: 30 * 60_000,
    refetchInterval: 30 * 60_000,
    retry: 1,
  })
}
