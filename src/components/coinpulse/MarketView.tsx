'use client'

import { useMemo, useState } from 'react'
import { Loader2, RefreshCw, Search, Star, TrendingDown, TrendingUp, Globe, Star as StarIcon } from 'lucide-react'
import { useMarkets, useSparklines } from '@/hooks/use-markets'
import { useApp, useT } from '@/lib/store'
import { fmtCompact, fmtPct, pctClass } from '@/lib/format'
import { CoinIcon } from './CoinIcon'
import { ChangeBadge } from './ChangeBadge'
import { PriceCell } from './PriceCell'
import { Sparkline } from './Sparkline'

type Filter = 'all' | 'watchlist' | 'gainers' | 'losers'

export function MarketView() {
  const t = useT()
  const lang = useApp((s) => s.lang)
  const { data, isLoading, isError, refetch, isFetching } = useMarkets()
  const watchlist = useApp((s) => s.watchlist)
  const openCoin = useApp((s) => s.openCoin)
  const toggleWatch = useApp((s) => s.toggleWatch)

  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const coins = data?.coins ?? []
  const global = data?.global

  const filtered = useMemo(() => {
    let list = [...coins]
    if (filter === 'watchlist') list = list.filter((c) => watchlist.includes(c.id))
    if (filter === 'gainers') list = list.filter((c) => c.ch24h > 0).sort((a, b) => b.ch24h - a.ch24h)
    if (filter === 'losers') list = list.filter((c) => c.ch24h < 0).sort((a, b) => a.ch24h - b.ch24h)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
    if (filter === 'all') list.sort((a, b) => a.rank - b.rank)
    return list.slice(0, 100)
  }, [coins, filter, search, watchlist])

  const sparkQuery = useSparklines(filtered.slice(0, 60).map((c) => c.symbol))

  const filters: Array<{ key: Filter; label: string; icon?: typeof Globe }> = [
    { key: 'all', label: t('filters.all'), icon: Globe },
    { key: 'watchlist', label: t('filters.watchlist'), icon: StarIcon },
    { key: 'gainers', label: t('filters.gainers'), icon: TrendingUp },
    { key: 'losers', label: t('filters.losers'), icon: TrendingDown },
  ]

  return (
    <div className="space-y-5">
      {/* Global stats */}
      <section aria-label="Global market stats" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t('stats.mcap'), value: fmtCompact(global?.mcap ?? 0), change: global?.mcapChange },
          { label: t('stats.volume'), value: fmtCompact(global?.volume ?? 0) },
          { label: t('stats.btc'), value: `${global?.btcDominance?.toFixed(1) ?? '—'}%` },
          { label: t('stats.coins'), value: global?.coinsCount ? global.coinsCount.toLocaleString('en-US') : '—' },
        ].map((s) => (
          <div key={s.label} className="glass px-4 py-3.5">
            <p className="text-[11px] font-medium text-zinc-500">{s.label}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="tnum text-base font-bold text-zinc-100 sm:text-lg">{s.value}</span>
              {typeof s.change === 'number' && s.change !== 0 && (
                <span dir="ltr" className={`tnum text-[11px] font-semibold ${pctClass(s.change)}`}>
                  {s.change >= 0 ? '+' : ''}
                  {s.change.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 ps-9 pe-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-emerald-400/50 focus:bg-white/[0.07]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1">
          {filters.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === key ? 'bg-emerald-400/15 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.3)]' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => refetch()}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
          aria-label={t('err.retry')}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="max-h-[62vh] overflow-x-auto overflow-y-auto scroll-slim">
          <table className="w-full min-w-[350px] sm:min-w-[640px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[#0a0e14]/95 backdrop-blur">
              <tr className="text-start text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-3 text-start font-semibold w-10"></th>
                <th className="hidden px-3 py-3 text-start font-semibold w-10 sm:table-cell">{t('table.rank')}</th>
                <th className="px-3 py-3 text-start font-semibold">{t('table.coin')}</th>
                <th className="px-3 py-3 text-end font-semibold">{t('table.price')}</th>
                <th className="hidden px-3 py-3 text-end font-semibold md:table-cell">{t('table.1h')}</th>
                <th className="px-3 py-3 text-end font-semibold">{t('table.24h')}</th>
                <th className="hidden px-3 py-3 text-end font-semibold md:table-cell">{t('table.7d')}</th>
                <th className="hidden px-3 py-3 text-end font-semibold lg:table-cell">{t('table.mcap')}</th>
                <th className="hidden px-3 py-3 text-end font-semibold lg:table-cell">{t('table.spark')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-t border-white/5">
                    <td colSpan={9} className="px-3 py-3.5">
                      <div className="h-6 animate-pulse rounded bg-white/5" />
                    </td>
                  </tr>
                ))}

              {isError && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <p className="text-sm text-zinc-400">{t('err.markets')}</p>
                    <button
                      onClick={() => refetch()}
                      className="mx-auto mt-3 flex items-center gap-2 rounded-lg bg-emerald-400/15 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/25"
                    >
                      <Loader2 className="h-4 w-4" /> {t('err.retry')}
                    </button>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-sm text-zinc-500">
                    {filter === 'watchlist' && !search ? t('table.emptyWatchlist') : t('table.empty')}
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                filtered.map((c) => {
                  const watched = watchlist.includes(c.id)
                  const spark = sparkQuery.data?.sparklines?.[c.symbol] ?? []
                  return (
                    <tr
                      key={c.id}
                      onClick={() => openCoin(c.id)}
                      className="group cursor-pointer border-t border-white/5 transition-colors hover:bg-white/[0.04]"
                    >
                      <td className="px-3 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleWatch(c.id)
                          }}
                          aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                          className={`rounded-md p-1 transition-all hover:scale-110 ${
                            watched ? 'text-amber-300' : 'text-zinc-600 hover:text-amber-300'
                          }`}
                        >
                          <Star className={`h-4 w-4 ${watched ? 'fill-amber-300' : ''}`} />
                        </button>
                      </td>
                      <td className="tnum hidden px-3 py-3 text-xs text-zinc-500 sm:table-cell">{c.rank}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 max-w-[150px] sm:gap-2.5 sm:max-w-none">
                          <CoinIcon symbol={c.symbol} size={26} />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-zinc-100">{c.name}</p>
                            <p className="text-[11px] font-medium text-zinc-500">{c.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-end">
                        <PriceCell price={c.price} className="text-[13px] font-semibold text-zinc-100" />
                      </td>
                      <td className={`tnum hidden px-3 py-3 text-end text-xs font-medium md:table-cell ${pctClass(c.ch1h)}`}>
                        <span dir="ltr">{fmtPct(c.ch1h)}</span>
                      </td>
                      <td className="px-3 py-3 text-end">
                        <ChangeBadge value={c.ch24h} size="sm" />
                      </td>
                      <td className={`tnum hidden px-3 py-3 text-end text-xs font-medium md:table-cell ${pctClass(c.ch7d)}`}>
                        <span dir="ltr">{fmtPct(c.ch7d)}</span>
                      </td>
                      <td className="tnum hidden px-3 py-3 text-end text-xs text-zinc-300 lg:table-cell">
                        {fmtCompact(c.mcap)}
                      </td>
                      <td className="hidden px-3 py-2 lg:table-cell">
                        <div className="flex justify-end">
                          <Sparkline data={spark} positive={c.ch7d >= 0} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
