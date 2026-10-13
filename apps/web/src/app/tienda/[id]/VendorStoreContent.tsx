'use client'
// ============================================================
// MercadoRD — Contenido traducido de /tienda/[id]
// Ruta: src/app/tienda/[id]/VendorStoreContent.tsx
// ============================================================
// page.tsx (servidor) y el paso 9 del asistente (VendorStorePreviewStep)
// le pasan el mismo VendorStoreData. Solo recibe datos públicos: el
// vendor ya pasó por toPublicVendorProfile y las reseñas no traen
// user_id.
//
// Secciones, en orden: cabecera · sobre la tienda · capacidades y
// servicios · condiciones comerciales · catálogo · reseñas · métricas
// medidas. Una sección sin datos no se renderiza, salvo catálogo y
// reseñas, que muestran su estado vacío.
//
// Nota: mismo criterio que la tarjeta de /proveedores — solo con
// MIN_SAMPLE_SIZE reseñas reales o más, siempre con el número; con
// 1-4 solo el número; con 0, "Sin reseñas todavía".
// ============================================================

import { Clock, Factory, MapPin, Package, Paintbrush, Star, Store, Tag, Truck, Warehouse, Wrench } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useHasVariantsMap } from '@/lib/hooks/useHasVariantsMap'
import { useOwnVendorId } from '@/lib/hooks/useOwnVendorId'
import { MIN_SAMPLE_SIZE } from '@/lib/hooks/useVendorTrustStats'
import { getCategoryName } from '@/lib/utils'
import { whatsappLink } from '@/lib/phone'
import { ProductCard } from '@/components/product/ProductCard'
import { ProductReviewsList, type ReviewViewModel } from '@/components/shop/ProductReviewsList'
import { getVisibleRating, getVisibleSales } from '@/components/shop/VendorRealStatsLine'
import { VerificationBadge } from '@/components/vendor/VerificationBadge'
import { StoreChatButton } from '@/components/vendor/StoreChatButton'
import { StoreMeasuredMetrics } from '@/components/vendor/StoreMeasuredMetrics'
import { SHIPPING_SERVICES, vendorInitials, type PublicCategory, type PublicVendorProfile } from '@/lib/publicVendor'
import type { BusinessType, CustomerType, VendorService } from '@/types/database.types'

export interface VendorStoreData {
  vendor: PublicVendorProfile
  // Forma que espera ProductCard (fila de products + subset del vendor).
  products: any[]
  reviews: ReviewViewModel[]
  realRatingAvg: number | null
  realTotalSales: number
  realRatingCount: number
  businessTypes: BusinessType[]
  categories: PublicCategory[]
  services: VendorService[]
  targetCustomers: CustomerType[]
  faqs: { id: string; question: string; answer: string }[]
}

const chip = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-caption font-medium'

export function VendorStoreContent({ data }: { data: VendorStoreData }) {
  const { vendor, products, reviews, businessTypes, categories, services, targetCustomers, faqs } = data
  const { t, language } = useTranslation('directory')
  const { t: to } = useTranslation('vendorOptions')
  const { t: tp } = useTranslation('products')
  const variantsById = useHasVariantsMap(products.map(p => p.id))
  const ownVendorId = useOwnVendorId()

  const stats = { realRatingAvg: data.realRatingAvg, realRatingCount: data.realRatingCount, realTotalSales: data.realTotalSales }
  const rating = getVisibleRating(stats)
  const sales = getVisibleSales(stats)
  const reviewCount = data.realRatingCount
  const reviewsText = `${reviewCount} ${reviewCount === 1 ? t('reviewCountSingular') : t('reviewCountPlural')}`

  const location = [vendor.provinceName, vendor.municipio, vendor.sector].filter(Boolean).join(' · ')
  // null si el número no es válido: entonces no se muestra el botón.
  const storeWhatsappHref = whatsappLink(vendor.whatsapp, `Hola, vi tu tienda ${vendor.businessName} en MercadoRD`)
  const otherCategories = categories.filter(c => c.id !== vendor.mainCategory?.id)

  // Capacidades declaradas
  const declaredServices = services.filter(s => !(SHIPPING_SERVICES as readonly string[]).includes(s))
  const presence = [
    vendor.hasPhysicalStore && { key: 'store', icon: <Store size={16} aria-hidden="true" />, label: t('physicalStoreLabel') },
    vendor.hasWarehouse && { key: 'warehouse', icon: <Warehouse size={16} aria-hidden="true" />, label: t('warehouseLabel') },
    vendor.hasWorkshop && { key: 'workshop', icon: <Wrench size={16} aria-hidden="true" />, label: t('workshopLabel') },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; label: string }[]
  // Etiquetas públicas en tercera persona (vendorOptions.public*), no las
  // del asistente, que están en primera persona.
  const capabilityRows = [
    vendor.manufacturingStatus && { key: 'mfg', icon: <Factory size={16} aria-hidden="true" />, text: to(`publicManufacturingStatus.${vendor.manufacturingStatus}`) },
    vendor.acceptsPrivateLabel !== null && { key: 'pl', icon: <Tag size={16} aria-hidden="true" />, text: to(`publicPrivateLabel.${vendor.acceptsPrivateLabel ? 'yes' : 'no'}`) },
    vendor.allowsCustomization && { key: 'cust', icon: <Paintbrush size={16} aria-hidden="true" />, text: to(`publicCustomization.${vendor.allowsCustomization}`) },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; text: string }[]
  const hasCapabilities = capabilityRows.length > 0 || presence.length > 0 || declaredServices.length > 0

  // Condiciones comerciales
  const minOrder = vendor.minOrderQuantity ? `${vendor.minOrderQuantity} ${vendor.minOrderUnit ?? t('unitsFallback')}` : null
  const productionTime = vendor.productionTime === 'custom'
    ? vendor.productionTimeCustom?.trim() || null
    : vendor.productionTime ? to(`publicProductionTime.${vendor.productionTime}`) : null
  const shipping = SHIPPING_SERVICES.filter(s => services.includes(s)).map(s => to(`service.${s}`))
  const hasTerms = !!minOrder || !!productionTime || shipping.length > 0 || faqs.length > 0

  const hasAbout = !!vendor.description || !!vendor.mainCategory || otherCategories.length > 0 || targetCustomers.length > 0 || !!vendor.physicalStoreAddress

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-5">

      {/* 1. Cabecera */}
      <header className="store-section">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden flex items-center justify-center text-h3 font-bold bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
            style={{ borderRadius: 'var(--radius-card)' }}
          >
            {vendor.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vendor.logoUrl} alt={t('logoAlt', { store: vendor.businessName })} className="w-full h-full object-cover" />
            ) : (
              <span aria-hidden="true">{vendorInitials(vendor.businessName)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="m-0 text-h2 font-bold text-[var(--color-blue-dark)] break-words min-w-0">{vendor.businessName}</h1>
              {vendor.badges.map(badge => (
                <VerificationBadge key={`${badge.kind}-${badge.level}`} level={badge.level} />
              ))}
            </div>

            {location && (
              <p className="m-0 mt-1 flex items-center gap-1 text-small text-[var(--color-text-secondary)]">
                <MapPin size={14} className="flex-shrink-0" aria-hidden="true" />
                <span className="min-w-0">{location}</span>
              </p>
            )}

            {businessTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {businessTypes.map(bt => (
                  <span key={bt} className={`${chip} bg-[var(--color-primary-subtle)] text-[var(--color-primary)]`}>
                    {to(`businessType.${bt}`)}
                  </span>
                ))}
              </div>
            )}

            <p className="m-0 mt-2 flex items-center gap-x-1.5 gap-y-0.5 flex-wrap text-small text-[var(--color-text-secondary)]">
              {rating !== null ? (
                <>
                  <Star size={14} className="text-[var(--color-yellow-cta)]" fill="currentColor" aria-hidden="true" />
                  <span className="font-semibold text-[var(--color-text-primary)]">{rating.toFixed(1)}</span>
                  <span>({reviewsText})</span>
                </>
              ) : reviewCount > 0 ? (
                <span>{reviewsText}</span>
              ) : (
                <span className="text-[var(--color-text-tertiary)]">{t('noReviewsCard')}</span>
              )}
              {sales !== null && <span>· {sales} {tp('salesSuffix')}</span>}
              <span className="text-[var(--color-text-tertiary)]">· {t('memberSinceYear', { year: new Date(vendor.createdAt).getFullYear() })}</span>
            </p>
          </div>
        </div>

        {/* Acciones: chat (mismo botón que la tarjeta), ver productos y los
            canales que la tienda ya exponía (WhatsApp, Instagram). No hay
            flujo de cotización sin producto: no se ofrece aquí. */}
        <div className="flex flex-wrap gap-2 mt-4">
          <StoreChatButton vendorId={vendor.id} businessName={vendor.businessName} ownVendorId={ownVendorId} className="px-4" />
          <a href="#catalogo" className="store-outline-btn">
            <Package size={16} aria-hidden="true" />
            {t('viewProductsButton')}
          </a>
          {storeWhatsappHref && (
            <a
              href={storeWhatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="store-outline-btn"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
              className="store-outline-btn"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              {t('instagramButton')}
            </a>
          )}
        </div>
      </header>

      {/* 2. Sobre la tienda */}
      {hasAbout && (
        <section aria-labelledby="store-about-title" className="store-section">
          <h2 id="store-about-title" className="store-section-title">{t('aboutStoreTitle')}</h2>
          {vendor.description && (
            <p className="m-0 text-body text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{vendor.description}</p>
          )}
          <dl className="m-0 mt-4 grid gap-4 sm:grid-cols-2 empty:hidden">
            {(vendor.mainCategory || otherCategories.length > 0) && (
              <div>
                <dt className="store-label">{t('categoriesLabel')}</dt>
                <dd className="m-0 mt-1.5 flex flex-wrap gap-1.5">
                  {vendor.mainCategory && (
                    <a href={`/categoria/${vendor.mainCategory.slug}`} className={`${chip} no-underline border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]`}>
                      {vendor.mainCategory.emoji} {getCategoryName(vendor.mainCategory, language)}
                      <span className="text-badge font-semibold">· {t('mainCategoryTag')}</span>
                    </a>
                  )}
                  {otherCategories.map(cat => (
                    <a key={cat.id} href={`/categoria/${cat.slug}`} className={`${chip} no-underline border border-[var(--color-divider)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-main)]`}>
                      {cat.emoji} {getCategoryName(cat, language)}
                    </a>
                  ))}
                </dd>
              </div>
            )}
            {targetCustomers.length > 0 && (
              <div>
                <dt className="store-label">{t('targetCustomersLabel')}</dt>
                <dd className="m-0 mt-1.5 flex flex-wrap gap-1.5">
                  {targetCustomers.map(c => (
                    <span key={c} className={`${chip} border border-[var(--color-divider)] text-[var(--color-text-secondary)]`}>
                      {to(`customerType.${c}`)}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {vendor.physicalStoreAddress && (
              <div>
                <dt className="store-label">{t('storeAddressLabel')}</dt>
                <dd className="m-0 mt-1.5 flex items-start gap-1.5 text-small text-[var(--color-text-primary)]">
                  <Store size={15} className="flex-shrink-0 mt-0.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
                  {vendor.physicalStoreAddress}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {/* 3. Capacidades y servicios (declarado por el vendedor) */}
      {hasCapabilities && (
        <section aria-labelledby="store-capabilities-title" className="store-section">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3.5">
            <h2 id="store-capabilities-title" className="store-section-title !mb-0">{t('capabilitiesTitle')}</h2>
            <span className="text-caption text-[var(--color-text-tertiary)]">{t('declaredBySeller')}</span>
          </div>
          {(capabilityRows.length > 0 || presence.length > 0) && (
            <ul className="m-0 p-0 list-none grid gap-2.5 sm:grid-cols-2">
              {capabilityRows.map(row => (
                <li key={row.key} className="flex items-center gap-2.5 text-small font-semibold text-[var(--color-text-primary)]">
                  <span className="store-icon">{row.icon}</span>
                  {row.text}
                </li>
              ))}
              {presence.map(p => (
                <li key={p.key} className="flex items-center gap-2.5 text-small font-semibold text-[var(--color-text-primary)]">
                  <span className="store-icon">{p.icon}</span>
                  {p.label}
                </li>
              ))}
            </ul>
          )}
          {declaredServices.length > 0 && (
            <div className={capabilityRows.length > 0 || presence.length > 0 ? 'mt-4' : ''}>
              <p className="store-label m-0">{t('declaredServicesLabel')}</p>
              <ul className="m-0 mt-1.5 p-0 list-none flex flex-wrap gap-1.5">
                {declaredServices.map(s => (
                  <li key={s} className={`${chip} border border-[var(--color-divider)] text-[var(--color-text-secondary)]`}>{to(`service.${s}`)}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* 4. Condiciones comerciales */}
      {hasTerms && (
        <section aria-labelledby="store-terms-title" className="store-section">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3.5">
            <h2 id="store-terms-title" className="store-section-title !mb-0">{t('commercialTermsTitle')}</h2>
            <span className="text-caption text-[var(--color-text-tertiary)]">{t('declaredBySeller')}</span>
          </div>
          <dl className="m-0 grid gap-3 sm:grid-cols-3">
            <Term icon={<Package size={16} aria-hidden="true" />} label={t('cardMinOrderLabel')} value={minOrder} fallback={t('notSpecified')} />
            <Term icon={<Clock size={16} aria-hidden="true" />} label={t('productionTimeTerm')} value={productionTime} fallback={t('notSpecified')} />
            <Term icon={<Truck size={16} aria-hidden="true" />} label={t('shippingTerm')} value={shipping.length > 0 ? shipping.join(' · ') : null} fallback={t('notSpecified')} />
          </dl>
          {faqs.length > 0 && (
            <div className="mt-5">
              <h3 className="m-0 mb-2 text-h4 font-bold text-[var(--color-text-primary)]">{t('faqTitle')}</h3>
              <div className="flex flex-col gap-2">
                {faqs.map(f => (
                  <details key={f.id} className="group border border-[var(--color-divider)] px-4 py-3" style={{ borderRadius: 'var(--radius-control)' }}>
                    <summary className="cursor-pointer text-small font-semibold text-[var(--color-text-primary)]">{f.question}</summary>
                    <p className="m-0 mt-2 text-small text-[var(--color-text-secondary)] whitespace-pre-line">{f.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 5. Catálogo */}
      <section id="catalogo" aria-labelledby="store-catalog-title" className="scroll-mt-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 id="store-catalog-title" className="store-section-title !mb-0">
            {t('productsTitle')} {products.length > 0 && <span className="text-[var(--color-text-tertiary)] font-semibold">({products.length})</span>}
          </h2>
          {products.length > 0 && (
            <a href={`/buscar?vendor=${vendor.id}`} className="text-small font-semibold text-[var(--color-primary)] no-underline hover:underline">
              {t('viewAllStoreProductsLink')}
            </a>
          )}
        </div>
        {products.length === 0 ? (
          <div className="store-section text-center py-10">
            <Package size={28} className="mx-auto text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <p className="m-0 mt-2 text-small text-[var(--color-text-secondary)]">{t('noProductsYet')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {products.map(p => (
              <ProductCard key={p.id} product={p} hasVariants={variantsById.get(p.id)} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Reseñas reales */}
      <section aria-labelledby="store-reviews-title" className="store-section">
        <h2 id="store-reviews-title" className="store-section-title">
          {t('reviewsSectionTitle')} {reviews.length > 0 && <span className="text-[var(--color-text-tertiary)] font-semibold">({reviews.length})</span>}
        </h2>
        <ProductReviewsList reviews={reviews} minForBreakdown={MIN_SAMPLE_SIZE} emptyText={t('noReviewsStore')} />
      </section>

      {/* 7. Métricas medidas (solo con muestra suficiente) */}
      <StoreMeasuredMetrics vendorId={vendor.id} />
    </div>
  )
}

function Term({ icon, label, value, fallback }: { icon: React.ReactNode; label: string; value: string | null; fallback: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 bg-[var(--color-bg-main)] border border-[var(--color-divider)]" style={{ borderRadius: 'var(--radius-control)' }}>
      <span className="store-icon">{icon}</span>
      <div className="min-w-0">
        <dt className="text-caption text-[var(--color-text-tertiary)]">{label}</dt>
        <dd className={`m-0 mt-0.5 text-small ${value ? 'font-semibold text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}>{value ?? fallback}</dd>
      </div>
    </div>
  )
}
