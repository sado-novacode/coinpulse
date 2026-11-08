import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getPricesMap } from '@/lib/market'

export const dynamic = 'force-dynamic'

/**
 * Checks all ACTIVE alerts of this device against latest market prices.
 * Triggered alerts flip to TRIGGERED and are returned to the client for toasts.
 */
export async function POST(req: NextRequest) {
  const id = req.headers.get('x-device-id')
  if (!id) return NextResponse.json({ error: 'NO_DEVICE' }, { status: 400 })

  try {
    const active = await db.alert.findMany({ where: { deviceId: id, status: 'ACTIVE' } })
    if (active.length === 0) {
      return NextResponse.json({ triggered: [] })
    }

    const prices = await getPricesMap()
    const triggered = []

    for (const a of active) {
      const price = prices[a.coinId]
      if (!Number.isFinite(price)) continue
      const hit = a.direction === 'ABOVE' ? price >= a.targetPrice : price <= a.targetPrice
      if (hit) {
        const updated = await db.alert.update({
          where: { id: a.id },
          data: { status: 'TRIGGERED', triggeredAt: new Date() },
        })
        triggered.push(updated)
      }
    }

    return NextResponse.json({ triggered }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[api/alerts/check]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
