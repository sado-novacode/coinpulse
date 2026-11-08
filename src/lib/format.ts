/**
 * All financial numbers use en-US digits + LTR embedding (crypto convention,
 * avoids RTL sign/percent flipping). Wrap rendered values with dir="ltr".
 */
export function fmtPrice(n: number): string {
  if (!Number.isFinite(n)) return '—'
  let opts: Intl.NumberFormatOptions
  if (n >= 1000) opts = { maximumFractionDigits: 2, minimumFractionDigits: 2 }
  else if (n >= 1) opts = { maximumFractionDigits: 4, minimumFractionDigits: 2 }
  else if (n >= 0.01) opts = { maximumFractionDigits: 5 }
  else opts = { maximumSignificantDigits: 4 }
  return new Intl.NumberFormat('en-US', opts).format(n)
}

export function fmtUsd(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return `$${fmtPrice(n)}`
}

/** Compact: 2.4T / 18.2B / 340.5M / 12.1K */
export function fmtCompact(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '—'
  const abs = Math.abs(n)
  const fmt = (v: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(v)
  if (abs >= 1e12) return `$${fmt(n / 1e12)}T`
  if (abs >= 1e9) return `$${fmt(n / 1e9)}B`
  if (abs >= 1e6) return `$${fmt(n / 1e6)}M`
  if (abs >= 1e3) return `$${fmt(n / 1e3)}K`
  return `$${fmtPrice(n)}`
}

export function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n)
}

export function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n)}%`
}

export const pctClass = (n: number): string =>
  n > 0 ? 'text-emerald-400' : n < 0 ? 'text-rose-400' : 'text-zinc-400'

export function timeAgo(iso: string | null, lang: 'en' | 'fa' = 'en'): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return lang === 'fa' ? 'همین حالا' : 'just now'
  if (mins < 60) return lang === 'fa' ? `${mins} دقیقه پیش` : `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return lang === 'fa' ? `${hrs} ساعت پیش` : `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return lang === 'fa' ? `${days} روز پیش` : `${days}d ago`
}
