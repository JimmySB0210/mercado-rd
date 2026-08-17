'use client'
// ============================================================
// MercadoRD — ProductCard
// Ruta: src/components/product/ProductCard.tsx
// ============================================================
// Fix: el botón de WhatsApp (un <a>) estaba anidado dentro del
// <Link> principal (que también renderiza un <a>), lo cual es
// HTML inválido (<a> dentro de <a>) y causaba un error de
// hidratación. Ahora el WhatsApp CTA vive como hermano del
// Link, fuera de él, envueltos ambos en un <div> contenedor.
// ============================================================

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, discountPercent, type ProductWithVendor } from '@/types/database.types'
import { WishlistButton } from '@/components/shop/WishlistButton'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/utils'

interface Props {
  product: ProductWithVendor
}

export function ProductCard({ product }: Props) {
  const { t } = useTranslation('products')
  const [imgSrc, setImgSrc] = useState(product.images?.[0] ?? PLACEHOLDER_PRODUCT_IMAGE)
  const hasDiscount = product.compare_rdp && product.compare_rdp > product.price_rdp
  const discount = hasDiscount
    ? discountPercent(product.price_rdp, product.compare_rdp!)
    : null

  return (
    <div
      className="relative group overflow-hidden bg-[var(--color-card-bg)] [box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)] hover:-translate-y-0.5"
      style={{ borderRadius: 'var(--radius-card)', transition: 'box-shadow var(--transition-base), transform var(--transition-base)' }}
    >
      {/* Hermano del Link, no anidado dentro — mismo motivo que el CTA de WhatsApp */}
      <WishlistButton productId={product.id} />

      <Link href={`/producto/${product.id}`} className="block">
        {/* Imagen */}
        <div
          className="relative aspect-square overflow-hidden bg-gray-50"
          style={{ borderRadius: 'var(--radius-product-image) var(--radius-product-image) 0 0' }}
        >
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgSrc(PLACEHOLDER_PRODUCT_IMAGE)}
          />
          {(discount || (product.stock <= 5 && product.stock > 0)) && (
            <span
              className="absolute top-2 left-2 text-white text-xs font-bold px-2.5 py-1"
              style={{ background: 'var(--color-badge-orange)', borderRadius: 'var(--radius-pill)' }}
            >
              {discount ? `-${discount}%` : t('stockLeftBadge', { count: product.stock })}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3 pb-0">
          {/* Vendor */}
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{product.vendor?.business_name}</span>
            {product.vendor?.is_verified && (
              <svg
                className="w-3 h-3 flex-shrink-0"
                style={{ color: 'var(--brand-blue)' }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Nombre */}
          <p
            className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 leading-snug"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {product.name}
          </p>

          {/* Rating — siempre visible */}
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            ⭐ {product.rating_avg.toFixed(1)} ({product.rating_count})
          </p>

          {/* Precio */}
          <div className="flex items-baseline gap-2">
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', letterSpacing: 'var(--tracking-heading)' }}
            >
              {formatPrice(product.price_rdp)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.compare_rdp!)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Ver tienda + WhatsApp CTA — fuera del Link, como hermanos, para evitar <a> dentro de <a> */}
      <div className="px-3 pb-3">
        {product.vendor?.id && (
          <Link
            href={`/tienda/${product.vendor.id}`}
            className="block text-xs font-medium mb-2 hover:underline"
            style={{ color: 'var(--brand-blue)' }}
          >
            {t('viewStore')}
          </Link>
        )}
        {product.vendor?.whatsapp && (
          <a
            href={`https://wa.me/${product.vendor.whatsapp}?text=Hola, me interesa: ${encodeURIComponent(product.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 w-full border border-green-500 text-green-600 text-xs font-medium py-1.5 rounded-lg hover:bg-green-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {t('askWhatsappShort')}
          </a>
        )}
      </div>
    </div>
  )
}
