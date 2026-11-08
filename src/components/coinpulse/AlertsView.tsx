'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, BellRing, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMarkets } from '@/hooks/use-markets'
import { apiFetch } from '@/lib/client-api'
import { useApp, useT } from '@/lib/store'
import { fmtPrice, pctClass, timeAgo } from '@/lib/format'
import type { AlertDTO } from '@/lib/types'
import { CoinIcon } from './CoinIcon'
import { PriceCell } from './PriceCell'
import { AlertCreateDialog } from './AlertCreateDialog'

export function AlertsView() {
  const t = useT()
  const lang = useApp((s) => s.lang)
  const setAlertCount = useApp((s) => s.setAlertCount)

  const { data: markets } = useMarkets()
  const priceMap = new Map((markets?.coins ?? []).map((c) => [c.id, c]))

  const alertsQuery = useQuery<{ alerts: AlertDTO[] }>({
    queryKey: ['alerts'],
    queryFn: () => apiFetch('/api/alerts'),
    refetchInterval: 60_000,
  })

  const [createOpen, setCreateOpen] = useState(false)

  const alerts = alertsQuery.data?.alerts ?? []
  const active = alerts.filter((a) => a.status === 'ACTIVE')
  const triggered = alerts.filter((a) => a.status === 'TRIGGERED')

  // keep nav badge in sync
  useEffect(() => {
    if (!alertsQuery.data) return
    const count = active.length
    if (useApp.getState().alertCount !== count) setAlertCount(count)
  }, [alertsQuery.data, active.length, setAlertCount])

  const remove = async (id: string) => {
    try {
      await apiFetch(`/api/alerts?id=${id}`, { method: 'DELETE' })
      toast.success(t('al.deleted'))
      alertsQuery.refetch()
    } catch {
      toast.error(t('err.server'))
    }
  }

  const distance = (a: AlertDTO) => {
    const price = priceMap.get(a.coinId)?.price
    if (!price) return null
    return ((a.targetPrice - price) / price) * 100
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-50">{t('al.title')}</h1>
          <p className="mt-0.5 text-xs text-zinc-500">{t('al.subtitle')}</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="ms-auto flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-400 to-purple-500 px-4 py-2.5 text-xs font-bold text-black shadow-[0_0_16px_rgba(167,139,250,0.3)] transition-transform hover:scale-[1.03]"
        >
          <Plus className="h-4 w-4" /> {t('al.create')}
        </button>
      </div>

      {alertsQuery.isLoading ? (
        <div className="glass flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400/70" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="glass flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-400/10">
            <Bell className="h-7 w-7 text-purple-400" />
          </span>
          <h2 className="mt-4 text-base font-bold text-zinc-200">{t('al.none')}</h2>
          <p className="mt-1 max-w-xs text-xs text-zinc-500">{t('al.noneHint')}</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-5 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-400 to-purple-500 px-5 py-2.5 text-xs font-bold text-black"
          >
            <Plus className="h-4 w-4" /> {t('al.create')}
          </button>
        </div>
      ) : (
        <>
          {/* Active */}
          {active.length > 0 && (
            <section aria-label={t('al.active')} className="space-y-2.5">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                {t('al.active')} ({active.length}) — {t('al.checking')}
              </h2>
              {active.map((a) => {
                const d = distance(a)
                const price = priceMap.get(a.coinId)?.price
                return (
                  <div key={a.id} className="glass flex items-center gap-3 px-4 py-3.5">
                    <CoinIcon symbol={a.symbol} size={34} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-100">
                        {a.symbol} {a.direction === 'ABOVE' ? '↑' : '↓'}{' '}
                        <span dir="ltr" className="tnum text-emerald-300">${fmtPrice(a.targetPrice)}</span>
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {t('al.current')}: {price ? <PriceCell price={price} className="text-zinc-300" /> : '—'}
                      </p>
                    </div>
                    {d !== null && (
                      <span
                        className={`tnum ms-auto hidden rounded-lg px-2 py-1 text-[11px] font-bold sm:block ${
                          Math.abs(d) < 2 ? 'bg-amber-400/15 text-amber-300 animate-pulse' : 'bg-white/5 text-zinc-400'
                        }`}
                      >
                        {t('al.distance')}: <span dir="ltr">{d >= 0 ? '+' : ''}{d.toFixed(2)}%</span>
                      </span>
                    )}
                    <button
                      onClick={() => remove(a.id)}
                      aria-label={t('al.deleted')}
                      className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-rose-400/10 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </section>
          )}

          {/* Triggered */}
          {triggered.length > 0 && (
            <section aria-label={t('al.triggered')} className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                {t('al.history')} ({triggered.length})
              </h2>
              {triggered.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3.5">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  <CoinIcon symbol={a.symbol} size={30} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-100">
                      {a.symbol} {a.direction === 'ABOVE' ? '↑' : '↓'}{' '}
                      <span dir="ltr" className="tnum">${fmtPrice(a.targetPrice)}</span>
                    </p>
                    <p className="text-[11px] text-emerald-400/80">{timeAgo(a.triggeredAt, lang)}</p>
                  </div>
                  <button
                    onClick={() => remove(a.id)}
                    aria-label={t('al.deleted')}
                    className="ms-auto rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-rose-400/10 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      <AlertCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        coins={markets?.coins ?? []}
        onSaved={() => alertsQuery.refetch()}
      />
    </div>
  )
}
