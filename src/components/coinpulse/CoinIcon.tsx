'use client'

import { useState } from 'react'
import { coinIconUrl } from '@/lib/client-api'

export function CoinIcon({ symbol, size = 28 }: { symbol: string; size?: number }) {
  const [failed, setFailed] = useState(false)

  if (failed || !symbol) {
    return (
      <div
        aria-hidden
        className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/80 to-purple-500/80 font-bold text-black/80"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {(symbol || '?').charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      key={symbol}
      src={coinIconUrl(symbol)}
      alt={`${symbol} icon`}
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded-full"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}
