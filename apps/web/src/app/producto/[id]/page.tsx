// ============================================================
// MercadoRD — Página de detalle de producto
// Ruta: src/app/producto/[id]/page.tsx
// ============================================================

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getProductByIdPublic } from '@/lib/supabase/products'
import { createPublicClient } from '@/lib/supabase/public'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductActions } from '@/components/product/ProductActions'
import { ContactVendorButton } from '@/components/product/ContactVendorButton'
import { ProductViewTracker } from '@/components/product/ProductViewTracker'
import { RelatedProducts } from '@/components/shop/RelatedProducts'
import { formatPrice, discountPercent } from '@/types/database.types'
import type { Product } from '@/types'

export const revalidate = 600

// Sin paths pre-construidos (el catálogo es muy grande para el build) —
// cada producto se renderiza on-demand en su primera visita y queda
// cacheado por `revalidate` a partir de ahí.
export async function generateStaticParams() {
  return []
}

// ─── Metadata dinámica para SEO ───────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const product = await getProductByIdPublic(id)
  if (!product) return { title: 'Producto no encontrado — MercadoRD' }

  const title = `${product.name} — MercadoRD`
  const description = product.description ?? `Compra ${product.name} en MercadoRD`
  const image = product.images?.[0]

  return {
    title,
    description,
    alternates: { canonical: `/producto/${id}` },
    openGraph: {
      type: 'website',
      siteName: 'MercadoRD',
      locale: 'es_DO',
      url: `/producto/${id}`,
      title: product.name,
      description,
      images: image ? [{ url: image, width: 1200, height: 1200, alt: product.name }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  }
}

// ─── Página principal ──────────────────────────────────────────
export default async function ProductPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const product = await getProductByIdPublic(id)
  if (!product) notFound()

  // Variantes activas del producto — si no hay, ProductActions se
  // comporta exactamente igual que con product.sizes/colors planos
  const supabase = createPublicClient()
  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_active', true)

  const vendor = product.vendor as Product['vendor'] & {
    business_name: string
    is_verified: boolean
    whatsapp?: string
    rating_avg?: number
    total_sales?: number
  }

  const hasDiscount = product.compare_rdp && product.compare_rdp > product.price_rdp
  const discount = hasDiscount
    ? discountPercent(product.price_rdp, product.compare_rdp!)
    : null

  const itbis = Math.round(product.price_rdp * 0.18)
  const totalConItbis = product.price_rdp + itbis

  const whatsappMsg = encodeURIComponent(
    `Hola, me interesa este producto en MercadoRD:\n*${product.name}*\nPrecio: ${formatPrice(product.price_rdp)}\n¿Está disponible?`
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <ProductViewTracker productId={product.id} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <a href="/" className="hover:text-gray-600 transition-colors">Inicio</a>
          <span>/</span>
          {product.category && (
            <>
              <a
                href={`/categoria/${(product.category as { slug: string }).slug}`}
                className="hover:text-gray-600 transition-colors"
              >
                {(product.category as { emoji: string; name: string }).emoji}{' '}
                {(product.category as { name: string }).name}
              </a>
              <span>/</span>
            </>
          )}
          <span className="text-gray-600 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Galería — Client Component */}
          <ProductGallery images={product.images ?? []} name={product.name} />

          {/* Info del producto */}
          <div className="flex flex-col gap-5">

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
                  Verificado
                </span>
              )}
              {product.province && (
                <span className="text-xs text-gray-400">
                  📍 {(product.province as { name: string }).name}
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
                  {product.rating_avg.toFixed(1)} ({product.rating_count} reseñas)
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-gray-400">{product.sold_count} vendidos</span>
              </div>
            )}

            {/* Precio */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-bold text-gray-900">
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
                <span>ITBIS incluido (18%): {formatPrice(itbis)}</span>
                <span className="font-medium text-gray-500">
                  Total: {formatPrice(totalConItbis)}
                </span>
              </div>

              {/* Stock */}
              <div className="mt-3">
                {product.stock === 0 ? (
                  <span className="text-sm font-medium text-red-500">Sin stock</span>
                ) : product.stock <= 5 ? (
                  <span className="text-sm font-medium text-orange-500">
                    ⚡ Solo quedan {product.stock} unidades
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">✓ En stock ({product.stock} disponibles)</span>
                )}
              </div>
            </div>

            {/* Selector de talla/color + carrito — Client Component */}
            <ProductActions
              product={{
                ...product,
                sizes: (product as any).sizes ?? [],
                colors: (product as any).colors ?? [],
              } as unknown as Product}
              variants={variants ?? []}
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
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-green-500 text-green-600 font-medium hover:bg-green-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Preguntar por WhatsApp
              </a>
            )}

            {/* Descripción */}
            {product.description && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Descripción</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Info del vendor */}
            {vendor && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Vendedor</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{vendor.business_name}</p>
                    {vendor.rating_avg && vendor.rating_avg > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        ⭐ {Number(vendor.rating_avg).toFixed(1)} · {vendor.total_sales ?? 0} ventas
                      </p>
                    )}
                  </div>
                  <a
                    href={`/tienda/${vendor.id}`}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--brand-blue)' }}
                  >
                    Ver tienda →
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* También te puede interesar */}
        <RelatedProducts
          categoryId={product.category_id}
          vendorId={product.vendor_id}
          currentProductId={product.id}
        />

      </div>
    </main>
  )
}
