'use client'
// ============================================================
// MercadoRD — Selector de idioma
// Ruta: src/components/shop/LanguageSwitcher.tsx
// ============================================================
// Mismo patrón de click-outside que LocationSelector (Navbar.tsx) y
// NotificationBell. Cambia el idioma al instante — el store de
// Zustand re-renderiza cualquier componente que use useTranslation,
// sin recargar la página.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { useLanguageStore, type Language } from '@/lib/store/language'

const LANGUAGES: { code: Language; flag: string; label: string }[] = [
  { code: 'es', flag: '🇩🇴', label: 'ES' },
  { code: 'en', flag: '🇺🇸', label: 'EN' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
]

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguageStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0]

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Idioma / Language / Langue"
        className="flex items-center gap-1 cursor-pointer border-none bg-transparent"
        style={{ padding: 0 }}
      >
        <span style={{ fontSize: compact ? 20 : 24, lineHeight: 1 }}>{current.flag}</span>
        <ChevronDown size={compact ? 12 : 14} color={BRAND.gray} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
          style={{ minWidth: 120 }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { setLanguage(l.code); setOpen(false) }}
              className="flex items-center w-full gap-2 px-4 py-2 text-sm text-left border-none bg-transparent cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ color: l.code === language ? BRAND.blue : BRAND.dark, fontWeight: l.code === language ? 700 : 400 }}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
