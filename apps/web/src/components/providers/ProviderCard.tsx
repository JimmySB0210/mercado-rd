'use client'
// ============================================================
// MercadoRD — Tarjeta de resultado en el directorio de proveedores
// Ruta: src/components/providers/ProviderCard.tsx
// ============================================================
// Recibe solo PublicVendorCard (lib/publicVendor.ts), nunca la fila de
// search_providers. Todo lo demás llega ya resuelto en lote desde
// proveedores/page.tsx: tipos de negocio, servicios, estadísticas
// reales y hasta 3 productos publicados.
//
// Reglas de datos:
//   - Nota: el mismo criterio que VendorRealStatsLine (MIN_SAMPLE_SIZE
//     reseñas reales), siempre con el número exacto de reseñas. Con
//     menos reseñas se muestra solo el número; con 0, "Sin reseñas
//     todavía".
//   - Pedido mínimo y envíos muestran "No especificado"; el resto de
//     campos ausentes se omite sin dejar hueco.
//   - Tiempo de respuesta y entregas a tiempo no van aquí: no hay RPC
//     por lotes y pedirlos por tarjeta sería N+1.
// Botones: "Visitar tienda" con contorno y "Chatear" relleno
// (StoreChatButton, el mismo de la cabecera del perfil). El chat no
// aparece en la tienda propia; ownVendorId se resuelve una vez por
// página.
// ============================================================

import { useState } from 'react'
import Image from 'next/image'
import { Clock, ImageOff, MapPin, Package, Star, Tag, Truck } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { getCategoryName } from '@/lib/utils'
import { getVisibleRating, getVisibleSales } from '@/components/shop/VendorRealStatsLine'
import { VerificationBadge } from '@/components/vendor/VerificationBadge'
import { StoreChatButton } from '@/components/vendor/StoreChatButton'
import { SHIPPING_SERVICES, vendorInitials, type PublicVendorCard } from '@/lib/publicVendor'
import type { VendorRealStats } from '@/lib/queries/vendorRealStatsBatch'
import type { BusinessType, VendorService } from '@/types/database.types'

export interface ProviderCardProduct {
  id: string
  name: string
  image: string
  isFeatured: boolean
}

interface Props {
  vendor: PublicVendorCard
  provinceName: string | null
  category: { name: string; name_en: string; name_fr: string } | null
  businessTypes: BusinessType[]
  services: VendorService[]
  stats?: VendorRealStats
  products: ProviderCardProduct[]
  publishedCount: number
  ownVendorId: string | null | undefined
  // Página local de ejemplos: el chat no llama a la base.
  previewOnly?: boolean
}

const MAX_BUSINESS_TYPES = 2
const MAX_SERVICE_CHIPS = 3

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]'

export function ProviderCard({ vendor, provinceName, category, businessTypes, services, stats, products, publishedCount, ownVendorId, previewOnly = false }: Props) {
  const { t, language } = useTranslation('directory')
  const { t: to } = useTranslation('vendorOptions')
  const { t: tp } = useTranslation('products')

  const storeHref = `/tienda/${vendor.id}`
  const location = [provinceName, vendor.municipio].filter(Boolean).join(' · ')

  const businessTypeLabels = businessTypes.map(v => to(`businessType.${v}`))
  const shownBusinessTypes = businessTypeLabels.slice(0, MAX_BUSINESS_TYPES)
  const hiddenBusinessTypes = businessTypeLabels.slice(MAX_BUSINESS_TYPES)

  // Servicios declarados (sin los de envío, que van en su propia celda)
  // más marca privada / personalización cuando el vendedor las marcó.
  const capabilityKeys: VendorService[] = services.filter(s => !(SHIPPING_SERVICES as readonly string[]).includes(s))
  if (vendor.acceptsPrivateLabel && !capabilityKeys.includes('private_label')) capabilityKeys.push('private_label')
  if (vendor.allowsCustomization === 'yes' && !capabilityKeys.includes('customization')) capabilityKeys.push('customization')
  const capabilityLabels = capabilityKeys.map(v => to(`service.${v}`))
  const shownCapabilities = capabilityLabels.slice(0, MAX_SERVICE_CHIPS)
  const hiddenCapabilities = capabilityLabels.slice(MAX_SERVICE_CHIPS)

  const shippingLabels = SHIPPING_SERVICES.filter(s => services.includes(s)).map(s => to(`service.${s}`))

  const minOrder = vendor.minOrderQuantity
    ? `${vendor.minOrderQuantity} ${vendor.minOrderUnit ?? t('unitsFallback')}`
    : null
  const productionTime = vendor.productionTime === 'custom'
    ? vendor.productionTimeCustom?.trim() || null
    : vendor.productionTime ? to(`productionTime.${vendor.productionTime}`) : null

  const rating = getVisibleRating(stats)
  const reviewCount = stats?.realRatingCount ?? 0
  const sales = getVisibleSales(stats)
  const reviewsText = `${reviewCount} ${reviewCount === 1 ? t('reviewCountSingular') : t('reviewCountPlural')}`

  const stripLabel = products.length > 0 && products.every(p => p.isFeatured) ? t('featuredStripLabel') : t('productsTitle')
  const extraProducts = publishedCount - products.length
  const memberSince = t('memberSinceYear', { year: new Date(vendor.createdAt).getFullYear() })

  return (
    <article
      className="flex flex-col gap-2.5 p-3.5 bg-[var(--color-card-bg)] border border-[var(--color-divider)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
      style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Identidad */}
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-h4 bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
          style={{ borderRadius: 'var(--radius-control)' }}
        >
          {vendor.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.logoUrl} alt={t('logoAlt', { store: vendor.businessName })} className="w-full h-full object-cover" />
          ) : (
            <span aria-hidden="true">{vendorInitials(vendor.businessName)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="m-0 min-w-0 text-h4 font-bold leading-snug">
              <a href={storeHref} className={`block truncate no-underline text-[var(--color-blue-dark)] hover:text-[var(--color-primary)] rounded ${focusRing}`}>
                {vendor.businessName}
              </a>
            </h3>
            {vendor.badges.map(badge => (
              <VerificationBadge key={`${badge.kind}-${badge.level}`} level={badge.level} />
            ))}
          </div>
          {location && (
            <p className="m-0 mt-0.5 flex items-center gap-1 text-caption text-[var(--color-text-tertiary)] truncate">
              <MapPin size={12} className="flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{location}</span>
            </p>
          )}
          <p className="m-0 mt-1 flex items-center gap-1 text-caption text-[var(--color-text-secondary)]">
            {rating !== null ? (
              <>
                <Star size={12} className="flex-shrink-0 text-[var(--color-yellow-cta)]" fill="currentColor" aria-hidden="true" />
                <span className="font-semibold text-[var(--color-text-primary)]">{rating.toFixed(1)}</span>
                <span>({reviewsText})</span>
              </>
            ) : reviewCount > 0 ? (
              <span>{reviewsText}</span>
            ) : (
              <span className="text-[var(--color-text-tertiary)]">{t('noReviewsCard')}</span>
            )}
            {sales !== null && <span>· {sales} {tp('salesSuffix')}</span>}
          </p>
        </div>
      </div>

      {/* Tipos de negocio y categoría principal */}
      {(shownBusinessTypes.length > 0 || category) && (
        <div className="flex items-center gap-1.5 flex-wrap text-badge">
          {shownBusinessTypes.map(label => (
            <span key={label} className="px-2 py-0.5 rounded-full font-medium bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
              {label}
            </span>
          ))}
          {hiddenBusinessTypes.length > 0 && (
            <span title={hiddenBusinessTypes.join(', ')} className="px-2 py-0.5 rounded-full font-medium bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
              +{hiddenBusinessTypes.length}
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1 text-[var(--color-text-secondary)] font-medium min-w-0">
              <Tag size={11} aria-hidden="true" />
              <span className="truncate">{getCategoryName(category, language)}</span>
            </span>
          )}
        </div>
      )}

      {/* Condiciones declaradas */}
      <div
        className="border border-[var(--color-divider)] bg-[var(--color-bg-main)] px-3 py-2"
        style={{ borderRadius: 'var(--radius-control)' }}
      >
        <dl className="m-0 flex flex-col gap-1">
          <KeyFact icon={<Package size={12} aria-hidden="true" />} label={t('cardMinOrderLabel')} value={minOrder} fallback={t('notSpecified')} />
          <KeyFact icon={<Truck size={12} aria-hidden="true" />} label={t('cardShippingLabel')} value={shippingLabels.length > 0 ? shippingLabels.join(' · ') : null} fallback={t('notSpecified')} />
          {productionTime && (
            <KeyFact icon={<Clock size={12} aria-hidden="true" />} label={t('cardProductionLabel')} value={productionTime} fallback="" />
          )}
        </dl>
        <p className="m-0 mt-1.5 text-badge text-[var(--color-text-tertiary)]">{t('declaredBySeller')}</p>
      </div>

      {/* Servicios y capacidades declarados */}
      {shownCapabilities.length > 0 && (
        <ul className="m-0 p-0 list-none flex items-center gap-1.5 flex-wrap text-badge">
          {shownCapabilities.map(label => (
            <li key={label} className="px-2 py-0.5 rounded-full font-medium border border-[var(--color-divider)] text-[var(--color-text-secondary)]">
              {label}
            </li>
          ))}
          {hiddenCapabilities.length > 0 && (
            <li title={hiddenCapabilities.join(', ')} className="px-2 py-0.5 rounded-full font-medium border border-[var(--color-divider)] text-[var(--color-text-secondary)]">
              +{hiddenCapabilities.length}
            </li>
          )}
        </ul>
      )}

      {/* Productos publicados con imagen real */}
      {products.length > 0 && (
        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-badge text-[var(--color-text-tertiary)]">
            <p className="m-0 font-semibold uppercase tracking-wide">{stripLabel}</p>
            <span className="truncate">{memberSince}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {products.map((product, index) => {
              const isLast = index === products.length - 1 && extraProducts > 0
              return (
                <a
                  key={product.id}
                  href={isLast ? storeHref : `/producto/${product.id}?origen=proveedores`}
                  aria-label={isLast ? t('moreProductsAria', { count: extraProducts, store: vendor.businessName }) : product.name}
                  className={`relative block h-14 overflow-hidden bg-[var(--color-bg-main)] ${focusRing}`}
                  style={{ borderRadius: 'var(--radius-control)' }}
                >
                  <ProductThumb src={product.image} alt={product.name} />
                  {isLast && (
                    <span
                      className="absolute inset-0 flex items-center justify-center text-white text-small font-bold"
                      style={{ background: 'color-mix(in srgb, var(--color-blue-dark) 62%, transparent)' }}
                    >
                      +{extraProducts}
                    </span>
                  )}
                </a>
              )
            })}
          </div>
        </div>
      )}

      {products.length === 0 && (
        <span className="text-badge text-[var(--color-text-tertiary)]">{memberSince}</span>
      )}

      {/* Acciones */}
      <div className="mt-auto flex items-center gap-2">
        <a
          href={storeHref}
          aria-label={`${t('visitStoreButton')}: ${vendor.businessName}`}
          className={`flex-1 inline-flex items-center justify-center min-h-[44px] px-3 no-underline text-small font-semibold text-[var(--color-primary)] bg-[var(--color-card-bg)] border border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors ${focusRing}`}
          style={{ borderRadius: 'var(--radius-control)' }}
        >
          {t('visitStoreButton')}
        </a>
        <StoreChatButton
          vendorId={vendor.id}
          businessName={vendor.businessName}
          ownVendorId={ownVendorId}
          labelSize="short"
          className="flex-1"
          previewOnly={previewOnly}
        />
      </div>
    </article>
  )
}

function KeyFact({ icon, label, value, fallback }: { icon: React.ReactNode; label: string; value: string | null; fallback: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 min-w-0 text-caption leading-snug">
      <dt className="flex items-center gap-1 flex-shrink-0 text-[var(--color-text-tertiary)]">
        {icon}
        {label}
      </dt>
      <dd className={`m-0 min-w-0 text-right truncate ${value ? 'font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`} title={value ?? undefined}>
        {value ?? fallback}
      </dd>
    </div>
  )
}

function ProductThumb({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return (
      <span className="absolute inset-0 flex items-center justify-center text-[var(--color-text-tertiary)]">
        <ImageOff size={18} aria-hidden="true" />
        <span className="sr-only">{alt}</span>
      </span>
    )
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 30vw, 120px"
      className="object-cover"
      onError={() => setBroken(true)}
    />
  )
}
