'use client'

import { useQuery } from '@tanstack/react-query'
import type { MarketsResponse } from '@/lib/types'

export function useMarkets() {
  return useQuery<MarketsResponse>({
    queryKey: ['markets'],
    queryFn: async () => {
      const r = await fetch('/api/markets', { cache: 'no-store' })
      if (!r.ok) throw new Error('MARKETS_UNAVAILABLE')
      return r.json() as Promise<MarketsResponse>
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  })
}

export function useSparklines(symbols: string[]) {
  const key = [...new Set(symbols)].sort().join(',')
  return useQuery<{ sparklines: Record<string, number[]> }>({
    queryKey: ['sparklines', key],
    queryFn: async () => {
      const r = await fetch(`/api/sparklines?symbols=${encodeURIComponent(key)}`, { cache: 'no-store' })
      if (!r.ok) throw new Error('SPARKLINES_UNAVAILABLE')
      return r.json()
    },
    enabled: key.length > 0,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  })
}
