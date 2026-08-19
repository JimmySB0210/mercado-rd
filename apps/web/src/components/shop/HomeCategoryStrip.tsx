'use client'
// ============================================================
// MercadoRD — Franja horizontal de categorías (home)
// Ruta: src/components/shop/HomeCategoryStrip.tsx
// ============================================================
// Nueva — no existía antes de la Fase 2A. Reutiliza getCategoryIcon()
// (mismo mapeo que ya usan /categorias y el mega-menú del Navbar) para
// mantener los íconos consistentes en todo el sitio. El scroll
// horizontal queda contenido en .scroll-hide-x — la página completa
// nunca debe generar su propio scroll horizontal por esto.
// ============================================================

import { useEffect, useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { createPublicClient } from '@/lib/supabase/public'
import { getCategoryIcon } from '@/lib/categoryIcons'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface CategoryRow {
  id: number
  name: string
  slug: string
}

const DISPLAY_COUNT = 10

export function HomeCategoryStrip() {
  const { t } = useTranslation('products')
  const [categories, setCategories] = useState<CategoryRow[]>([])

  useEffect(() => {
    const supabase = createPublicClient()
    supabase
      .from('categories')
      .select('id, name, slug')
      .is('parent_id', null)
      .order('sort_order')
      .limit(DISPLAY_COUNT)
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  if (categories.length === 0) return null

  const tileStyle: React.CSSProperties = {
    background: 'var(--color-card-bg)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-card)',
    textDecoration: 'none',
    flexShrink: 0,
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md-860:px-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 16px' }}>
        <h2
          className="text-lg font-bold text-gray-900"
          style={{ margin: 0, fontFamily: 'var(--font-heading)' }}
        >
          {t('exploreCategoriesTitle')}
        </h2>
        <a href="/categorias" style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          {t('viewAll')}
        </a>
      </div>

      {/* Mobile: ~5 categorías completas + la siguiente asomando (tile
          60px + gap 8px ≈ 5.3 cupos visibles en ~360px de contenido).
          Desktop: tiles más grandes, mismo mecanismo de scroll. */}
      <div className="scroll-hide-x flex gap-2 md-860:gap-3 pb-1">
        {categories.map(cat => {
          const Icon = getCategoryIcon(cat.name)
          return (
            <a
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              className="w-[60px] md-860:w-28 flex flex-col items-center justify-center gap-1.5 md-860:gap-2 text-center px-1 md-860:px-2 py-3 md-860:py-5"
              style={tileStyle}
            >
              <Icon size={20} className="md-860:hidden" color="var(--color-primary)" strokeWidth={1.5} />
              <Icon size={32} className="hidden md-860:block" color="var(--color-primary)" strokeWidth={1.5} />
              <span className="text-[10px] md-860:text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                {cat.name}
              </span>
            </a>
          )
        })}

        <a
          href="/categorias"
          className="w-[60px] md-860:w-28 flex flex-col items-center justify-center gap-1.5 md-860:gap-2 text-center px-1 md-860:px-2 py-3 md-860:py-5"
          style={tileStyle}
        >
          <LayoutGrid size={20} className="md-860:hidden" color="var(--color-primary)" strokeWidth={1.5} />
          <LayoutGrid size={32} className="hidden md-860:block" color="var(--color-primary)" strokeWidth={1.5} />
          <span className="text-[10px] md-860:text-sm font-semibold text-gray-900 leading-snug">
            {t('moreCategoriesLabel')}
          </span>
        </a>
      </div>
    </div>
  )
}
