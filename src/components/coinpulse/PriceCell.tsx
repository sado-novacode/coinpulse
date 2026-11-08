'use client'

import { useEffect, useState } from 'react'
import { fmtPrice } from '@/lib/format'
import { useApp } from '@/lib/store'

/** Price that flashes green/red when it changes — the "live" feel. */
export function PriceCell({
  price,
  className = '',
  showPrefix = true,
}: {
  price: number
  className?: string
  showPrefix?: boolean
}) {
  const lang = useApp((s) => s.lang)
  const [prevPrice, setPrevPrice] = useState(price)
  const [dir, setDir] = useState<'up' | 'down' | null>(null)

  // Adjust state during render (React-recommended pattern for prop-change reactions)
  if (price !== prevPrice) {
    setPrevPrice(price)
    setDir(price > prevPrice ? 'up' : 'down')
  }

  useEffect(() => {
    if (!dir) return
    const t = setTimeout(() => setDir(null), 900)
    return () => clearTimeout(t)
  }, [dir])

  const text = showPrefix ? `$${fmtPrice(price)}` : fmtPrice(price)

  return (
    <span
      dir="ltr"
      className={`tnum inline-block rounded-md px-1 transition-colors duration-500 ${
        dir === 'up' ? 'flash-up' : dir === 'down' ? 'flash-down' : ''
      } ${className}`}
    >
      {text}
    </span>
  )
}
