'use client'

import { useEffect, useRef } from 'react'
import {
  createChart,
  ColorType,
  type IChartApi,
  type CandlestickData,
  type UTCTimestamp,
} from 'lightweight-charts'
import type { Candle } from '@/lib/types'

function precisionFor(price: number): { precision: number; minMove: number } {
  if (price < 0.01) return { precision: 6, minMove: 0.000001 }
  if (price < 1) return { precision: 4, minMove: 0.0001 }
  if (price < 1000) return { precision: 3, minMove: 0.001 }
  return { precision: 2, minMove: 0.01 }
}

/** TradingView lightweight-charts candlestick chart, dark glassy theme. */
export function PriceChart({ candles }: { candles: Candle[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ReturnType<IChartApi['addCandlestickSeries']> | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const chart = createChart(ref.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8b93a3',
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: 'rgba(52,211,153,0.35)', labelBackgroundColor: '#0e7c52' },
        horzLine: { color: 'rgba(52,211,153,0.35)', labelBackgroundColor: '#0e7c52' },
      },
    })
    chartRef.current = chart

    const series = chart.addCandlestickSeries({
      upColor: '#34d399',
      downColor: '#fb7185',
      wickUpColor: '#34d399',
      wickDownColor: '#fb7185',
      borderVisible: false,
    })
    seriesRef.current = series

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  useEffect(() => {
    const series = seriesRef.current
    if (!series || candles.length === 0) return

    const last = candles[candles.length - 1]
    const { precision, minMove } = precisionFor(last.close)
    series.applyOptions({ priceFormat: { type: 'price', precision, minMove } })

    const data: CandlestickData[] = candles.map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
    series.setData(data)
    chartRef.current?.timeScale().fitContent()
  }, [candles])

  return <div ref={ref} className="h-[340px] w-full sm:h-[420px]" dir="ltr" />
}
