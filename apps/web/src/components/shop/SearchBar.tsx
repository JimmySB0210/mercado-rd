'use client'
// ============================================================
// MercadoRD — Barra de búsqueda con autocompletado + historial
// Ruta: src/components/shop/SearchBar.tsx
// ============================================================
// Reemplaza el <form action="/buscar"> plano que vivía duplicado en
// Navbar.tsx (desktop y mobile) — mismo componente para ambos, solo
// cambia el tamaño vía la prop `variant`.
//
// Un mismo dropdown para dos cosas distintas:
//   - input vacío + foco -> historial de búsquedas (localStorage vía
//     useSearchHistoryStore, funciona con o sin sesión)
//   - input con >=2 caracteres -> autocompletado real, llama
//     search_products() (la misma función RPC de /buscar, con
//     p_limit: 5) con debounce de 300ms
//
// Clic en una sugerencia de producto navega directo a ese producto
// (no cuenta como "búsqueda", no toca el historial). Enviar el
// formulario (Enter o el botón) sí agrega al historial y navega a
// /buscar?q=X — mismo criterio que antes, solo que ahora vía
// router.push en vez de un submit nativo, para poder actualizar el
// store antes de navegar.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, History, X } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { createClient } from '@/lib/supabase/client'
import { useSearchHistoryStore } from '@/lib/store/searchHistory'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Suggestion {
  id: string
  name: string
}

interface Props {
  variant?: 'desktop' | 'mobile'
}

const SIZES = {
  desktop: { padding: '11px 50px 11px 18px', fontSize: 14, buttonSize: 38, iconSize: 16 },
  mobile: { padding: '10px 44px 10px 16px', fontSize: 13, buttonSize: 32, iconSize: 14 },
} as const

export function SearchBar({ variant = 'desktop' }: Props) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const size = SIZES[variant]

  const history = useSearchHistoryStore(s => s.history)
  const addSearch = useSearchHistoryStore(s => s.addSearch)
  const removeSearch = useSearchHistoryStore(s => s.removeSearch)
  const clearHistory = useSearchHistoryStore(s => s.clearHistory)

  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cerrar el dropdown al hacer clic fuera — mismo patrón que el menú
  // de cuenta y el selector de ubicación en Navbar.tsx.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('search_products', {
        p_query: trimmed,
        p_limit: 5,
      })

      if (error) {
        console.error('[SearchBar] search_products', error)
        return
      }

      setSuggestions((data ?? []).map((p: any) => ({ id: p.id, name: p.name })))
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleSubmit = (e: React.FormEvent, overrideQuery?: string) => {
    e.preventDefault()
    const finalQuery = (overrideQuery ?? query).trim()
    setOpen(false)
    if (finalQuery) addSearch(finalQuery)
    router.push(finalQuery ? `/buscar?q=${encodeURIComponent(finalQuery)}` : '/buscar')
  }

  const handleHistoryClick = (term: string) => {
    setQuery(term)
    addSearch(term)
    setOpen(false)
    router.push(`/buscar?q=${encodeURIComponent(term)}`)
  }

  const handleSuggestionClick = (productId: string) => {
    setOpen(false)
    router.push(`/producto/${productId}`)
  }

  const showHistory = query.trim().length === 0 && history.length > 0
  const showSuggestions = query.trim().length >= 2 && suggestions.length > 0
  const showDropdown = open && focused && (showHistory || showSuggestions)

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="q"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setFocused(true); setOpen(true) }}
          autoComplete="off"
          placeholder={t('searchPlaceholder')}
          style={{
            width: '100%',
            border: `1px solid ${focused ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: BRAND.bg, borderRadius: 'var(--radius-control)',
            padding: size.padding, fontSize: size.fontSize, outline: 'none', color: BRAND.dark, boxSizing: 'border-box',
            boxShadow: focused ? '0 0 0 3px var(--color-primary-subtle)' : 'none',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          }}
        />
        <button
          type="submit"
          style={{
            position: 'absolute', right: variant === 'desktop' ? 4 : 3, top: variant === 'desktop' ? 4 : 3, bottom: variant === 'desktop' ? 4 : 3,
            width: size.buttonSize, border: 'none', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <Search size={size.iconSize} />
        </button>
      </form>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50"
          style={{ top: 'calc(100% + 6px)' }}
        >
          {showHistory && (
            <>
              <div className="flex items-center justify-between px-3.5 py-1.5">
                <span className="text-xs font-medium" style={{ color: BRAND.gray }}>{t('searchHistoryHeading')}</span>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-xs hover:underline border-none bg-transparent cursor-pointer p-0"
                  style={{ color: BRAND.blue }}
                >
                  {t('clearSearchHistoryButton')}
                </button>
              </div>
              {history.map(term => (
                <div
                  key={term}
                  onClick={() => handleHistoryClick(term)}
                  className="flex items-center justify-between gap-2 px-3.5 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ color: BRAND.dark }}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <History size={14} color={BRAND.gray} className="flex-shrink-0" />
                    <span className="truncate">{term}</span>
                  </span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeSearch(term) }}
                    aria-label={t('removeSearchHistoryItemAria')}
                    className="flex-shrink-0 border-none bg-transparent cursor-pointer p-1 flex items-center justify-center hover:bg-gray-100 rounded-full"
                  >
                    <X size={12} color={BRAND.gray} />
                  </button>
                </div>
              ))}
            </>
          )}

          {showSuggestions && (
            <>
              {suggestions.map(s => (
                <div
                  key={s.id}
                  onClick={() => handleSuggestionClick(s.id)}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ color: BRAND.dark }}
                >
                  <Search size={14} color={BRAND.gray} className="flex-shrink-0" />
                  <span className="truncate">{s.name}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
