'use client'
// ============================================================
// MercadoRD — Contenido traducido de /producto/[id]
// Ruta: src/app/producto/[id]/ProductPageContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase) y no
// puede usar useTranslation. Este componente recibe el producto ya
// resuelto (+ valores derivados) como props y renderiza breadcrumb +
// una cuadrícula de 3 columnas (galería/vendedor · info · buy-box) +
// pestañas (Descripción/Especificaciones/Envío/Reseñas/Preguntas).
//
// reviewsSlot/faqSlot llegan ya renderizados desde page.tsx — son
// Server Components (ProductReviews/ProductFaqSection hacen su propio
// fetch a Supabase) que este Client Component no puede importar
// directamente, pero sí puede recibir como children/props ya resueltos
// y colocarlos dentro de las pestañas sin volver a pedirlos.
//
// Nombre y descripción del producto en sí (texto libre del vendor, no
// una key de i18n) se traducen aparte, bajo demanda, contra
// /api/ai/translate-product — automático al cambiar el idioma del
// sitio, sin botón (a diferencia del chat). Mientras no haya idioma
// distinto de español, o mientras la traducción todavía no llega,
// displayName/displayDescription son el texto original — nunca un
// estado vacío.
// ============================================================

import { useEffect, useState } from 'react'
import { Check, Truck } from 'lucide-react'
import { ProductGallery } from '@/components/product/ProductGallery'
import { AgeConfirmationModal } from '@/components/shop/AgeConfirmationModal'
import { ProductActionsProvider, ProductSelectors, AddToCartButton, BuyNowButton, useOptionalProductActionsContext } from '@/components/product/ProductActions'
import { FreeShippingBadge } from '@/components/product/FreeShippingBadge'
import { ProductTabs, type ProductTabDef } from '@/components/product/ProductTabs'
import { ShippingEstimateLine } from '@/components/product/ShippingEstimateLine'
import { VolumePricingBanner } from '@/components/product/VolumePricingBanner'
import { ContactVendorButton } from '@/components/product/ContactVendorButton'
import { GiftListButton } from '@/components/product/GiftListButton'
import { VendorInfoBar } from '@/components/product/VendorInfoBar'
import { VendorRatingOverview } from '@/components/product/VendorRatingOverview'
import { useAuth } from '@/lib/hooks/useAuth'
import { useVendorTrustStats } from '@/lib/hooks/useVendorTrustStats'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useCartSubtotal } from '@/lib/store/cart'
import { useShippingRateForCurrentProvince, useMinShippingRate } from '@/lib/hooks/useShippingRate'
import { qualifiesForFreeShipping, amountUntilFreeShippingRdp, resolveEffectiveUnitPriceRdp, type PricingTierLike } from '@/lib/shipping'
import { formatPrice } from '@/types/database.types'
import type { Language } from '@/lib/store/language'
import type { ProductVariant } from '@/types/database.types'
import type { Product } from '@/types'

interface VendorInfo {
  id: string
  business_name: string
  is_verified: boolean
  whatsapp?: string
  logo_url?: string | null
  // Para comparar contra el usuario logueado y bloquear la auto-compra
  // (un vendedor no puede comprar su propio producto) — opcional porque
  // ProductPreviewModal.tsx no lo necesita (vista previa sin comprador real).
  user_id?: string
}

// name_en/name_fr/requires_age_confirmation opcionales — ProductPreviewModal.tsx
// (vista previa desde el formulario del vendedor, sin guardar) reusa
// este mismo componente con una categoría más angosta (solo
// slug/emoji/name, sin los 2 idiomas ni la confirmación de edad).
interface CategoryInfo {
  slug: string
  emoji: string
  name: string
  name_en?: string
  name_fr?: string
  requires_age_confirmation?: boolean
}

// Igual que getCategoryName() de lib/utils.ts pero tolerante a
// name_en/name_fr ausentes (cae al nombre en español) — esa función
// exige los 3 campos, lo cual rompería ProductPreviewModal.tsx. Toma
// solo {name, name_en?, name_fr?} para que sirva tanto para
// product.category (CategoryInfo) como para parentCategory (más angosto).
function categoryLabel(category: { name: string; name_en?: string; name_fr?: string }, language: Language): string {
  if (language === 'en' && category.name_en) return category.name_en
  if (language === 'fr' && category.name_fr) return category.name_fr
  return category.name
}

export interface ProductSpecItem {
  label: string
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean'
  displayValue: string
  boolValue: boolean | null
  sortOrder: number
}

// Dimensión de variante dinámica (ej. Capacidad, Color) resuelta desde
// category_attributes (applies_to_variant = true) + attribute_options.
export interface VariantDynamicDimension {
  attributeId: string
  key: string
  label: string
  options: { value: string; label: string }[]
}

// variantId -> { attributeId -> value_text (código, no label) }
export type VariantDynamicValuesMap = Record<string, Record<string, string>>

// Mismas filas que ve el vendor en PricingTiersSection.tsx — acá solo
// se renderizan cuando showTiersAsMainPrice es true (ver más abajo).
export interface PricingTier {
  id: string
  min_quantity: number
  max_quantity: number | null
  price_rdp: number
  unit_label: string
}

interface Props {
  product: Product & {
    category: CategoryInfo | null
    province: { name: string } | null
  }
  vendor: VendorInfo | undefined
  variants: ProductVariant[]
  hasDiscount: boolean
  discount: number | null
  itbis: number
  totalConItbis: number
  specs?: ProductSpecItem[]
  dynamicDimensions?: VariantDynamicDimension[]
  variantDynamicValues?: VariantDynamicValuesMap
  // Categoría padre (solo nombre) para el breadcrumb de 2 niveles —
  // null si la categoría del producto no tiene padre (o no hay categoría)
  parentCategory?: { name: string; name_en?: string; name_fr?: string; slug: string } | null
  // Los 4 siguientes son opcionales con valores por defecto honestos —
  // ProductPreviewModal.tsx (vista previa sin guardar, sin producto real
  // en la BD todavía) no tiene reseñas/FAQ reales que pasar; ahí no se
  // le pasa nada y esta vista cae al mismo estado "Aún no hay reseñas"
  // que vería un producto real recién publicado, sin pestaña de Preguntas.
  reviewsSlot?: React.ReactNode
  reviewCount?: number
  faqSlot?: React.ReactNode | null
  hasFaqContent?: boolean
  // Igual que hasFaqContent — false por defecto (honesto) para
  // ProductPreviewModal.tsx, que no consulta product_pricing_tiers ni
  // vendor_business_types para el formulario en curso.
  hasWholesaleOffering?: boolean
  // Filas reales de product_pricing_tiers — solo se usan cuando
  // showTiersAsMainPrice es true (ver esa prop). El resto del tiempo
  // page.tsx las sigue trayendo igual, pero acá no se consumen.
  pricingTiers?: PricingTier[]
  // true solo cuando el visitante llegó con ?origen=proveedores Y el
  // producto tiene tramos reales (calculado en page.tsx) — reemplaza el
  // precio simple + ITBIS por la tabla de tramos y oculta el banner de
  // "¿Compras para revender?" (ya no hace falta invitarlo a nada, ya
  // decidió que quiere mayoreo). Sin esto, la vista es la de siempre.
  showTiersAsMainPrice?: boolean
  // Conteo real de productos activos del vendedor y si ofrece envío
  // nacional (vendor_services) — para VendorInfoBar. 0/false por
  // defecto para ProductPreviewModal (vista previa sin vendor real
  // todavía consultado para esto).
  vendorProductCount?: number
  vendorShipsNationwide?: boolean
}

// Checklist de confianza — el primer ítem depende de un dato real del
// vendedor (is_verified); los otros 3 son garantías verdaderas de toda
// la plataforma (mismo tono que la barra de confianza del Navbar), no
// una promesa inventada sobre este producto en particular.
function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-gray-600">
      <Check size={15} className="flex-shrink-0" style={{ color: 'var(--color-green)' }} aria-hidden="true" />
      {children}
    </li>
  )
}

// Envío gratis — progreso real hacia el umbral (misma regla que
// create_order_from_cart, ver lib/shipping.ts), caja propia. Sin
// contexto de compra (ProductPreviewModal, fuera del Provider) no
// renderiza nada — no hay cantidad/variante real sobre la que calcular.
function FreeShippingProgressBox({ basePriceRdp, pricingTiers }: { basePriceRdp: number; pricingTiers: PricingTierLike[] }) {
  const { t } = useTranslation('products')
  const cartSubtotal = useCartSubtotal()
  const actions = useOptionalProductActionsContext()
  if (!actions) return null

  const unitPrice = resolveEffectiveUnitPriceRdp(basePriceRdp, pricingTiers, actions.quantity)
  const projectedSubtotal = cartSubtotal + unitPrice * actions.quantity
  const qualifies = qualifiesForFreeShipping(projectedSubtotal)

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-1">{t('freeShippingBoxHeading')}</h2>
      <p className="text-sm" style={{ color: qualifies ? 'var(--color-green)' : 'var(--color-text-secondary)' }}>
        {qualifies
          ? t('freeShippingQualifiedShort')
          : t('freeShippingRemainingShort', { amount: formatPrice(amountUntilFreeShippingRdp(projectedSubtotal)) })}
      </p>
    </div>
  )
}

// Entrega estimada — costo real por provincia (shipping_rates), nunca
// una ruta origen→destino ni un rango de días: ese dato no existe en
// el schema (mismo criterio que ShippingEstimateLine.tsx).
function DeliveryEstimateBox() {
  const { t } = useTranslation('products')
  const shippingRate = useShippingRateForCurrentProvince()
  const minRate = useMinShippingRate()
  const knownProvinceAmount = shippingRate ?? null
  const amount = knownProvinceAmount ?? (shippingRate === undefined ? minRate : null)
  if (amount == null) return null

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-1">{t('deliveryEstimateBoxHeading')}</h2>
      <p className="flex items-center gap-1.5 text-sm text-gray-600">
        <Truck size={15} className="flex-shrink-0" aria-hidden="true" />
        {knownProvinceAmount != null
          ? t('shippingToProvinceLabel', { amount: formatPrice(amount) })
          : t('shippingFromLabel', { amount: formatPrice(amount) })}
      </p>
    </div>
  )
}

export function ProductPageContent({
  product, vendor, variants, hasDiscount, discount, itbis, totalConItbis, specs = [],
  dynamicDimensions = [], variantDynamicValues = {}, parentCategory = null,
  reviewsSlot, reviewCount = 0, faqSlot = null, hasFaqContent = false,
  hasWholesaleOffering = false, pricingTiers = [], showTiersAsMainPrice = false,
  vendorProductCount = 0, vendorShipsNationwide = false,
}: Props) {
  const { t, language } = useTranslation('products')
  const { user } = useAuth()
  // Un vendedor no puede comprar su propio producto (create_order_from_cart
  // ya lo rechaza, migración 020) — acá se bloquea proactivamente en vez de
  // dejar que lo intente y falle recién en el checkout.
  const isOwnProduct = !!(user && vendor?.user_id && user.id === vendor.user_id)

  // Una sola vez acá arriba -- VendorInfoBar y VendorRatingOverview
  // ("Conoce a {vendedor}", más abajo) muestran la MISMA fila de
  // rating/respuesta a propósito; si cada uno llamara al hook por su
  // cuenta serían 6 llamadas RPC en vez de 3 para la misma info.
  const { rating: vendorRating, response: vendorResponse, showRating: showVendorRating, showResponse: showVendorResponse } =
    useVendorTrustStats(vendor?.id ?? '')

  const [displayName, setDisplayName] = useState(product.name)
  const [displayDescription, setDisplayDescription] = useState(product.description)

  useEffect(() => {
    if (language === 'es') {
      setDisplayName(product.name)
      setDisplayDescription(product.description)
      return
    }

    // Mientras llega la traducción (si no había caché) se muestra el
    // original — nunca un estado vacío.
    setDisplayName(product.name)
    setDisplayDescription(product.description)

    let cancelled = false
    fetch('/api/ai/translate-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id, target_language: language }),
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (cancelled || !data) return
        setDisplayName(data.name)
        setDisplayDescription(data.description)
      })
      .catch(() => {
        // Silencioso — se queda con el texto original en español
      })

    return () => {
      cancelled = true
    }
  }, [language, product.id, product.name, product.description])

  // ─── Pestañas — Descripción/Especificaciones/Envío ya no son pestañas
  // (ver bloque de 3 columnas siempre visibles más abajo); Reseñas sigue
  // siendo la única pestaña real por ahora (pendiente su propio restyle).
  const tabs: ProductTabDef[] = []

  tabs.push({
    key: 'reviews',
    label: reviewCount > 0 ? `${t('reviewsHeading')} (${reviewCount})` : t('reviewsHeading'),
    // Sin reviewsSlot real (ProductPreviewModal) cae al mismo estado
    // "Aún no hay reseñas" que vería un producto real recién publicado.
    content: reviewsSlot ?? <p className="text-sm text-gray-500 text-center py-6">{t('noReviewsYet')}</p>,
  })

  const breadcrumbCrumbs = [
    parentCategory ? categoryLabel(parentCategory, language) : null,
    product.category ? categoryLabel(product.category, language) : t('breadcrumbCurrentProduct'),
  ].filter((c): c is string => !!c)

  // Descripción / Especificaciones / Envío — cuántas de las 3 tienen
  // contenido real (Envío siempre lo tiene), para que la grilla no deje
  // una columna vacía cuando falta descripción o especificaciones.
  const infoColCount = (displayDescription ? 1 : 0) + (specs.length > 0 ? 1 : 0) + 1
  const infoGridColsClass = infoColCount === 3 ? 'md:grid-cols-3' : infoColCount === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'

  return (
    <>
      <AgeConfirmationModal requiresConfirmation={product.category?.requires_age_confirmation ?? false} />

      {/* Breadcrumb — mismo patrón que CategoryContent/HelpCenterContent */}
      <nav className="text-sm text-gray-400 mb-4">
        <a href="/" className="hover:text-gray-600 transition-colors no-underline">{t('breadcrumbHome')}</a>
        {breadcrumbCrumbs.map((crumb, i) => (
          <span key={i}>
            <span className="mx-2">/</span>
            {i === breadcrumbCrumbs.length - 1
              ? <span className="text-gray-600">{crumb}</span>
              : crumb}
          </span>
        ))}
      </nav>

      {/* Contenido principal — ficha comercial única en 3 zonas: galería
          (izquierda) · info + flujo de compra completo (centro) ·
          confianza/vendedor + invitación a volumen (derecha). Antes cada
          bloque era una tarjeta blanca propia flotando sobre el fondo
          gris de la página (se sentían independientes); ahora las 3
          zonas viven dentro de una sola superficie blanca, y los
          sub-bloques (precio, vendedor, confianza) son paneles internos,
          no tarjetas separadas.
          ProductActionsProvider envuelve las 3 columnas: ProductSelectors
          (talla/color/cantidad) y AddToCartButton comparten el mismo
          estado vía Context, ver el comentario en ProductActions.tsx. */}
      <ProductActionsProvider
        product={{
          ...product,
          sizes: (product as any).sizes ?? [],
          colors: (product as any).colors ?? [],
        } as unknown as Product}
        variants={variants ?? []}
        dynamicDimensions={dynamicDimensions}
        variantDynamicValues={variantDynamicValues}
      >
      <div
        className="bg-[var(--color-card-bg)] p-4 sm:p-5 lg:p-6"
        style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
      >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* Galería — imagen principal, miniaturas y video (ProductGallery)
            + compartir (ShareButton vive dentro de ese componente) +
            favoritos, todo junto en la misma zona */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <ProductGallery productId={product.id} images={product.images ?? []} name={displayName} videoUrl={product.video_url} />
          <GiftListButton productId={product.id} />
        </div>

        {/* Info del producto + acciones de compra — todo el recorrido de
            compra (precio → variantes → cantidad → agregar/preguntar)
            queda junto en una sola columna, en vez de partido entre esta
            columna y un buy-box aparte */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Envío gratis desde RD$2,500 — regla real, ver lib/shipping.ts */}
          <FreeShippingBadge />

          {/* Vendor */}
          <div className="flex items-center gap-2">
            <a
              href={`/tienda/${vendor?.id}`}
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--brand-blue)' }}
            >
              {vendor?.business_name}
            </a>
            {vendor?.is_verified && (
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: 'color-mix(in srgb, var(--brand-blue) 10%, transparent)',
                  color: 'var(--brand-blue)',
                }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {t('verifiedBadge')}
              </span>
            )}
            {product.province && (
              <span className="text-xs text-gray-400">
                📍 {product.province.name}
              </span>
            )}
          </div>

          {/* Nombre */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {displayName}
          </h1>

          {/* Rating */}
          {product.rating_count > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(product.rating_avg!) ? 'text-amber-400' : 'text-gray-200'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {product.rating_avg!.toFixed(1)} ({product.rating_count} {t('reviewsSuffix')})
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-400">{product.sold_count} {t('soldSuffix')}</span>
            </div>
          )}

          {/* Precio — panel interno (no tarjeta propia), vive dentro de
              la misma superficie que el resto de la ficha */}
          <div className="bg-gray-50 rounded-xl p-4">
            {showTiersAsMainPrice ? (
              // Llegó desde /proveedores (Productos) a un producto con
              // tramos reales -- ya decidió que quiere mayoreo, así que
              // la tabla de tramos ES el precio principal acá, sin
              // desglose de ITBIS de la unidad simple (no aplica al
              // mismo tiempo que un precio por volumen) ni banner
              // debajo (ver esa condición más abajo). Mismo formato que
              // ya usa ProductCard para esto, solo más grande.
              <div>
                <p className="text-sm font-semibold text-gray-500 mb-2">{t('pricingTiersTitle')}</p>
                <div className="space-y-2">
                  {pricingTiers.map(tier => (
                    <div key={tier.id} className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-gray-600">
                        {tier.max_quantity !== null
                          ? t('pricingTiersRangeBetween', { min: tier.min_quantity, max: tier.max_quantity, unit: tier.unit_label })
                          : t('pricingTiersRangeAndUp', { min: tier.min_quantity, unit: tier.unit_label })}
                      </span>
                      <span
                        className="text-xl font-bold"
                        style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', letterSpacing: 'var(--tracking-heading)' }}
                      >
                        {formatPrice(tier.price_rdp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', letterSpacing: 'var(--tracking-heading)' }}
                  >
                    {formatPrice(product.price_rdp)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        {formatPrice(product.compare_rdp!)}
                      </span>
                      <span
                        className="text-sm font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: 'var(--brand-red)' }}
                      >
                        -{discount}%
                      </span>
                    </>
                  )}
                </div>

                {/* ITBIS */}
                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                  <span>{t('itbisIncluded', { amount: formatPrice(itbis) })}</span>
                  <span className="font-medium text-gray-500">
                    {t('totalLabel', { amount: formatPrice(totalConItbis) })}
                  </span>
                </div>
              </>
            )}

            {/* Stock */}
            <div className="mt-3">
              {product.stock === 0 ? (
                <span className="text-sm font-medium text-red-500">{t('noStock')}</span>
              ) : product.stock <= 5 ? (
                <span className="text-sm font-medium text-orange-500">
                  {t('lowStockWarning', { count: product.stock })}
                </span>
              ) : (
                <span className="text-sm text-gray-400">{t('inStockAvailable', { count: product.stock })}</span>
              )}
            </div>
          </div>

          {/* Talla / color / dimensiones dinámicas / cantidad */}
          <ProductSelectors />
        </div>

        {/* Confianza (3 cajas separadas) + acciones de compra + invitación
            a volumen — los botones de acción y la identidad del vendedor
            (antes acá, en una mini-tarjeta angosta) se movieron: los
            botones bajan debajo de las 3 cajas, el vendedor ahora tiene su
            propia barra a ancho completo (VendorInfoBar) entre este grid y
            las pestañas. */}
        <div className="lg:col-span-3 flex flex-col gap-4 lg:sticky lg:top-4">

          <FreeShippingProgressBox basePriceRdp={product.price_rdp} pricingTiers={pricingTiers} />
          <DeliveryEstimateBox />

          <div className="bg-gray-50 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('securePurchaseBoxHeading')}</h2>
            <ul className="flex flex-col gap-1.5">
              {vendor?.is_verified && <TrustItem>{t('trustVerifiedVendor')}</TrustItem>}
              <TrustItem>{t('trustSecurePayment')}</TrustItem>
              <TrustItem>{t('trustOrderTracking')}</TrustItem>
              <TrustItem>{t('trustPlatformSupport')}</TrustItem>
            </ul>
          </div>

          {/* Agregar al carrito (amarillo, acción principal) / Comprar
              ahora (azul) / Preguntar al vendedor — debajo de las cajas de
              envío/confianza, no en la columna de info del producto.
              Si el usuario logueado es dueño de este producto, no tiene
              sentido ninguna de las 3 (comprar su propio producto ya lo
              rechaza el backend, y "preguntar al vendedor" sería
              escribirse a sí mismo) — se reemplazan por un aviso. */}
          {isOwnProduct ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              {t('ownProductNotice')}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <AddToCartButton />
              <BuyNowButton />
              {vendor?.id && (
                <ContactVendorButton vendorId={vendor.id} productId={product.id} productName={product.name} />
              )}
            </div>
          )}

          {/* Invitación a precios por volumen — reemplaza la tabla de
              product_pricing_tiers en esta vista normal (a pedido
              explícito). El único mecanismo real hoy para negociar un
              precio por cantidad es el chat con el vendedor. Solo se
              muestra si el vendor realmente ofrece algo mayorista (ya
              tiene tramos configurados, o su perfil es
              wholesaler/distributor/manufacturer) — de lo contrario
              sería una invitación a algo que no existe. Tampoco se
              muestra si ya se está mostrando la tabla de tramos como
              precio principal (showTiersAsMainPrice) — no hace falta
              invitarlo a algo que ya tiene enfrente. */}
          {vendor && hasWholesaleOffering && !showTiersAsMainPrice && (
            <VolumePricingBanner
              vendorId={vendor.id}
              productId={product.id}
              productName={product.name}
              vendorName={vendor.business_name}
            />
          )}
        </div>
      </div>
      </div>
      </ProductActionsProvider>

      {/* Barra de vendedor a ancho completo — reemplaza la mini-tarjeta
          angosta que antes vivía en la columna de confianza. */}
      {vendor && (
        <VendorInfoBar
          vendorId={vendor.id}
          businessName={vendor.business_name}
          logoUrl={vendor.logo_url}
          isVerified={vendor.is_verified}
          productCount={vendorProductCount}
          shipsNationwide={vendorShipsNationwide}
          rating={vendorRating}
          response={vendorResponse}
          showRating={showVendorRating}
          showResponse={showVendorResponse}
        />
      )}

      {/* Descripción / Especificaciones / Envío y entrega — las 3 siempre
          visibles lado a lado, ya no son pestañas clicables. Cada una
          solo ocupa un lugar si hay contenido real detrás (igual que
          antes, cuando eran pestañas). */}
      <div
        className="bg-[var(--color-card-bg)] mt-6 p-5 sm:p-6"
        style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className={`grid grid-cols-1 gap-6 ${infoGridColsClass}`}>
          {displayDescription && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('descriptionHeading')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{displayDescription}</p>
            </div>
          )}
          {specs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('specsHeading')}</h2>
              <dl className="text-sm">
                {specs.map((spec, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0">
                    <dt className="text-gray-400">{spec.label}</dt>
                    <dd className="text-gray-700 font-medium text-right">
                      {spec.type === 'boolean' ? (spec.boolValue ? t('specYes') : t('specNo')) : spec.displayValue}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('tabShipping')}</h2>
            <div className="flex flex-col gap-3">
              <ShippingEstimateLine />
              <p className="text-sm text-gray-600">{t('shippingCoverageLine')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reseñas — única pestaña real por ahora (pendiente su propio
          restyle, ver G del diagnóstico de layout). */}
      <ProductTabs tabs={tabs} />

      {/* "Conoce a {vendedor}" — justo después de Opiniones de compradores
          (pestaña Reseñas de arriba) y antes de Productos de este vendedor
          (VendorProductsCarousel, vive en page.tsx como hermano de este
          componente). Repite a propósito los mismos datos de VendorInfoBar,
          como refuerzo antes del carrusel. */}
      {vendor && (
        <VendorRatingOverview
          vendorId={vendor.id}
          businessName={vendor.business_name}
          productCount={vendorProductCount}
          shipsNationwide={vendorShipsNationwide}
          rating={vendorRating}
          response={vendorResponse}
          showRating={showVendorRating}
          showResponse={showVendorResponse}
        />
      )}

      {/* FAQ del vendedor (tipo de negocio + vendor_faqs) — sección propia,
          no un tab llamado "Preguntas" (eso sugeriría Q&A de compradores,
          que no existe). Mismo contenido de siempre, solo reubicado. */}
      {hasFaqContent && faqSlot}
    </>
  )
}
