'use client'
// ============================================================
// MercadoRD — Contenido traducido de /dashboard/productos
// Ruta: src/app/dashboard/productos/ProductosContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase) y no
// puede usar useTranslation. Este componente recibe los productos ya
// resueltos como props y se encarga de todo el texto traducido.
//
// Filtros, búsqueda y orden operan sobre el arreglo cargado: no hay
// paginación (getVendorProducts no tiene .limit()), así que los
// contadores son el total real del vendedor.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Boxes, CircleCheck, CirclePause, TriangleAlert, Layers, ChevronDown } from 'lucide-react'
import { FeatureToggleButton } from '@/components/vendor/FeatureToggleButton'
import { ProductActiveToggle } from '@/components/vendor/ProductActiveToggle'
import { DailyDealAction } from '@/components/vendor/DailyDealAction'
import { StoreSummaryCard } from '@/components/vendor/StoreSummaryCard'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPrice } from '@/types/database.types'
import type { ProductStatus } from '@/types/database.types'
import { qualityTier, QUALITY_TIER_EMOJI, QUALITY_TIER_COLOR } from '@/lib/productQuality'
import { isStockAlert } from '@/lib/productStock'
import { getCategoryName } from '@/lib/utils'
import type { VendorRealStats } from '@/lib/queries/vendor-dashboard'

interface ProductRow {
  id: string
  name: string
  images: string[] | null
  status: ProductStatus
  stock: number
  low_stock_threshold: number | null
  price_rdp: number
  sold_count: number
  is_featured: boolean | null
  category_id: number | null
  qualityPercent: number
  activeDeal: { id: string; deal_price_rdp: number; expires_at: string } | null
  hasTiers: boolean
}

interface CategoryOption { id: number; name: string; name_en: string; name_fr: string; emoji: string }

interface StoreSummary {
  vendor: { id: string; businessName: string; logoUrl: string | null; provinceName: string | null }
  realStats: VendorRealStats
  completenessPercent: number
}

type StatusFilter = 'all' | 'published' | 'paused' | 'draft' | 'lowstock'
type SortKey = 'recent' | 'priceAsc' | 'priceDesc' | 'stockAsc' | 'sold' | 'name'

const STATUS_BADGE_STYLE: Record<ProductStatus, { bg: string; text: string }> = {
  draft: { bg: '#E0E7FF', text: '#3730a3' },
  published: { bg: '#DCFCE7', text: '#166534' },
  paused: { bg: '#F3F4F6', text: '#666' },
}

interface Props {
  products: ProductRow[]
  isPro: boolean
  categories: CategoryOption[]
  store: StoreSummary
}

export function ProductosContent({ products, isPro, categories, store }: Props) {
  const { t, language } = useTranslation('dashboard')
  // ?tiersWarning=1 -- lo agrega ProductForm.tsx al redirigir acá
  // cuando un producto recién creado se guardó bien pero sus tramos de
  // precio por cantidad no (ver handleSubmit). No bloqueante: el
  // producto ya está en la lista de abajo, solo se avisa.
  const showTiersWarning = useSearchParams().get('tiersWarning') === '1'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('recent')

  const counts = {
    all: products.length,
    published: products.filter(p => p.status === 'published').length,
    paused: products.filter(p => p.status === 'paused').length,
    lowstock: products.filter(p => isStockAlert(p)).length,
  }

  const categoryOptions = categories.filter(c => products.some(p => p.category_id === c.id))

  const visible = products
    .filter(p => {
      if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false
      if (statusFilter === 'all') return true
      if (statusFilter === 'lowstock') return isStockAlert(p)
      return p.status === statusFilter
    })
    .sort((a, b) => {
      switch (sort) {
        case 'priceAsc': return a.price_rdp - b.price_rdp
        case 'priceDesc': return b.price_rdp - a.price_rdp
        case 'stockAsc': return a.stock - b.stock
        case 'sold': return b.sold_count - a.sold_count
        case 'name': return a.name.localeCompare(b.name)
        default: return 0
      }
    })

  const summaryChips: { key: StatusFilter; label: string; count: number; color: string; Icon: typeof Boxes }[] = [
    { key: 'all', label: t('summaryAll'), count: counts.all, color: 'var(--dashboard-blue)', Icon: Boxes },
    { key: 'published', label: t('summaryPublished'), count: counts.published, color: '#00A86B', Icon: CircleCheck },
    { key: 'paused', label: t('summaryPaused'), count: counts.paused, color: '#D97706', Icon: CirclePause },
    { key: 'lowstock', label: t('summaryLowStock'), count: counts.lowstock, color: '#D2282D', Icon: TriangleAlert },
  ]

  const controlStyle: React.CSSProperties = {
    border: '1px solid #E0E4E9', borderRadius: 8, padding: '8px 10px', fontSize: 13, background: '#fff', color: '#131A18', minWidth: 0,
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5' }}>
      {showTiersWarning && (
        <div style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 16 }}>
          {t('productTiersSaveWarning')}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-[18px]">
        <div style={{ minWidth: 0 }}>
          {/* Encabezado */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 2, color: '#131A18', lineHeight: 1.2 }}>{t('productsPageTitle')}</h1>
              <p style={{ color: '#818F98', fontSize: 13 }}>
                {products.length === 1
                  ? t('productCountOne', { count: products.length })
                  : t('productCountOther', { count: products.length })}
              </p>
            </div>
            <a
              href="/dashboard/productos/nuevo"
              style={{ background: 'var(--dashboard-blue)', color: '#fff', textDecoration: 'none', padding: '9px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13.5 }}
            >
              {t('newProductCta')}
            </a>
          </div>

          {products.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', border: '1px solid #EEF2F6' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <p style={{ color: '#818F98', fontSize: 14, marginBottom: 16 }}>{t('noProductsYet')}</p>
              <a
                href="/dashboard/productos/nuevo"
                style={{ display: 'inline-block', background: 'var(--dashboard-blue)', color: '#fff', textDecoration: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}
              >
                {t('publishFirstProduct')}
              </a>
            </div>
          ) : (
            <>
              {/* Indicadores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {summaryChips.map(({ key, label, count, color, Icon }) => {
                  const active = statusFilter === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStatusFilter(key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                        border: `1px solid ${active ? color : '#EEF2F6'}`, background: active ? `color-mix(in srgb, ${color} 7%, white)` : '#fff',
                      }}
                    >
                      <span style={{ width: 26, height: 26, borderRadius: 7, background: `color-mix(in srgb, ${color} 14%, white)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={15} color={color} strokeWidth={2} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 11.5, color: '#818F98', fontWeight: 600 }}>{label}</span>
                        <span style={{ display: 'block', fontSize: 17, fontWeight: 800, color: '#131A18', lineHeight: 1.2 }}>{count}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Búsqueda y filtros */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('productSearchPlaceholder')}
                  style={{ ...controlStyle, flex: '1 1 220px' }}
                />
                <select value={categoryFilter === 'all' ? 'all' : String(categoryFilter)} onChange={e => setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} style={{ ...controlStyle, flex: '0 1 180px' }} aria-label={t('categoryFilterLabel')}>
                  <option value="all">{t('allCategoriesOption')}</option>
                  {categoryOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {getCategoryName(c, language)}</option>
                  ))}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} style={{ ...controlStyle, flex: '0 1 160px' }} aria-label={t('statusFilterLabel')}>
                  <option value="all">{t('summaryAll')}</option>
                  <option value="published">{t('summaryPublished')}</option>
                  <option value="paused">{t('summaryPaused')}</option>
                  <option value="draft">{t('summaryDraft')}</option>
                  <option value="lowstock">{t('summaryLowStock')}</option>
                </select>
                <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ ...controlStyle, flex: '0 1 200px' }} aria-label={t('sortLabel')}>
                  <option value="recent">{t('sortRecent')}</option>
                  <option value="priceAsc">{t('sortPriceAsc')}</option>
                  <option value="priceDesc">{t('sortPriceDesc')}</option>
                  <option value="stockAsc">{t('sortStockAsc')}</option>
                  <option value="sold">{t('sortSold')}</option>
                  <option value="name">{t('sortName')}</option>
                </select>
              </div>

              {visible.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 12, padding: 36, textAlign: 'center', border: '1px solid #EEF2F6', color: '#818F98', fontSize: 13.5 }}>
                  {t('noProductsMatchFilters')}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
                  {visible.map(p => (
                    <ProductTile key={p.id} p={p} isPro={isPro} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {products.length > 0 && (
          <div style={{ minWidth: 0 }}>
            <StoreSummaryCard
              vendor={store.vendor}
              realStats={store.realStats}
              completenessPercent={store.completenessPercent}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ProductTile({ p, isPro }: { p: ProductRow; isPro: boolean }) {
  const { t } = useTranslation('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic afuera -- los clics dentro del menú (incluido
  // el formulario de oferta del día y la confirmación de pausa) no lo cierran.
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  const lowStock = isStockAlert(p)
  const tier = qualityTier(p.qualityPercent)

  return (
    <div style={{ position: 'relative', background: '#fff', borderRadius: 12, border: '1px solid #EEF2F6', boxShadow: '0 1px 6px rgba(10,30,60,0.05)' }}>
      <div style={{ position: 'relative', aspectRatio: '1/1', background: '#F3F5F7', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
        {p.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>📦</div>
        )}
        <span style={{ position: 'absolute', top: 7, left: 7, background: STATUS_BADGE_STYLE[p.status].bg, color: STATUS_BADGE_STYLE[p.status].text, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
          {p.status === 'draft' ? t('draftBadge') : p.status === 'published' ? t('publishedBadge') : t('pausedBadge')}
        </span>
        {lowStock && p.stock === 0 ? (
          <span style={{ position: 'absolute', top: 7, right: 7, background: '#D2282D', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
            {t('outOfStockShort')}
          </span>
        ) : lowStock && (
          <span style={{ position: 'absolute', top: 7, right: 7, background: '#F59E0B', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
            {t('summaryLowStock')}
          </span>
        )}
      </div>

      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#131A18', marginBottom: 4, lineHeight: 1.3, minHeight: 34, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
          {p.name}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#131A18' }}>{formatPrice(p.price_rdp)}</span>
          {p.hasTiers && (
            <span title={t('quantityPricingHint')} aria-label={t('quantityPricingHint')} style={{ display: 'inline-flex', color: 'var(--dashboard-blue)' }}>
              <Layers size={14} strokeWidth={2} />
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#818F98', marginBottom: 8 }}>
          <span style={{ color: lowStock && p.stock === 0 ? '#D2282D' : lowStock ? '#B45309' : '#818F98', fontWeight: lowStock ? 700 : 400 }}>
            {t('stockCountLabel', { count: p.stock })}
          </span>
          <span>{t('salesColumnLabel')}: <strong style={{ color: '#131A18' }}>{p.sold_count}</strong></span>
        </div>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: QUALITY_TIER_COLOR[tier].bg, color: QUALITY_TIER_COLOR[tier].text, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, marginBottom: 10 }}>
          {QUALITY_TIER_EMOJI[tier]} {t('publishQualityLabel', { percent: p.qualityPercent })}
        </span>

        <div style={{ display: 'flex', gap: 6, position: 'relative' }} ref={menuRef}>
          <a
            href={`/dashboard/productos/${p.id}/editar`}
            style={{ flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: 700, color: '#fff', background: 'var(--dashboard-blue)', textDecoration: 'none', padding: '7px 0', borderRadius: 7 }}
          >
            {t('editLink')}
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            aria-expanded={menuOpen}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: '#3D5361', background: '#fff', border: '1px solid #E0E4E9', borderRadius: 7, padding: '6px 8px', cursor: 'pointer' }}
          >
            {t('moreActionsButton')} <ChevronDown size={13} />
          </button>

          {menuOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 40, width: 280, background: '#fff', border: '1px solid #E0E4E9', borderRadius: 10, boxShadow: '0 8px 24px rgba(10,30,60,0.14)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <FeatureToggleButton productId={p.id} initialFeatured={p.is_featured ?? false} isPro={isPro} />
              <ProductActiveToggle productId={p.id} status={p.status} />
              <DailyDealAction productId={p.id} currentPriceRdp={p.price_rdp} initialDeal={p.activeDeal} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
