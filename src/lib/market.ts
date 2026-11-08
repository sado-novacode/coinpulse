import { cached, dedupe } from '@/lib/cache'
import type { Candle, Coin, GlobalStats, MarketsResponse, RangeKey } from '@/lib/types'

const COINLORE = 'https://api.coinlore.net/api'
const BINANCE = 'https://api.binance.com'

const MARKETS_TTL = 45_000
const GLOBAL_TTL = 60_000
const SPARK_TTL = 10 * 60_000
const CHART_TTL = 60_000

export class UpstreamError extends Error {}

async function fetchJson<T>(url: string, timeoutMs = 12_000): Promise<T> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
    if (!res.ok) throw new UpstreamError(`HTTP ${res.status} from ${new URL(url).host}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(t)
  }
}

/* ------------------------------------------------------------------ */
/* Markets (CoinLore)                                                  */
/* ------------------------------------------------------------------ */

interface CoinloreTicker {
  id: string
  symbol: string
  name: string
  nameid: string
  rank: number
  price_usd: string
  percent_change_24h: string
  percent_change_1h: string
  percent_change_7d: string
  market_cap_usd: string
  volume24: number
  csupply: string
  msupply: string | null
}

interface CoinloreGlobal {
  total_mcap: number
  total_volume: number
  btc_d: string
  mcap_change: string
  coins_count: number
}

const num = (v: string | number | null | undefined): number => {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '')
  return Number.isFinite(n) ? n : 0
}

export async function getMarkets(): Promise<MarketsResponse> {
  return dedupe('markets', () =>
    cached('markets', MARKETS_TTL, async () => {
      const [tickers, global] = await Promise.all([
        fetchJson<{ data: CoinloreTicker[] }>(`${COINLORE}/tickers/?start=0&limit=100`),
        fetchJson<CoinloreGlobal[]>(`${COINLORE}/global/`).catch(() => null),
      ])

      const coins: Coin[] = tickers.data.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        name: t.name,
        nameid: t.nameid,
        rank: t.rank ?? 0,
        price: num(t.price_usd),
        ch1h: num(t.percent_change_1h),
        ch24h: num(t.percent_change_24h),
        ch7d: num(t.percent_change_7d),
        mcap: num(t.market_cap_usd),
        vol24: num(t.volume24),
        csupply: num(t.csupply),
        msupply: t.msupply ? num(t.msupply) : null,
      }))

      const g: GlobalStats = global
        ? {
            mcap: global[0]?.total_mcap ?? 0,
            volume: global[0]?.total_volume ?? 0,
            btcDominance: num(global[0]?.btc_d),
            mcapChange: num(global[0]?.mcap_change),
            coinsCount: global[0]?.coins_count ?? 0,
          }
        : { mcap: 0, volume: 0, btcDominance: 0, mcapChange: 0, coinsCount: 0 }

      return { coins, global: g, updatedAt: Date.now() }
    }),
  )
}

export async function getPricesMap(): Promise<Record<string, number>> {
  const { coins } = await getMarkets()
  const map: Record<string, number> = {}
  for (const c of coins) map[c.id] = c.price
  return map
}

/* ------------------------------------------------------------------ */
/* Sparklines (Binance 2h klines — 84 points = 7 days of closes)       */
/* ------------------------------------------------------------------ */

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx])
    }
  })
  await Promise.all(workers)
  return out
}

export async function getSparklines(symbols: string[]): Promise<Record<string, number[]>> {
  const syms = [...new Set(symbols.map((s) => s.trim().toUpperCase()))].filter(Boolean).slice(0, 60)

  const results = await mapLimit(syms, 12, async (sym) => {
    try {
      const key = `spark:${sym}`
      const data = await dedupe(key, () =>
        cached<number[]>(key, SPARK_TTL, async () => {
          const raw = await fetchJson<unknown[][]>(
            `${BINANCE}/api/v3/klines?symbol=${encodeURIComponent(sym + 'USDT')}&interval=2h&limit=84`,
          )
          return raw.map((k) => num(k[4] as string))
        }),
      )
      return [sym, data] as const
    } catch {
      return [sym, []] as const
    }
  })

  return Object.fromEntries(results)
}

/* ------------------------------------------------------------------ */
/* Candles (Binance klines)                                            */
/* ------------------------------------------------------------------ */

const RANGE_MAP: Record<RangeKey, { interval: string; limit: number }> = {
  '24h': { interval: '15m', limit: 96 },
  '7d': { interval: '1h', limit: 168 },
  '30d': { interval: '4h', limit: 180 },
  '90d': { interval: '12h', limit: 180 },
  '1y': { interval: '1d', limit: 365 },
}

export async function getCandles(symbol: string, range: RangeKey): Promise<Candle[]> {
  const cfg = RANGE_MAP[range] ?? RANGE_MAP['7d']
  const pair = `${symbol.toUpperCase()}USDT`
  const key = `chart:${pair}:${range}`
  return dedupe(key, () =>
    cached(key, CHART_TTL, async () => {
      const raw = await fetchJson<unknown[][]>(
        `${BINANCE}/api/v3/klines?symbol=${encodeURIComponent(pair)}&interval=${cfg.interval}&limit=${cfg.limit}`,
      )
      return raw.map((k) => ({
        time: Math.floor(num(k[0] as number) / 1000),
        open: num(k[1] as string),
        high: num(k[2] as string),
        low: num(k[3] as string),
        close: num(k[4] as string),
      }))
    }),
  )
}
