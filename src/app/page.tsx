'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useApp } from '@/lib/store'
import { Header } from '@/components/coinpulse/Header'
import { TickerTape } from '@/components/coinpulse/TickerTape'
import { MarketView } from '@/components/coinpulse/MarketView'
import { CoinDetailView } from '@/components/coinpulse/CoinDetailView'
import { PortfolioView } from '@/components/coinpulse/PortfolioView'
import { AlertsView } from '@/components/coinpulse/AlertsView'
import { Footer } from '@/components/coinpulse/Footer'
import { AlertChecker } from '@/components/coinpulse/AlertChecker'
import { useMarkets } from '@/hooks/use-markets'
import { Zap } from 'lucide-react'

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-purple-500 shadow-[0_0_30px_rgba(52,211,153,0.4)]">
        <Zap className="h-7 w-7 fill-black/85 text-black/85" />
      </span>
      <p className="text-sm font-bold tracking-wide text-zinc-500">CoinPulse</p>
    </div>
  )
}

function Shell() {
  const lang = useApp((s) => s.lang)
  const view = useApp((s) => s.view)
  const { data } = useMarkets()
  const coins = data?.coins ?? []

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
  }, [lang])

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  return (
    <div className={`flex min-h-screen flex-col ${lang === 'fa' ? 'font-vazir' : ''}`}>
      <Header />
      <TickerTape coins={coins} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {view === 'market' && <MarketView />}
        {view === 'coin' && <CoinDetailView />}
        {view === 'portfolio' && <PortfolioView />}
        {view === 'alerts' && <AlertsView />}
      </main>

      <Footer />
      <AlertChecker />
    </div>
  )
}

const emptySubscribe = () => () => {}

export default function Page() {
  // Hydration-safe mounted flag (true only on the client after hydration)
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1 } },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#060809]">
        <div className="absolute -top-32 start-1/4 h-96 w-96 rounded-full bg-emerald-500/[0.07] blur-3xl" />
        <div className="absolute bottom-0 end-1/5 h-96 w-96 rounded-full bg-purple-500/[0.06] blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/[0.04] blur-3xl" />
      </div>

      <Toaster theme="dark" position="top-center" richColors closeButton />

      {mounted ? <Shell /> : <Splash />}
    </QueryClientProvider>
  )
}
