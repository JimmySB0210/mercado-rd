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
import { getCategoryName } from '@/lib/utils'

interface CategoryRow {
  id: number
  name: string
  name_en: string
  name_fr: string
  slug: string
}

const DISPLAY_COUNT = 10

// Paleta fija rotando 8 tonos — no es un color por categoría real (habría
// que curar 48), solo variedad visual para escanear rápido, pedida
// explícitamente contra el mockup. Mismo criterio de "suave" que ya usa
// --color-primary-subtle: fondo pastel + ícono en el tono saturado
// correspondiente, nunca al revés.
const CATEGORY_TILE_COLORS = [
  { bg: '#E8F1F8', icon: 'var(--color-primary)' },  // azul (token existente)
  { bg: '#E6F7EF', icon: 'var(--color-green)' },  // verde (token existente)
  { bg: '#F3E8FD', icon: '#8B5CF6' },                // morado
  { bg: '#FFF1E8', icon: 'var(--color-orange)' }, // naranja (token existente)
  { bg: '#FDE8F3', icon: '#EC4899' },                // rosa
  { bg: '#FEF7E0', icon: 'var(--color-yellow-cta)' },    // amarillo (token existente)
  { bg: '#E6F7F7', icon: '#14B8A6' },                // teal
  { bg: '#FDEAEA', icon: 'var(--brand-red)' },       // rojo (token existente)
]

export function HomeCategoryStrip() {
  const { t, language } = useTranslation('products')
  const [categories, setCategories] = useState<CategoryRow[]>([])

  useEffect(() => {
    const supabase = createPublicClient()
    supabase
      .from('categories')
      .select('id, name, name_en, name_fr, slug')
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
    transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
  }

  // Círculo suave detrás de cada ícono — mismo tratamiento (tamaño,
  // forma, tipografía) en las 10 categorías y en "Más categorías", solo
  // cambia el color de a CATEGORY_TILE_COLORS. display NO va en el style
  // inline — tiene que quedar en las clases Tailwind (md-860:hidden /
  // hidden md-860:flex) para que el breakpoint pueda controlarlo; un
  // display inline pisaría esas clases (mayor especificidad) y mostraría
  // los dos círculos (mobile + desktop) a la vez en cualquier tamaño.
  const iconWrapStyle = (bg: string): React.CSSProperties => ({
    background: bg,
    borderRadius: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  })

  return (
    // w-full explícito — mismo bug que HeroBanner/PromoBannersRow: este
    // div es flex item de la columna raíz de page.tsx, y sin ancho
    // explícito el margin:auto desactiva el stretch. Acá dejaba 0px de
    // rango de scroll real en mobile (el wrapper ya nacía tan ancho
    // como su contenido), haciendo inalcanzables las categorías 6-10 y
    // "Más categorías".
    <div id="categorias" className="w-full max-w-[1400px] mx-auto px-4 md-860:px-6">
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
          Desktop: w-[108px] — tamaño intermedio a propósito. w-32(128px)
          hacía que las 11 tarjetas (10 categorías + "Más categorías")
          no entraran en los 1352px útiles del contenedor y cortaban la
          última; w-24(96px) era el achique accidental de una sesión
          anterior. 108px×11 + gap-3(12px)×10 = 1308px, cabe completo sin
          volver al tamaño chico. */}
      <div className="scroll-hide-x flex gap-2 md-860:gap-3 pb-1">
        {categories.map((cat, i) => {
          const Icon = getCategoryIcon(cat.name)
          const { bg, icon } = CATEGORY_TILE_COLORS[i % CATEGORY_TILE_COLORS.length]
          return (
            <a
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              className="w-[62px] md-860:w-[108px] flex flex-col items-center justify-center gap-1.5 md-860:gap-2 text-center px-1 md-860:px-2 py-2.5 md-860:py-4 hover:[box-shadow:var(--shadow-card-hover)] hover:-translate-y-0.5"
              style={tileStyle}
            >
              <div style={{ ...iconWrapStyle(bg), width: 36, height: 36 }} className="flex md-860:hidden">
                <Icon size={18} color={icon} strokeWidth={1.75} />
              </div>
              <div style={{ ...iconWrapStyle(bg), width: 44, height: 44 }} className="hidden md-860:flex">
                <Icon size={20} color={icon} strokeWidth={1.75} />
              </div>
              <span className="text-[10px] md-860:text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                {getCategoryName(cat, language)}
              </span>
            </a>
          )
        })}

        <a
          href="/categorias"
          className="w-[62px] md-860:w-[108px] flex flex-col items-center justify-center gap-1.5 md-860:gap-2 text-center px-1 md-860:px-2 py-2.5 md-860:py-4 hover:[box-shadow:var(--shadow-card-hover)] hover:-translate-y-0.5"
          style={tileStyle}
        >
          <div style={{ ...iconWrapStyle(CATEGORY_TILE_COLORS[0].bg), width: 36, height: 36 }} className="flex md-860:hidden">
            <LayoutGrid size={18} color={CATEGORY_TILE_COLORS[0].icon} strokeWidth={1.75} />
          </div>
          <div style={{ ...iconWrapStyle(CATEGORY_TILE_COLORS[0].bg), width: 44, height: 44 }} className="hidden md-860:flex">
            <LayoutGrid size={20} color={CATEGORY_TILE_COLORS[0].icon} strokeWidth={1.75} />
          </div>
          <span className="text-[10px] md-860:text-sm font-semibold text-gray-900 leading-snug">
            {t('moreCategoriesLabel')}
          </span>
        </a>
      </div>
    </div>
  )
}
