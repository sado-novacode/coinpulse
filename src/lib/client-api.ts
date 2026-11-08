'use client'

import { useApp } from '@/lib/store'

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const deviceId = useApp.getState().deviceId
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': deviceId,
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || `HTTP_${res.status}`)
  }
  return res.json() as Promise<T>
}

export const coinIconUrl = (symbol: string): string =>
  `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${symbol.toLowerCase()}.svg`
