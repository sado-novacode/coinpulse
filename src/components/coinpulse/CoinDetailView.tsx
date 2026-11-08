'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Bell, Wallet, Loader2, AlertCircle } from 'lucide-react'
import { useMarkets } from '@/hooks/use-markets'
import { useApp, useT } from '@/lib/store'
import { fmtCompact, fmtNum, pctClass } from '@/lib/format'
import { apiFetch } from '@/lib/client-api'
import type { RangeKey } from '@/lib/types'
import { CoinIcon } from './CoinIcon'
import { ChangeBadge } from './ChangeBadge'
import { PriceCell } from './PriceCell'
import { PriceChart } from './PriceChart'
import { HoldingDialog } from './HoldingDialog'
import { AlertCreateDialog } from './AlertCreateDialog'
import { Sparkline } from './Sparkline'

const RANGES: RangeKey[] = ['24h', '7d', '30d', '90d', '1y']

export function CoinDetailView() {
  const t = useT()
  const lang = useApp((s) => s.lang)
  const coinId = useApp((s) => s.coinId)
  const goMarket = useApp((s) => s.goMarket)
  const watchlist = useApp((s) => s.watchlist)
  const toggleWatch = useApp((s) => s.toggleWatch)

  const [range, setRange] = useState<RangeKey>('7d')
  const [holdingOpen, setHoldingOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  const { data } = useMarkets()
  const coins = data?.coins ?? []
  const coin = coins.find((c) => c.id === coinId) ?? null

  const chartQuery = useQuery<{ candles: import('@/lib/types').Candle[] }>({
    queryKey: ['candles', coin?.symbol, range],
    queryFn: async () => {
      const r = await fetch(`/api/chart?symbol=${coin!.symbol}&range=${range}`, { cache: 'no-store' })
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error || 'CHART_UNAVAILABLE')
      }
      return r.json()
    },
    enabled: !!coin,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  })

  // Fallback sparkline if the Binance pair doesn't exist
  const sparkFallback = useQuery<{ sparklines: Record<string, number[]> }>({
    queryKey: ['spark-fallback', coin?.symbol],
    queryFn: async () => {
      const r = await fetch(`/api/sparklines?symbols=${coin!.symbol}`, { cache: 'no-store' })
      if (!r.ok) throw new Error('NO_SPARK')
      return r.json()
    },
    enabled: !!coin && chartQuery.isError,
    staleTime: 5 * 60_000,
  })

  if (!coin) {
    return (
      <div className="glass mx-auto max-w-md px-6 py-14 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-zinc-500" />
        <p className="mt-3 text-sm text-zinc-400">{t('err.markets')}</p>
        <button
          onClick={goMarket}
          className="mt-4 rounded-lg bg-emerald-400/15 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/25"
        >
          {t('coin.back')}
        </button>
      </div>
    )
  }

  const watched = watchlist.includes(coin.id)
  const candles = chartQuery.data?.candles ?? []
  const fallback = sparkFallback.data?.sparklines?.[coin.symbol] ?? []
  const pairUnavailable = chartQuery.error instanceof Error && chartQuery.error.message === 'PAIR_UNAVAILABLE'
  const showFallbackArea = candles.length === 0 && fallback.length > 1 && !chartQuery.isLoading

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Back + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={goMarket}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('coin.back')}
        </button>
        <div className="ms-auto flex gap-2">
          <button
            onClick={() => setHoldingOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-3.5 py-2 text-xs font-bold text-black shadow-[0_0_16px_rgba(52,211,153,0.3)] transition-transform hover:scale-[1.03]"
          >
            <Wallet className="h-4 w-4" /> {t('coin.addPortfolio')}
          </button>
          <button
            onClick={() => setAlertOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-purple-400/40 bg-purple-400/10 px-3.5 py-2 text-xs font-bold text-purple-300 transition-all hover:bg-purple-400/20"
          >
            <Bell className="h-4 w-4" /> {t('coin.createAlert')}
          </button>
        </div>
      </div>

      {/* Coin header */}
      <div className="glass p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <CoinIcon symbol={coin.symbol} size={44} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-zinc-50">{coin.name}</h1>
              <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">{coin.symbol}</span>
              <span className="rounded-md bg-purple-400/15 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                #{coin.rank}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">{t('coin.live')}</p>
          </div>

          <div className="ms-auto flex items-center gap-3">
            <div className="text-end">
              <PriceCell price={coin.price} className="text-2xl font-extrabold text-zinc-50 sm:text-3xl" />
            </div>
            <ChangeBadge value={coin.ch24h} />
            <button
              onClick={() => toggleWatch(coin.id)}
              aria-label="Toggle watchlist"
              className={`rounded-lg p-1.5 transition-transform hover:scale-110 ${watched ? 'text-amber-300' : 'text-zinc-600 hover:text-amber-300'}`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill={watched ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Timeframes */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                  range === r ? 'bg-emerald-400/15 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.3)]' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t(`tf.${r}`)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <ChangeBadge value={coin.ch1h} size="sm" />
            <ChangeBadge value={coin.ch7d} size="sm" />
          </div>
        </div>

        {/* Chart */}
        <div className="mt-4" dir="ltr">
          {chartQuery.isLoading ? (
            <div className="flex h-[340px] items-center justify-center rounded-xl bg-white/[0.03] sm:h-[420px]">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-400/70" />
            </div>
          ) : candles.length > 0 ? (
            <PriceChart candles={candles} />
          ) : showFallbackArea ? (
            <div className="rounded-xl bg-white/[0.03] p-4">
              <Sparkline data={fallback} width={860} height={340} positive={coin.ch7d >= 0} />
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl bg-white/[0.03] px-6 text-center">
              <p className="text-xs text-zinc-500">{t('coin.chartUnavailable')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t('coin.mcap'), value: fmtCompact(coin.mcap) },
          { label: t('coin.vol24'), value: fmtCompact(coin.vol24) },
          { label: t('coin.csupply'), value: `${fmtNum(coin.csupply)} ${coin.symbol}` },
          {
            label: t('coin.msupply'),
            value: coin.msupply ? `${fmtNum(coin.msupply)} ${coin.symbol}` : t('coin.unlimited'),
          },
        ].map((s) => (
          <div key={s.label} className="glass px-4 py-3.5">
            <p className="text-[11px] font-medium text-zinc-500">{s.label}</p>
            <p className="tnum mt-1 truncate text-sm font-bold text-zinc-100" title={s.value}>
              {s.value}
            </p>
          </div>
        ))}
        <div className="glass hidden px-4 py-3.5 lg:block">
          <p className="text-[11px] font-medium text-zinc-500">{t('table.24h')}</p>
          <p className={`tnum mt-1 text-sm font-bold ${pctClass(coin.ch24h)}`}>{coin.ch24h.toFixed(2)}%</p>
        </div>
      </div>

      <HoldingDialog
        open={holdingOpen}
        onOpenChange={setHoldingOpen}
        coins={coins}
        preselected={coin}
        onSaved={() => useApp.getState().setView('portfolio')}
      />
      <AlertCreateDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        coins={coins}
        preselected={coin}
        onSaved={() => useApp.getState().setView('alerts')}
      />
    </div>
  )
}
