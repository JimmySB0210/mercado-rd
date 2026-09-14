'use client'
// ============================================================
// MercadoRD — Filtros/orden de /buscar
// Ruta: src/components/shop/SearchFiltersBar.tsx
// ============================================================
// Mismo patrón que AuditLogFilters.tsx / VendorVerificationFilters.tsx:
// selects/inputs nativos que escriben en la URL para que la vista
// filtrada sea compartible/recargable. No se necesita envolver en
// <Suspense> porque buscar/page.tsx ya lee `searchParams` como prop
// server-side (la ruta ya es dinámica de por sí).
//
// El rango de precio no actualiza la URL en cada tecla — se confirma
// al perder el foco o con Enter, para no disparar una búsqueda nueva
// en cada dígito.
//
// router.push() ya trae datos frescos del server en cada cambio de
// filtro (buscar/page.tsx lee searchParams, así que Next re-renderiza
// el Server Component con cada navegación). El bug real que hubo acá
// no era de caché — era que SearchResultsGrid guarda los productos en
// useState(initialProducts), que solo toma ese valor al montar; el
// fix real está en su `key` en buscar/page.tsx, no aquí.
// ============================================================

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { getCategoryName } from '@/lib/utils'

interface CategoryOption {
  id: number
  name: string
  name_en: string
  name_fr: string
  slug: string
  emoji: string
}

interface ProvinceOption {
  id: number
  name: string
}

interface Props {
  categories: CategoryOption[]
  provinces: ProvinceOption[]
}

const SORT_OPTIONS = [
  { value: 'relevance', labelKey: 'sortRelevance' },
  { value: 'price_asc', labelKey: 'sortPriceAsc' },
  { value: 'price_desc', labelKey: 'sortPriceDesc' },
  { value: 'rating', labelKey: 'sortRating' },
  { value: 'newest', labelKey: 'sortNewest' },
  { value: 'sales', labelKey: 'sortSales' },
  { value: 'popularity', labelKey: 'sortPopularity' },
] as const

const selectStyle: React.CSSProperties = {
  border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff',
}

export function SearchFiltersBar({ categories, provinces }: Props) {
  const { t, language } = useTranslation('products')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const category = searchParams.get('category') ?? ''
  const province = searchParams.get('province') ?? ''
  const minRating = searchParams.get('minRating') ?? ''
  const minReviews = searchParams.get('minReviews') ?? ''
  const verifiedOnly = searchParams.get('verifiedOnly') === '1'
  const sort = searchParams.get('sort') ?? 'relevance'

  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '')

  const updateParams = (patch: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const commitPriceRange = () => {
    updateParams({ minPrice, maxPrice })
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 bg-white rounded-2xl border border-gray-100 p-3 mb-4">
      <select
        value={category}
        onChange={e => updateParams({ category: e.target.value })}
        style={selectStyle}
      >
        <option value="">{t('filterAllCategories')}</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.emoji} {getCategoryName(c, language)}</option>
        ))}
      </select>

      <select
        value={province}
        onChange={e => updateParams({ province: e.target.value })}
        style={selectStyle}
      >
        <option value="">{t('filterAllProvinces')}</option>
        {provinces.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <div className="flex items-center gap-1.5">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={t('filterMinPricePlaceholder')}
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          onBlur={commitPriceRange}
          onKeyDown={e => { if (e.key === 'Enter') commitPriceRange() }}
          style={{ ...selectStyle, width: 90 }}
        />
        <span className="text-gray-300">–</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={t('filterMaxPricePlaceholder')}
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          onBlur={commitPriceRange}
          onKeyDown={e => { if (e.key === 'Enter') commitPriceRange() }}
          style={{ ...selectStyle, width: 90 }}
        />
      </div>

      <select
        value={minRating}
        onChange={e => updateParams({ minRating: e.target.value })}
        style={selectStyle}
      >
        <option value="">{t('filterAnyRating')}</option>
        <option value="4">⭐ 4+</option>
        <option value="3">⭐ 3+</option>
        <option value="2">⭐ 2+</option>
        <option value="1">⭐ 1+</option>
      </select>

      <select
        value={minReviews}
        onChange={e => updateParams({ minReviews: e.target.value })}
        style={selectStyle}
      >
        <option value="">{t('filterAnyReviews')}</option>
        <option value="1">1+</option>
        <option value="5">5+</option>
        <option value="10">10+</option>
      </select>

      <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={e => updateParams({ verifiedOnly: e.target.checked ? '1' : '' })}
        />
        {t('filterVerifiedOnlyLabel')}
      </label>

      <select
        value={sort}
        onChange={e => updateParams({ sort: e.target.value === 'relevance' ? '' : e.target.value })}
        style={{ ...selectStyle, marginLeft: 'auto' }}
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
        ))}
      </select>
    </div>
  )
}
