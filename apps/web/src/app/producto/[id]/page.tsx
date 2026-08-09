// ============================================================
// MercadoRD — Página de detalle de producto
// Ruta: src/app/producto/[id]/page.tsx
// ============================================================

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getProductByIdPublic } from '@/lib/supabase/products'
import { createPublicClient } from '@/lib/supabase/public'
import { ProductViewTracker } from '@/components/product/ProductViewTracker'
import { RelatedProducts } from '@/components/shop/RelatedProducts'
import { ProductPageContent } from './ProductPageContent'
import { discountPercent, formatPrice } from '@/types/database.types'
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

        <ProductPageContent
          product={product as any}
          vendor={vendor}
          variants={variants ?? []}
          hasDiscount={!!hasDiscount}
          discount={discount}
          itbis={itbis}
          totalConItbis={totalConItbis}
          whatsappMsg={whatsappMsg}
        />

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
