'use client'

import type { Coin } from '@/lib/types'
import { fmtPrice, pctClass } from '@/lib/format'

function TapeRow({ items }: { items: Coin[] }) {
  return (
    <div className="flex shrink-0 items-center gap-8 px-4">
      {items.map((c) => (
        <span key={c.id} className="flex items-center gap-2 whitespace-nowrap text-xs">
          <span className="font-bold text-zinc-300">{c.symbol}</span>
          <span className="tnum text-zinc-400">${fmtPrice(c.price)}</span>
          <span className={`tnum font-semibold ${pctClass(c.ch24h)}`}>
            {c.ch24h >= 0 ? '▲' : '▼'} {Math.abs(c.ch24h).toFixed(2)}%
          </span>
        </span>
      ))}
    </div>
  )
}

/** Scrolling live price tape across the top — pure CSS marquee. */
export function TickerTape({ coins }: { coins: Coin[] }) {
  const items = coins.slice(0, 24)
  if (items.length === 0) return <div className="h-10 border-b border-white/5" />

  return (
    <div dir="ltr" className="marquee overflow-hidden border-b border-white/5 bg-white/[0.02] py-2" aria-hidden>
      <div className="marquee-track flex w-max">
        <TapeRow items={items} />
        <TapeRow items={items} />
      </div>
    </div>
  )
}
