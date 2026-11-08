// Shared domain types for CoinPulse

export interface Coin {
  id: string
  symbol: string
  name: string
  nameid: string
  rank: number
  price: number
  ch1h: number
  ch24h: number
  ch7d: number
  mcap: number
  vol24: number
  csupply: number
  msupply: number | null
}

export interface GlobalStats {
  mcap: number
  volume: number
  btcDominance: number
  mcapChange: number
  coinsCount: number
}

export interface MarketsResponse {
  coins: Coin[]
  global: GlobalStats
  updatedAt: number
}

export interface Candle {
  time: number // unix seconds
  open: number
  high: number
  low: number
  close: number
}

export interface HoldingDTO {
  id: string
  coinId: string
  symbol: string
  name: string
  amount: number
  buyPrice: number
  createdAt: string
}

export interface AlertDTO {
  id: string
  coinId: string
  symbol: string
  name: string
  direction: 'ABOVE' | 'BELOW'
  targetPrice: number
  status: 'ACTIVE' | 'TRIGGERED'
  triggeredAt: string | null
  createdAt: string
}

export type RangeKey = '24h' | '7d' | '30d' | '90d' | '1y'
