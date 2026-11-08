'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/client-api'
import { useApp, useT } from '@/lib/store'
import { fmtPrice } from '@/lib/format'
import type { Coin, HoldingDTO } from '@/lib/types'
import { CoinIcon } from './CoinIcon'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  coins: Coin[]
  preselected?: Coin | null
  editing?: HoldingDTO | null
  onSaved: () => void
}

export function HoldingDialog({ open, onOpenChange, coins, preselected, editing, onSaved }: Props) {
  const t = useT()
  const lang = useApp((s) => s.lang)
  const [coinId, setCoinId] = useState('')
  const [amount, setAmount] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setCoinId(editing.coinId)
      setAmount(String(editing.amount))
      setBuyPrice(String(editing.buyPrice))
    } else {
      setCoinId(preselected?.id ?? '')
      setAmount('')
      setBuyPrice(preselected ? String(preselected.price) : '')
    }
  }, [open, editing, preselected])

  const selected = coins.find((c) => c.id === coinId)

  const pickCoin = (id: string) => {
    setCoinId(id)
    if (!editing) {
      const c = coins.find((x) => x.id === id)
      if (c) setBuyPrice(String(c.price))
    }
  }

  const save = async () => {
    const amt = parseFloat(amount)
    const bp = parseFloat(buyPrice)
    if (!coinId) {
      toast.error(t('err.required'))
      return
    }
    if (!Number.isFinite(amt) || amt <= 0 || !Number.isFinite(bp) || bp <= 0) {
      toast.error(t('err.invalid'))
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await apiFetch('/api/portfolio', {
          method: 'PATCH',
          body: JSON.stringify({ id: editing.id, amount: amt, buyPrice: bp }),
        })
        toast.success(t('pf.updated'))
      } else {
        await apiFetch('/api/portfolio', {
          method: 'POST',
          body: JSON.stringify({
            coinId,
            symbol: selected?.symbol ?? '',
            name: selected?.name ?? '',
            amount: amt,
            buyPrice: bp,
          }),
        })
        toast.success(t('pf.added'))
      }
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
          <DialogTitle className="text-zinc-100">{editing ? t('pf.edit') : t('pf.add')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">{t('pf.selectCoin')}</Label>
            <Select value={coinId} onValueChange={pickCoin} disabled={!!editing}>
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
            <Label htmlFor="h-amount" className="text-xs text-zinc-400">
              {t('pf.amount')}
            </Label>
            <Input
              id="h-amount"
              type="number"
              min="0"
              step="any"
              dir="ltr"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.5"
              className="border-white/10 bg-white/5 text-zinc-100"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="h-buy" className="text-xs text-zinc-400">
              {t('pf.buyPrice')}{' '}
              {selected && (
                <span className="text-[10px] text-emerald-400/80">
                  {t('al.current')}: ${fmtPrice(selected.price)}
                </span>
              )}
            </Label>
            <Input
              id="h-buy"
              type="number"
              min="0"
              step="any"
              dir="ltr"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
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
            className="bg-gradient-to-r from-emerald-400 to-emerald-500 font-bold text-black hover:from-emerald-300 hover:to-emerald-400"
          >
            {saving ? '…' : t('pf.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
