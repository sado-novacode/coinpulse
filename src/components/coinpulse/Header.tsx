'use client'

import { Activity, LayoutDashboard, Bell, Wallet, Zap } from 'lucide-react'
import { useApp, useT, type View } from '@/lib/store'

export function Header() {
  const t = useT()
  const lang = useApp((s) => s.lang)
  const view = useApp((s) => s.view)
  const setView = useApp((s) => s.setView)
  const toggleLang = useApp((s) => s.toggleLang)
  const alertCount = useApp((s) => s.alertCount)

  const navs: Array<{ key: View; label: string; icon: typeof Zap; badge?: number }> = [
    { key: 'market', label: t('nav.market'), icon: LayoutDashboard },
    { key: 'portfolio', label: t('nav.portfolio'), icon: Wallet },
    { key: 'alerts', label: t('nav.alerts'), icon: Bell, badge: alertCount || undefined },
  ]

  const go = (v: View) => {
    if (v === 'coin') return
    setView(v)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => go('market')}
          className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          aria-label={t('app.name')}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-purple-500 shadow-[0_0_18px_rgba(52,211,153,0.35)]">
            <Zap className="h-5 w-5 fill-black/85 text-black/85" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-300 to-purple-300 bg-clip-text text-transparent">
              {t('app.name')}
            </span>
          </span>
        </button>

        {/* LIVE badge */}
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold tracking-widest text-emerald-300 sm:inline-flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {t('app.live')}
        </span>

        <div className="ms-auto flex items-center gap-2">
          {/* Nav */}
          <nav aria-label="Main" className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            {navs.map(({ key, label, icon: Icon, badge }) => {
              const active = view === key || (key === 'market' && view === 'coin')
              return (
                <button
                  key={key}
                  onClick={() => go(key)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                    active
                      ? 'bg-gradient-to-r from-emerald-400/90 to-emerald-500/90 text-black shadow-[0_0_14px_rgba(52,211,153,0.4)]'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                  {badge ? (
                    <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-500 px-1 text-[9px] font-bold text-white">
                      {badge}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="flex h-8 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-bold text-zinc-300 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
            aria-label="Switch language"
          >
            <Activity className="h-3.5 w-3.5" />
            {lang === 'fa' ? 'EN' : 'فا'}
          </button>
        </div>
      </div>
    </header>
  )
}
