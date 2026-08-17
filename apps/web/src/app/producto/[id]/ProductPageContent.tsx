'use client'
// ============================================================
// MercadoRD — Contenido traducido de /producto/[id]
// Ruta: src/app/producto/[id]/ProductPageContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase) y no
// puede usar useTranslation. Este componente recibe el producto ya
// resuelto (+ valores derivados) como props y renderiza breadcrumb +
// columna de info completa, con todo el texto traducido.
// ============================================================

import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductActions } from '@/components/product/ProductActions'
import { FreeShippingBadge } from '@/components/product/FreeShippingBadge'
import { ContactVendorButton } from '@/components/product/ContactVendorButton'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPrice } from '@/types/database.types'
import type { ProductVariant } from '@/types/database.types'
import type { Product } from '@/types'

interface VendorInfo {
  id: string
  business_name: string
  is_verified: boolean
  whatsapp?: string
  rating_avg?: number
  total_sales?: number
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

interface Props {
  product: Product & {
    category: { slug: string; emoji: string; name: string } | null
    province: { name: string } | null
  }
  vendor: VendorInfo | undefined
  variants: ProductVariant[]
  hasDiscount: boolean
  discount: number | null
  itbis: number
  totalConItbis: number
  whatsappMsg: string
  specs?: ProductSpecItem[]
  dynamicDimensions?: VariantDynamicDimension[]
  variantDynamicValues?: VariantDynamicValuesMap
}

export function ProductPageContent({
  product, vendor, variants, hasDiscount, discount, itbis, totalConItbis, whatsappMsg, specs = [],
  dynamicDimensions = [], variantDynamicValues = {},
}: Props) {
  const { t } = useTranslation('products')

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <a href="/" className="hover:text-gray-600 transition-colors">{t('breadcrumbHome')}</a>
        <span>/</span>
        {product.category && (
          <>
            <a
              href={`/categoria/${product.category.slug}`}
              className="hover:text-gray-600 transition-colors"
            >
              {product.category.emoji}{' '}
              {product.category.name}
            </a>
            <span>/</span>
          </>
        )}
        <span className="text-gray-600 truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

        {/* Galería */}
        <ProductGallery images={product.images ?? []} name={product.name} />

        {/* Info del producto */}
        <div className="flex flex-col gap-5">

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
            {product.name}
          </h1>

          {/* Rating */}
          {product.rating_count > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(product.rating_avg) ? 'text-amber-400' : 'text-gray-200'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {product.rating_avg.toFixed(1)} ({product.rating_count} {t('reviewsSuffix')})
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

          {/* Selector de talla/color + carrito */}
          <ProductActions
            product={{
              ...product,
              sizes: (product as any).sizes ?? [],
              colors: (product as any).colors ?? [],
            } as unknown as Product}
            variants={variants ?? []}
            dynamicDimensions={dynamicDimensions}
            variantDynamicValues={variantDynamicValues}
          />

          {/* Chat interno */}
          {vendor?.id && (
            <ContactVendorButton vendorId={vendor.id} productId={product.id} productName={product.name} />
          )}

          {/* WhatsApp */}
          {vendor?.whatsapp && (
            <a
              href={`https://wa.me/${vendor.whatsapp}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 font-medium hover:bg-[var(--color-success-subtle)]"
              style={{
                borderRadius: 'var(--radius-control)',
                border: '2px solid var(--color-success)',
                color: 'var(--color-success)',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('askWhatsapp')}
            </a>
          )}

          {/* Descripción */}
          {product.description && (
            <div
              className="bg-[var(--color-card-bg)] p-4"
              style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
            >
              <h2 className="text-sm font-semibold text-gray-700 mb-2">{t('descriptionHeading')}</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Especificaciones */}
          {specs.length > 0 && (
            <div
              className="bg-[var(--color-card-bg)] p-4"
              style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
            >
              <h2 className="text-sm font-semibold text-gray-700 mb-2">{t('specsHeading')}</h2>
              <dl className="text-sm">
                {specs.map((spec, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 py-1.5 border-b border-gray-50 last:border-0"
                  >
                    <dt className="text-gray-400">{spec.label}</dt>
                    <dd className="text-gray-700 font-medium text-right">
                      {spec.type === 'boolean' ? (spec.boolValue ? t('specYes') : t('specNo')) : spec.displayValue}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Info del vendor */}
          {vendor && (
            <div
              className="bg-[var(--color-card-bg)] p-4"
              style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
            >
              <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('vendorHeading')}</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{vendor.business_name}</p>
                  {vendor.rating_avg && vendor.rating_avg > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      ⭐ {Number(vendor.rating_avg).toFixed(1)} · {vendor.total_sales ?? 0} {t('salesSuffix')}
                    </p>
                  )}
                </div>
                <a
                  href={`/tienda/${vendor.id}`}
                  className="text-xs font-medium hover:underline"
                  style={{ color: 'var(--brand-blue)' }}
                >
                  {t('viewStore')}
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
