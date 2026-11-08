'use client'

import { Zap } from 'lucide-react'
import { useT } from '@/lib/store'

export function Footer() {
  const t = useT()
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#070a0f]/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-1.5 px-4 py-5 text-center sm:px-6">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
          <Zap className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
          {t('app.name')}
          <span className="text-zinc-600">·</span>
          <span className="font-medium text-zinc-500">{t('app.tagline')}</span>
        </div>
        <p className="text-[10px] leading-relaxed text-zinc-600">{t('footer.built')}</p>
        <p className="max-w-xl text-[10px] leading-relaxed text-zinc-600">{t('footer.data')}</p>
      </div>
    </footer>
  )
}
