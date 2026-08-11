'use client'
// ============================================================
// MercadoRD — Contenido traducido de /dashboard/productos
// Ruta: src/app/dashboard/productos/ProductosContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase) y no
// puede usar useTranslation. Este componente recibe los productos ya
// resueltos como props y se encarga de todo el texto traducido.
// ============================================================

import { FeatureToggleButton } from '@/components/vendor/FeatureToggleButton'
import { ProductActiveToggle } from '@/components/vendor/ProductActiveToggle'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPrice } from '@/types/database.types'
import type { ProductStatus } from '@/types/database.types'
import { qualityTier, QUALITY_TIER_EMOJI, QUALITY_TIER_COLOR } from '@/lib/productQuality'
import { BRAND } from '@/lib/colors'

interface ProductRow {
  id: string
  name: string
  images: string[] | null
  status: ProductStatus
  stock: number
  price_rdp: number
  sold_count: number
  is_featured: boolean | null
  qualityPercent: number
}

const STATUS_BADGE_STYLE: Record<ProductStatus, { bg: string; text: string }> = {
  draft: { bg: '#E0E7FF', text: '#3730a3' },
  published: { bg: '#DCFCE7', text: '#166534' },
  paused: { bg: '#F3F4F6', text: '#666' },
}

interface Props {
  products: ProductRow[]
  isPro: boolean
}

export function ProductosContent({ products, isPro }: Props) {
  const { t } = useTranslation('dashboard')

  return (
    <div style={{ padding: 28, background: '#f5f5f5' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{t('productsPageTitle')}</h1>
          <p style={{ color: '#666', fontSize: 14 }}>
            {products.length === 1
              ? t('productCountOne', { count: products.length })
              : t('productCountOther', { count: products.length })}
          </p>
        </div>
        <a
          href="/dashboard/productos/nuevo"
          style={{ background: '#111', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
        >
          {t('newProductCta')}
        </a>
      </div>

      {products.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <p style={{ color: '#999', fontSize: 14, marginBottom: 16 }}>{t('noProductsYet')}</p>
          <a
            href="/dashboard/productos/nuevo"
            style={{ display: 'inline-block', background: BRAND.blue, color: '#fff', textDecoration: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}
          >
            {t('publishFirstProduct')}
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {products.map((p) => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ aspectRatio: '1/1', background: BRAND.bg, position: 'relative' }}>
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📦</div>
                )}
                <span
                  style={{
                    position: 'absolute', top: 8, left: 8,
                    background: STATUS_BADGE_STYLE[p.status].bg, color: STATUS_BADGE_STYLE[p.status].text,
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                  }}
                >
                  {p.status === 'draft' ? t('draftBadge') : p.status === 'published' ? t('publishedBadge') : t('pausedBadge')}
                </span>
                {p.stock === 0 && (
                  <span style={{ position: 'absolute', top: 8, right: 8, background: BRAND.red, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                    {t('outOfStockBadge')}
                  </span>
                )}
              </div>
              <div style={{ padding: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 6, lineHeight: 1.3, minHeight: 34, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                  {p.name}
                </p>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 4 }}>
                  {formatPrice(p.price_rdp)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 6 }}>
                  <span>{t('stockCountLabel', { count: p.stock })}</span>
                  <span>{t('soldCountLabel', { count: p.sold_count })}</span>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: QUALITY_TIER_COLOR[qualityTier(p.qualityPercent)].bg,
                      color: QUALITY_TIER_COLOR[qualityTier(p.qualityPercent)].text,
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    }}
                  >
                    {QUALITY_TIER_EMOJI[qualityTier(p.qualityPercent)]} {t('publishQualityLabel', { percent: p.qualityPercent })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <FeatureToggleButton
                    productId={p.id}
                    initialFeatured={p.is_featured ?? false}
                    isPro={isPro}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <a
                      href={`/dashboard/productos/${p.id}/editar`}
                      style={{ fontSize: 11, fontWeight: 600, color: BRAND.blue, textDecoration: 'none' }}
                    >
                      {t('editLink')}
                    </a>
                    <ProductActiveToggle productId={p.id} status={p.status} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
