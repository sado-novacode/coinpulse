'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Plus, Pencil, Trash2, TrendingUp, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useMarkets } from '@/hooks/use-markets'
import { apiFetch } from '@/lib/client-api'
import { useApp, useT } from '@/lib/store'
import { fmtCompact, fmtNum, pctClass } from '@/lib/format'
import type { HoldingDTO } from '@/lib/types'
import { CoinIcon } from './CoinIcon'
import { ChangeBadge } from './ChangeBadge'
import { PriceCell } from './PriceCell'
import { HoldingDialog } from './HoldingDialog'

const COLORS = ['#34d399', '#a78bfa', '#fbbf24', '#fb7185', '#2dd4bf', '#f472b6', '#e879f9', '#fde047', '#4ade80', '#c084fc']

export function PortfolioView() {
  const t = useT()
  const lang = useApp((s) => s.lang)
  const setView = useApp((s) => s.setView)

  const { data: markets } = useMarkets()
  const coins = markets?.coins ?? []
  const priceMap = new Map(coins.map((c) => [c.id, c]))

  const holdingsQuery = useQuery<{ holdings: HoldingDTO[] }>({
    queryKey: ['portfolio'],
    queryFn: () => apiFetch('/api/portfolio'),
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<HoldingDTO | null>(null)

  const holdings = holdingsQuery.data?.holdings ?? []

  const rows = holdings.map((h) => {
    const coin = priceMap.get(h.coinId)
    const price = coin?.price ?? h.buyPrice
    const value = h.amount * price
    const cost = h.amount * h.buyPrice
    const pnl = value - cost
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0
    return { ...h, coin, price, value, cost, pnl, pnlPct, ch24h: coin?.ch24h ?? 0 }
  })

  const totalValue = rows.reduce((s, r) => s + r.value, 0)
  const totalCost = rows.reduce((s, r) => s + r.cost, 0)
  const totalPnl = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const best = rows.length > 0 ? rows.reduce((a, b) => (b.pnlPct > a.pnlPct ? b : a)) : null

  const donut = rows
    .sort((a, b) => b.value - a.value)
    .map((r, i) => ({ name: r.symbol, value: r.value, color: COLORS[i % COLORS.length] }))

  const remove = async (id: string) => {
    try {
      await apiFetch(`/api/portfolio?id=${id}`, { method: 'DELETE' })
      toast.success(t('pf.deleted'))
      holdingsQuery.refetch()
    } catch {
      toast.error(t('err.server'))
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Title row */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-50">{t('pf.title')}</h1>
          <p className="mt-0.5 text-xs text-zinc-500">{t('pf.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          className="ms-auto flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2.5 text-xs font-bold text-black shadow-[0_0_16px_rgba(52,211,153,0.3)] transition-transform hover:scale-[1.03]"
        >
          <Plus className="h-4 w-4" /> {t('pf.add')}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="glass px-4 py-4">
          <p className="text-[11px] font-medium text-zinc-500">{t('pf.totalValue')}</p>
          <p className="tnum mt-1 text-lg font-extrabold text-zinc-50 sm:text-xl">
            {rows.length ? <PriceCell price={totalValue} /> : '$0'}
          </p>
        </div>
        <div className="glass px-4 py-4">
          <p className="text-[11px] font-medium text-zinc-500">{t('pf.totalPnl')}</p>
          <p dir="ltr" className={`tnum mt-1 text-lg font-extrabold ${pctClass(totalPnl)}`}>
            {totalPnl === 0 ? '$0.00' : `${totalPnl > 0 ? '+' : ''}${fmtCompact(totalPnl)}`}{' '}
            <span className="text-xs font-bold">({totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%)</span>
          </p>
        </div>
        <div className="glass px-4 py-4">
          <p className="text-[11px] font-medium text-zinc-500">{t('pf.holdings')}</p>
          <p className="tnum mt-1 text-lg font-extrabold text-zinc-50">{rows.length}</p>
        </div>
        <div className="glass px-4 py-4">
          <p className="text-[11px] font-medium text-zinc-500">{t('pf.best')}</p>
          {best ? (
            <div className="mt-1 flex items-center gap-2">
              <CoinIcon symbol={best.symbol} size={22} />
              <span className="text-sm font-bold text-zinc-100">{best.symbol}</span>
              <span className={`tnum text-xs font-bold ${pctClass(best.pnlPct)}`}>
                {best.pnlPct >= 0 ? '+' : ''}
                {best.pnlPct.toFixed(1)}%
              </span>
            </div>
          ) : (
            <p className="mt-1 text-lg font-extrabold text-zinc-600">—</p>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        /* Empty state */
        <div className="glass flex flex-col items-center px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10">
            <Wallet className="h-7 w-7 text-emerald-400" />
          </span>
          <h2 className="mt-4 text-base font-bold text-zinc-200">{t('pf.empty')}</h2>
          <p className="mt-1 max-w-xs text-xs text-zinc-500">{t('pf.emptyHint')}</p>
          <button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
            className="mt-5 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-5 py-2.5 text-xs font-bold text-black"
          >
            <Plus className="h-4 w-4" /> {t('pf.add')}
          </button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Holdings table */}
          <div className="glass overflow-hidden lg:col-span-3">
            <div className="max-h-[52vh] overflow-x-auto overflow-y-auto scroll-slim">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="sticky top-0 bg-[#0a0e14]/95 backdrop-blur">
                  <tr className="text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="px-3 py-3 text-start font-semibold">{t('table.coin')}</th>
                    <th className="px-3 py-3 text-end font-semibold">{t('pf.amount')}</th>
                    <th className="px-3 py-3 text-end font-semibold">{t('table.price')}</th>
                    <th className="px-3 py-3 text-end font-semibold">{t('pf.title')}</th>
                    <th className="px-3 py-3 text-end font-semibold">P&L</th>
                    <th className="w-16 px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
                      <td className="px-3 py-3">
                        <button onClick={() => setView('market')} className="flex items-center gap-2.5 text-start">
                          <CoinIcon symbol={r.symbol} size={26} />
                          <div>
                            <p className="text-[13px] font-semibold text-zinc-100">{r.symbol}</p>
                            <p className="max-w-24 truncate text-[11px] text-zinc-500">{r.name}</p>
                          </div>
                        </button>
                      </td>
                      <td className="tnum px-3 py-3 text-end text-xs text-zinc-300">{fmtNum(r.amount)}</td>
                      <td className="px-3 py-3 text-end">
                        <PriceCell price={r.price} className="text-xs font-semibold text-zinc-100" />
                        <div className="mt-0.5">
                          <ChangeBadge value={r.ch24h} size="sm" />
                        </div>
                      </td>
                      <td className="tnum px-3 py-3 text-end text-xs font-semibold text-zinc-100">
                        {fmtCompact(r.value)}
                        <p className="text-[10px] font-normal text-zinc-500">{t('pf.cost')}: {fmtCompact(r.cost)}</p>
                      </td>
                      <td dir="ltr" className={`tnum px-3 py-3 text-end text-xs font-bold ${pctClass(r.pnl)}`}>
                        {r.pnl === 0 ? '$0.00' : `${r.pnl > 0 ? '+' : ''}${fmtCompact(r.pnl)}`}
                        <p className={`text-[10px] font-semibold ${pctClass(r.pnlPct)}`}>
                          {r.pnlPct >= 0 ? '+' : ''}
                          {r.pnlPct.toFixed(2)}%
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditing(r)
                              setDialogOpen(true)
                            }}
                            aria-label={t('pf.edit')}
                            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-emerald-300"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => remove(r.id)}
                            aria-label={t('pf.delete')}
                            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-rose-400/10 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allocation donut */}
          <div className="glass p-5 lg:col-span-2">
            <h3 className="text-sm font-bold text-zinc-200">{t('pf.totalValue')}</h3>
            <div className="mt-2 h-56" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {donut.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0d1016',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      fontSize: 12,
                      color: '#e4e4e7',
                    }}
                    formatter={(v: number) => fmtCompact(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {donut.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-zinc-300">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  {d.name}
                  <span className="tnum text-zinc-500">
                    {totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(0) : 0}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <HoldingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        coins={coins}
        editing={editing}
        onSaved={() => holdingsQuery.refetch()}
      />
    </div>
  )
}
