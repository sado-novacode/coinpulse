import { NextRequest, NextResponse } from 'next/server'
import { getSparklines } from '@/lib/market'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const symbols = (req.nextUrl.searchParams.get('symbols') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (symbols.length === 0) {
    return NextResponse.json({ error: 'NO_SYMBOLS' }, { status: 400 })
  }

  try {
    const sparklines = await getSparklines(symbols)
    return NextResponse.json({ sparklines }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[api/sparklines]', err)
    return NextResponse.json({ error: 'SPARKLINES_UNAVAILABLE' }, { status: 502 })
  }
}
