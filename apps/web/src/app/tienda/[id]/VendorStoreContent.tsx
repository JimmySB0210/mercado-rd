'use client'
// ============================================================
// MercadoRD — Contenido traducido de /tienda/[id]
// Ruta: src/app/tienda/[id]/VendorStoreContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase) y no
// puede usar useTranslation (hook de cliente). Este componente recibe
// los datos ya resueltos como prop y se encarga de todo el texto
// traducido.
//
// La duración de membresía ("Miembro desde") se recalcula aquí,
// traducida, en vez de usar getMembershipDuration() de lib/utils.ts —
// esa función también la usa app/mensajes/[id]/page.tsx (fuera de este
// alcance) y devuelve texto ya en español, así que no se toca; la
// lógica se replica localmente igual que con otras utilidades
// compartidas.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { ProductCard } from '@/components/product/ProductCard'
import { VerificationBadge } from '@/components/vendor/VerificationBadge'
import { VendorOptionLabel } from '@/components/vendor/VendorOptionLabel'
import { VendorTrustBar } from '@/components/shop/VendorTrustBar'
import type { BusinessType, CustomerType, VendorService } from '@/types/database.types'

interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  buyer_name: string | null
}

interface CategoryRow { id: number; name: string; emoji: string; slug: string }

interface VendorRow {
  id: string
  business_name: string
  logo_url: string | null
  description: string | null
  address: string | null
  whatsapp: string | null
  instagram: string | null
  verification_level: number | null
  rating_avg: number | null
  total_sales: number | null
  created_at: string
  min_order_quantity: number | null
  min_order_unit: string | null
  production_time: string | null
  production_time_custom: string | null
  accepts_private_label: boolean | null
  allows_customization: string | null
  province: { name: string } | null
}

interface Props {
  vendor: VendorRow
  productsWithVendor: any[]
  reviews: ReviewRow[]
  reviewCount: number
  businessTypes: BusinessType[]
  vendorCategories: CategoryRow[]
  services: VendorService[]
  targetCustomers: CustomerType[]
  showsManufacturing: boolean
  hasProviderInfo: boolean
  memberSinceRaw: string
}

export function VendorStoreContent({
  vendor, productsWithVendor, reviews, reviewCount, businessTypes, vendorCategories,
  services, targetCustomers, showsManufacturing, hasProviderInfo, memberSinceRaw,
}: Props) {
  const { t, language } = useTranslation('directory')
  const memberSince = formatDate(memberSinceRaw, language, { month: 'long', year: 'numeric' })

  const membershipDuration = (() => {
    const created = new Date(vendor.created_at)
    const now = new Date()
    const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth())
    if (months < 1) return t('membershipNew')
    if (months < 12) return t(months === 1 ? 'membershipMonthsSingular' : 'membershipMonthsPlural', { count: months })
    const years = Math.floor(months / 12)
    return t(years === 1 ? 'membershipYearsSingular' : 'membershipYearsPlural', { count: years })
  })()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header de la tienda */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl font-bold text-gray-300">
            {vendor.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
            ) : (
              vendor.business_name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{vendor.business_name}</h1>
              <VerificationBadge level={vendor.verification_level ?? 1} />
            </div>

            {businessTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {businessTypes.map(bt => (
                  <span key={bt} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    <VendorOptionLabel category="businessType" value={bt} />
                  </span>
                ))}
              </div>
            )}

            {vendor.province && (
              <p className="text-sm text-gray-400 mt-1.5">
                📍 {vendor.province.name}
                {vendor.address && ` · ${vendor.address}`}
              </p>
            )}

            {Number(vendor.rating_avg) > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(vendor.rating_avg ?? 0) ? 'text-amber-400' : 'text-gray-200'}`}
                      fill="currentColor" viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {Number(vendor.rating_avg).toFixed(1)} ({reviewCount} {reviewCount === 1 ? t('reviewCountSingular') : t('reviewCountPlural')})
                </span>
              </div>
            )}
          </div>
        </div>

        {vendor.description && (
          <p className="text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-line">
            {vendor.description}
          </p>
        )}

        {/* Contacto */}
        <div className="flex flex-wrap gap-2 mt-4">
          {vendor.whatsapp && (
            <a
              href={`https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(`Hola, vi tu tienda ${vendor.business_name} en MercadoRD`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-green-500 text-green-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-50 transition-colors no-underline"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('whatsappButton')}
            </a>
          )}
          {vendor.instagram && (
            <a
              href={`https://instagram.com/${vendor.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 border border-pink-400 text-pink-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-pink-50 transition-colors no-underline"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              {t('instagramButton')}
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{vendor.total_sales ?? 0}</p>
            <p className="text-xs text-gray-400">{t('totalSalesLabel')}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 capitalize">{memberSince}</p>
            <p className="text-xs text-gray-400">{t('memberSinceLabel', { duration: membershipDuration })}</p>
          </div>
        </div>
      </div>

      {/* Confianza del vendedor */}
      <VendorTrustBar vendorId={vendor.id} className="mb-6" />

      {/* Información del proveedor — solo si completó el wizard de registro */}
      {hasProviderInfo && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('providerInfoTitle')}</h2>

          <div className="flex flex-col gap-5">
            {vendorCategories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('categoriesLabel')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {vendorCategories.map(cat => (
                    <a
                      key={cat.id}
                      href={`/categoria/${cat.slug}`}
                      className="text-xs px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-700 font-medium no-underline hover:bg-gray-100 transition-colors"
                    >
                      {cat.emoji} {cat.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {showsManufacturing && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('manufacturingSpecialtyLabel')}</p>
                <div className="flex flex-col gap-1 text-sm text-gray-600">
                  {vendor.production_time && (
                    <p>{t('productionTimeLabel')} <span className="font-medium text-gray-900">
                      {vendor.production_time === 'custom'
                        ? vendor.production_time_custom
                        : <VendorOptionLabel category="productionTime" value={vendor.production_time} />}
                    </span></p>
                  )}
                  {vendor.accepts_private_label !== null && (
                    <p>{t('privateLabelLabel')} <span className="font-medium text-gray-900">{vendor.accepts_private_label ? t('yesValue') : t('noValue')}</span></p>
                  )}
                  {vendor.allows_customization && (
                    <p>{t('customizationLabel')} <span className="font-medium text-gray-900">
                      <VendorOptionLabel category="customizationOption" value={vendor.allows_customization} />
                    </span></p>
                  )}
                </div>
              </div>
            )}

            {services.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('servicesSectionLabel')}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {services.map(s => (
                    <span key={s} className="text-sm text-gray-700">
                      <span className="text-green-600 font-bold">✓</span> <VendorOptionLabel category="service" value={s} />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!!vendor.min_order_quantity && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('minOrderQuantityLabel')}</p>
                <p className="text-sm text-gray-900 font-medium">
                  {vendor.min_order_quantity} {vendor.min_order_unit ?? t('unitsFallback')}
                </p>
              </div>
            )}

            {targetCustomers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('targetCustomersLabel')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {targetCustomers.map(c => (
                    <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-700 font-medium">
                      <VendorOptionLabel category="customerType" value={c} />
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Productos */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {t('productsTitle')} {productsWithVendor.length > 0 && `(${productsWithVendor.length})`}
        </h2>
        {productsWithVendor.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-gray-500 text-sm">{t('noProductsYet')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {productsWithVendor.map(p => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        )}
      </div>

      {/* Reseñas recientes */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('recentReviewsTitle')}</h2>
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-gray-500 text-sm">{t('noReviewsYet')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map(r => {
              const date = formatDate(r.created_at, language, {
                day: 'numeric', month: 'short', year: 'numeric',
              })
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <span className="text-sm font-semibold text-gray-900">{r.buyer_name ?? t('clientFallback')}</span>
                    <span className="text-xs text-gray-400">{date}</span>
                  </div>
                  <div className="flex mb-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= r.rating ? 'text-amber-400' : 'text-gray-200'}`}
                        fill="currentColor" viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
