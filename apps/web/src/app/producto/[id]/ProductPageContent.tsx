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
import { Check } from 'lucide-react'
import { ProductGallery } from '@/components/product/ProductGallery'
import { AgeConfirmationModal } from '@/components/shop/AgeConfirmationModal'
import { ProductActionsProvider, ProductSelectors, AddToCartButton } from '@/components/product/ProductActions'
import { FreeShippingBadge } from '@/components/product/FreeShippingBadge'
import { ProductTabs, type ProductTabDef } from '@/components/product/ProductTabs'
import { ShippingEstimateLine } from '@/components/product/ShippingEstimateLine'
import { VolumePricingBanner } from '@/components/product/VolumePricingBanner'
import { ContactVendorButton } from '@/components/product/ContactVendorButton'
import { GiftListButton } from '@/components/product/GiftListButton'
import { VendorTrustBar } from '@/components/shop/VendorTrustBar'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPrice } from '@/types/database.types'
import { formatDate } from '@/lib/utils'
import type { Language } from '@/lib/store/language'
import type { ProductVariant } from '@/types/database.types'
import type { Product } from '@/types'

interface VendorInfo {
  id: string
  business_name: string
  is_verified: boolean
  whatsapp?: string
  rating_avg?: number
  total_sales?: number
  logo_url?: string | null
  created_at?: string
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

// El tipo y sus campos se mantienen (page.tsx sigue trayendo estas
// filas) aunque esta vista ya no los renderice — ver el comentario en
// page.tsx junto al fetch de product_pricing_tiers.
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

export function ProductPageContent({
  product, vendor, variants, hasDiscount, discount, itbis, totalConItbis, specs = [],
  dynamicDimensions = [], variantDynamicValues = {}, parentCategory = null,
  reviewsSlot, reviewCount = 0, faqSlot = null, hasFaqContent = false,
}: Props) {
  const { t, language } = useTranslation('products')

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

  // ─── Pestañas — solo se incluye un tab si hay contenido real detrás ───
  const tabs: ProductTabDef[] = []

  if (displayDescription) {
    tabs.push({
      key: 'description',
      label: t('descriptionHeading'),
      content: (
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{displayDescription}</p>
      ),
    })
  }

  if (specs.length > 0) {
    tabs.push({
      key: 'specs',
      label: t('specsHeading'),
      content: (
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
      ),
    })
  }

  tabs.push({
    key: 'shipping',
    label: t('tabShipping'),
    content: (
      <div className="flex flex-col gap-3">
        <ShippingEstimateLine />
        <p className="text-sm text-gray-600">{t('shippingCoverageLine')}</p>
      </div>
    ),
  })

  tabs.push({
    key: 'reviews',
    label: reviewCount > 0 ? `${t('reviewsHeading')} (${reviewCount})` : t('reviewsHeading'),
    // Sin reviewsSlot real (ProductPreviewModal) cae al mismo estado
    // "Aún no hay reseñas" que vería un producto real recién publicado.
    content: reviewsSlot ?? <p className="text-sm text-gray-500 text-center py-6">{t('noReviewsYet')}</p>,
  })

  if (hasFaqContent && faqSlot) {
    tabs.push({ key: 'faq', label: t('tabFaqLabel'), content: faqSlot })
  }

  const breadcrumbCrumbs = [
    parentCategory ? categoryLabel(parentCategory, language) : null,
    product.category ? categoryLabel(product.category, language) : t('breadcrumbCurrentProduct'),
  ].filter((c): c is string => !!c)

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

      {/* Contenido principal — 3 columnas en escritorio: galería+vendedor · info · buy-box.
          ProductActionsProvider envuelve las dos columnas de la derecha:
          ProductSelectors (talla/color/cantidad) vive en la columna de
          info, AddToCartButton vive en el buy-box — mismo estado
          compartido vía Context, ver el comentario en ProductActions.tsx. */}
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* Galería + info del vendedor */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <ProductGallery productId={product.id} images={product.images ?? []} name={displayName} videoUrl={product.video_url} />

          {vendor && (
            <div
              className="bg-[var(--color-card-bg)] p-4"
              style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
            >
              <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('vendorHeading')}</h2>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex items-center justify-center flex-shrink-0 overflow-hidden font-bold text-gray-400"
                    style={{ width: 40, height: 40, borderRadius: 'var(--radius-control)', background: 'var(--color-primary-subtle)' }}
                  >
                    {vendor.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
                    ) : (
                      vendor.business_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{vendor.business_name}</p>
                    {vendor.rating_avg && vendor.rating_avg > 0 ? (
                      <p className="text-xs text-gray-400 mt-0.5">
                        ⭐ {Number(vendor.rating_avg).toFixed(1)} · {vendor.total_sales ?? 0} {t('salesSuffix')}
                      </p>
                    ) : vendor.created_at ? (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t('vendorMemberSince', { date: formatDate(vendor.created_at, language, { month: 'long', year: 'numeric' }) })}
                      </p>
                    ) : null}
                  </div>
                </div>
                <a
                  href={`/tienda/${vendor.id}`}
                  className="text-xs font-medium hover:underline flex-shrink-0"
                  style={{ color: 'var(--brand-blue)' }}
                >
                  {t('viewStore')}
                </a>
              </div>
            </div>
          )}

          {/* Confianza del vendedor — estilo grid de estadísticas */}
          {vendor && <VendorTrustBar vendorId={vendor.id} />}
        </div>

        {/* Info del producto */}
        <div className="lg:col-span-4 flex flex-col gap-5">

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

          {/* Precio */}
          <div
            className="bg-[var(--color-card-bg)] p-4"
            style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
          >
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

          {/* Invitación a precios por volumen — reemplaza la tabla de
              product_pricing_tiers en esta vista normal (a pedido
              explícito). El único mecanismo real hoy para negociar un
              precio por cantidad es el chat con el vendedor. */}
          {vendor && (
            <VolumePricingBanner
              vendorId={vendor.id}
              productId={product.id}
              productName={product.name}
              vendorName={vendor.business_name}
            />
          )}

          {/* Talla / color / dimensiones dinámicas / cantidad — el botón
              de agregar vive en el buy-box, mismo estado compartido */}
          <ProductSelectors />
        </div>

        {/* Buy-box — acciones de compra, siempre a la vista */}
        <div className="lg:col-span-3">
          <div
            className="bg-[var(--color-card-bg)] p-4 flex flex-col gap-4 lg:sticky lg:top-4"
            style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <ShippingEstimateLine />

            <ul className="flex flex-col gap-1.5">
              {vendor?.is_verified && <TrustItem>{t('trustVerifiedVendor')}</TrustItem>}
              <TrustItem>{t('trustSecurePayment')}</TrustItem>
              <TrustItem>{t('trustOrderTracking')}</TrustItem>
              <TrustItem>{t('trustPlatformSupport')}</TrustItem>
            </ul>

            {/* Agregar al carrito — usa la talla/color/cantidad elegidos en ProductSelectors */}
            <AddToCartButton />

            {/* Chat interno */}
            {vendor?.id && (
              <ContactVendorButton vendorId={vendor.id} productId={product.id} productName={product.name} />
            )}

            {/* Lista de regalos */}
            <GiftListButton productId={product.id} />
          </div>
        </div>
      </div>
      </ProductActionsProvider>

      {/* Descripción / Especificaciones / Envío y entrega / Reseñas / Preguntas */}
      <ProductTabs tabs={tabs} />
    </>
  )
}
