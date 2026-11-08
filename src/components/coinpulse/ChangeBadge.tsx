'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { fmtPct, pctClass } from '@/lib/format'

export function ChangeBadge({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const up = value >= 0
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span
      dir="ltr"
      className={`tnum inline-flex items-center gap-0.5 rounded-md font-semibold ${pctClass(value)} ${
        up ? 'bg-emerald-400/10' : 'bg-rose-400/10'
      } ${size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={2.5} />
      {fmtPct(value)}
    </span>
  )
}
