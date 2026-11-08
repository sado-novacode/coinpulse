import { NextResponse } from 'next/server'
import { getMarkets } from '@/lib/market'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getMarkets()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[api/markets]', err)
    return NextResponse.json({ error: 'MARKETS_UNAVAILABLE' }, { status: 502 })
  }
}
