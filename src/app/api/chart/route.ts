import { NextRequest, NextResponse } from 'next/server'
import { getCandles } from '@/lib/market'
import type { RangeKey } from '@/lib/types'

export const dynamic = 'force-dynamic'

const VALID_RANGES: RangeKey[] = ['24h', '7d', '30d', '90d', '1y']

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get('symbol') ?? '').trim().toUpperCase()
  const range = (req.nextUrl.searchParams.get('range') ?? '7d') as RangeKey

  if (!/^[A-Z0-9]{2,12}$/.test(symbol)) {
    return NextResponse.json({ error: 'BAD_SYMBOL' }, { status: 400 })
  }
  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: 'BAD_RANGE' }, { status: 400 })
  }

  try {
    const candles = await getCandles(symbol, range)
    return NextResponse.json({ candles, range }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('400')) {
      return NextResponse.json({ error: 'PAIR_UNAVAILABLE' }, { status: 404 })
    }
    console.error('[api/chart]', err)
    return NextResponse.json({ error: 'CHART_UNAVAILABLE' }, { status: 502 })
  }
}
