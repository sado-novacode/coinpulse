'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/client-api'
import { useApp, useT } from '@/lib/store'
import { fmtPrice } from '@/lib/format'
import type { Coin } from '@/lib/types'
import { CoinIcon } from './CoinIcon'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  coins: Coin[]
  preselected?: Coin | null
  onSaved: () => void
}

export function AlertCreateDialog({ open, onOpenChange, coins, preselected, onSaved }: Props) {
  const t = useT()
  const lang = useApp((s) => s.lang)
  const [coinId, setCoinId] = useState('')
  const [direction, setDirection] = useState<'ABOVE' | 'BELOW'>('ABOVE')
  const [target, setTarget] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setCoinId(preselected?.id ?? '')
    setDirection('ABOVE')
    setTarget(preselected ? String(preselected.price) : '')
  }, [open, preselected])

  const selected = coins.find((c) => c.id === coinId)

  const pickCoin = (id: string) => {
    setCoinId(id)
    const c = coins.find((x) => x.id === id)
    if (c) setTarget(String(c.price))
  }

  const save = async () => {
    const tp = parseFloat(target)
    if (!coinId) {
      toast.error(t('err.required'))
      return
    }
    if (!Number.isFinite(tp) || tp <= 0) {
      toast.error(t('err.invalid'))
      return
    }
    setSaving(true)
    try {
      await apiFetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          coinId,
          symbol: selected?.symbol ?? '',
          name: selected?.name ?? '',
          direction,
          targetPrice: tp,
        }),
      })
      toast.success(t('al.created'))
      onOpenChange(false)
      onSaved()
    } catch {
      toast.error(t('err.server'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="glass-strong max-w-sm border-white/10">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{t('al.create')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">{t('pf.selectCoin')}</Label>
            <Select value={coinId} onValueChange={pickCoin}>
              <SelectTrigger className="w-full border-white/10 bg-white/5 text-zinc-100">
                <SelectValue placeholder={t('pf.selectCoin')}>
                  {selected ? (
                    <span className="flex items-center gap-2">
                      <CoinIcon symbol={selected.symbol} size={18} />
                      {selected.name} ({selected.symbol})
                    </span>
                  ) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72 border-white/10 bg-[#0d1016] text-zinc-100">
                {coins.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <CoinIcon symbol={c.symbol} size={16} />
                      {c.name} ({c.symbol})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">{t('al.direction')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDirection('ABOVE')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                  direction === 'ABOVE'
                    ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ArrowUp className="h-4 w-4" /> {t('al.above')}
              </button>
              <button
                onClick={() => setDirection('BELOW')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                  direction === 'BELOW'
                    ? 'border-rose-400/50 bg-rose-400/15 text-rose-300'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ArrowDown className="h-4 w-4" /> {t('al.below')}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="al-target" className="text-xs text-zinc-400">
              {t('al.target')}{' '}
              {selected && (
                <span className="text-[10px] text-emerald-400/80">
                  {t('al.current')}: ${fmtPrice(selected.price)}
                </span>
              )}
            </Label>
            <Input
              id="al-target"
              type="number"
              min="0"
              step="any"
              dir="ltr"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="border-white/10 bg-white/5 text-zinc-100"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-zinc-100">
            {t('pf.cancel')}
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-gradient-to-r from-purple-400 to-purple-500 font-bold text-black hover:from-purple-300 hover:to-purple-400"
          >
            {saving ? '…' : t('al.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
