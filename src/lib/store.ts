'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { makeT, type Lang } from '@/lib/i18n'

export type View = 'market' | 'coin' | 'portfolio' | 'alerts'

interface AppState {
  lang: Lang
  setLang: (l: Lang) => void
  toggleLang: () => void

  view: View
  coinId: string | null
  openCoin: (id: string) => void
  goMarket: () => void
  setView: (v: View) => void

  watchlist: string[] // coin ids
  toggleWatch: (id: string) => void
  isWatched: (id: string) => boolean

  deviceId: string
  alertCount: number
  setAlertCount: (n: number) => void
}

function makeId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `cp-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  }
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      lang: 'fa',
      setLang: (l) => set({ lang: l }),
      toggleLang: () => set({ lang: get().lang === 'fa' ? 'en' : 'fa' }),

      view: 'market',
      coinId: null,
      openCoin: (id) => set({ view: 'coin', coinId: id }),
      goMarket: () => set({ view: 'market', coinId: null }),
      setView: (v) => set({ view: v, coinId: v === 'coin' ? get().coinId : null }),

      watchlist: [],
      toggleWatch: (id) =>
        set({
          watchlist: get().watchlist.includes(id)
            ? get().watchlist.filter((w) => w !== id)
            : [...get().watchlist, id],
        }),
      isWatched: (id) => get().watchlist.includes(id),

      deviceId: makeId(),
      alertCount: 0,
      setAlertCount: (n) => set({ alertCount: n }),
    }),
    {
      name: 'coinpulse-state',
      partialize: (s) => ({ lang: s.lang, watchlist: s.watchlist, deviceId: s.deviceId }),
    },
  ),
)

export function useT(): (key: string) => string {
  const lang = useApp((s) => s.lang)
  return makeT(lang)
}
