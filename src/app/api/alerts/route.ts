import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function deviceId(req: NextRequest): string | null {
  return req.headers.get('x-device-id')
}

export async function GET(req: NextRequest) {
  const id = deviceId(req)
  if (!id) return NextResponse.json({ error: 'NO_DEVICE' }, { status: 400 })
  const alerts = await db.alert.findMany({
    where: { deviceId: id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ alerts }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const id = deviceId(req)
  if (!id) return NextResponse.json({ error: 'NO_DEVICE' }, { status: 400 })
  try {
    const body = await req.json()
    const coinId = String(body.coinId ?? '').trim()
    const symbol = String(body.symbol ?? '').trim().toUpperCase()
    const name = String(body.name ?? '').trim()
    const direction = String(body.direction ?? '').toUpperCase()
    const targetPrice = Number(body.targetPrice)

    if (!coinId || !symbol || !name) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
    }
    if (direction !== 'ABOVE' && direction !== 'BELOW') {
      return NextResponse.json({ error: 'BAD_DIRECTION' }, { status: 400 })
    }
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      return NextResponse.json({ error: 'INVALID_NUMBERS' }, { status: 400 })
    }

    const alert = await db.alert.create({
      data: { deviceId: id, coinId, symbol, name, direction, targetPrice },
    })
    return NextResponse.json({ alert }, { status: 201 })
  } catch (err) {
    console.error('[api/alerts POST]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const id = deviceId(req)
  const rowId = req.nextUrl.searchParams.get('id')
  if (!id || !rowId) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })

  const existing = await db.alert.findUnique({ where: { id: rowId } })
  if (!existing || existing.deviceId !== id) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  await db.alert.delete({ where: { id: rowId } })
  return NextResponse.json({ ok: true })
}
