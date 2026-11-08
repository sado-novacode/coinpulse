import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function deviceId(req: NextRequest): string | null {
  return req.headers.get('x-device-id')
}

export async function GET(req: NextRequest) {
  const id = deviceId(req)
  if (!id) return NextResponse.json({ error: 'NO_DEVICE' }, { status: 400 })
  const holdings = await db.holding.findMany({
    where: { deviceId: id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ holdings }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const id = deviceId(req)
  if (!id) return NextResponse.json({ error: 'NO_DEVICE' }, { status: 400 })
  try {
    const body = await req.json()
    const coinId = String(body.coinId ?? '').trim()
    const symbol = String(body.symbol ?? '').trim().toUpperCase()
    const name = String(body.name ?? '').trim()
    const amount = Number(body.amount)
    const buyPrice = Number(body.buyPrice)

    if (!coinId || !symbol || !name) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(buyPrice) || buyPrice <= 0) {
      return NextResponse.json({ error: 'INVALID_NUMBERS' }, { status: 400 })
    }

    const holding = await db.holding.create({
      data: { deviceId: id, coinId, symbol, name, amount, buyPrice },
    })
    return NextResponse.json({ holding }, { status: 201 })
  } catch (err) {
    console.error('[api/portfolio POST]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const id = deviceId(req)
  if (!id) return NextResponse.json({ error: 'NO_DEVICE' }, { status: 400 })
  try {
    const body = await req.json()
    const rowId = String(body.id ?? '')
    const amount = Number(body.amount)
    const buyPrice = Number(body.buyPrice)

    if (!rowId) return NextResponse.json({ error: 'MISSING_ID' }, { status: 400 })
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(buyPrice) || buyPrice <= 0) {
      return NextResponse.json({ error: 'INVALID_NUMBERS' }, { status: 400 })
    }

    const existing = await db.holding.findUnique({ where: { id: rowId } })
    if (!existing || existing.deviceId !== id) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const holding = await db.holding.update({
      where: { id: rowId },
      data: { amount, buyPrice },
    })
    return NextResponse.json({ holding })
  } catch (err) {
    console.error('[api/portfolio PATCH]', err)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const id = deviceId(req)
  const rowId = req.nextUrl.searchParams.get('id')
  if (!id || !rowId) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })

  const existing = await db.holding.findUnique({ where: { id: rowId } })
  if (!existing || existing.deviceId !== id) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  await db.holding.delete({ where: { id: rowId } })
  return NextResponse.json({ ok: true })
}
