'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useApp, useT } from '@/lib/store'
import { apiFetch } from '@/lib/client-api'
import { fmtPrice } from '@/lib/format'
import type { AlertDTO } from '@/lib/types'

/**
 * Invisible background watcher: every 30s asks the server to evaluate
 * ACTIVE alerts against latest prices and fires toasts for triggered ones.
 */
export function AlertChecker() {
  const t = useT()
  const lang = useApp((s) => s.lang)
  const setAlertCount = useApp((s) => s.setAlertCount)
  const queryClient = useQueryClient()
  const notified = useRef(new Set<string>())

  useEffect(() => {
    let stopped = false

    const check = async () => {
      try {
        const { triggered } = await apiFetch<{ triggered: AlertDTO[] }>('/api/alerts/check', { method: 'POST' })

        for (const a of triggered) {
          if (notified.current.has(a.id)) continue
          notified.current.add(a.id)
          const priceText = `$${fmtPrice(a.targetPrice)}`
          toast.success(`🔔 ${t('al.triggeredToast')}`, {
            description: `${a.symbol} ${t('al.triggeredDesc')} ${priceText}`,
            duration: 8000,
          })
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(`🔔 ${a.symbol} ${priceText}`, { body: t('al.triggeredToast') })
          }
        }

        if (triggered.length > 0) {
          queryClient.invalidateQueries({ queryKey: ['alerts'] })
        }

        // sync nav badge
        const { alerts } = await apiFetch<{ alerts: AlertDTO[] }>('/api/alerts')
        if (!stopped) {
          setAlertCount(alerts.filter((a) => a.status === 'ACTIVE').length)
        }
      } catch {
        /* silent — background job */
      }
    }

    check()
    const id = setInterval(check, 30_000)
    return () => {
      stopped = true
      clearInterval(id)
    }
  }, [t, lang, setAlertCount, queryClient])

  return null
}
