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

import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, discountPercent, type ProductWithVendor } from '@/types/database.types'

interface Props {
  product: ProductWithVendor
}

export function ProductCard({ product }: Props) {
  const image = product.images?.[0] ?? '/placeholder-product.png'
  const hasDiscount = product.compare_rdp && product.compare_rdp > product.price_rdp
  const discount = hasDiscount
    ? discountPercent(product.price_rdp, product.compare_rdp!)
    : null

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <Link href={`/producto/${product.id}`} className="block">
        {/* Imagen */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {discount && (
            <span
              className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--brand-red)' }}
            >
              -{discount}%
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
              Quedan {product.stock}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3 pb-0">
          {/* Vendor */}
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-gray-400 truncate">{product.vendor?.business_name}</span>
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
          <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 leading-snug">
            {product.name}
          </p>

          {/* Precio */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900">
              {formatPrice(product.price_rdp)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.compare_rdp!)}
              </span>
            )}
          </div>

          {/* Rating */}
          {product.rating_count > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg
                    key={star}
                    className={`w-3 h-3 ${star <= Math.round(product.rating_avg) ? 'text-amber-400' : 'text-gray-200'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-400">({product.rating_count})</span>
            </div>
          )}
        </div>
      </Link>

      {/* WhatsApp CTA — fuera del Link, como hermano, para evitar <a> dentro de <a> */}
      {product.vendor?.whatsapp && (
        <div className="px-3 pb-3">
          <a
            href={`https://wa.me/${product.vendor.whatsapp}?text=Hola, me interesa: ${encodeURIComponent(product.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 w-full border border-green-500 text-green-600 text-xs font-medium py-1.5 rounded-lg hover:bg-green-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Preguntar
          </a>
        </div>
      )}
    </div>
  )
}
