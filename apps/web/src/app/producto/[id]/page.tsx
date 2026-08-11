// ============================================================
// MercadoRD — Página de detalle de producto
// Ruta: src/app/producto/[id]/page.tsx
// ============================================================

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getProductByIdPublic } from '@/lib/supabase/products'
import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'
import { ProductViewTracker } from '@/components/product/ProductViewTracker'
import { RelatedProducts } from '@/components/shop/RelatedProducts'
import { ProductPageContent } from './ProductPageContent'
import { discountPercent, formatPrice } from '@/types/database.types'
import type { Product } from '@/types'
import type { ProductSpecItem, VariantDynamicDimension, VariantDynamicValuesMap } from './ProductPageContent'

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

  // Especificaciones (atributos fijos, no de variante) — si la categoría
  // no tiene category_attributes o el producto no tiene valores guardados,
  // specs queda vacío y la sección de Especificaciones simplemente no se
  // renderiza (cero cambio visual para el catálogo existente).
  const { data: attrValueRows } = await supabase
    .from('product_attribute_values')
    .select('category_attribute_id, value_text, value_number, value_boolean')
    .eq('product_id', product.id)

  let specs: ProductSpecItem[] = []
  if (attrValueRows && attrValueRows.length > 0) {
    const attrIds = attrValueRows.map(v => v.category_attribute_id)
    const { data: catAttrs } = await supabase
      .from('category_attributes')
      .select('id, attribute_label, attribute_type, unit, sort_order')
      .in('id', attrIds)

    const selectLikeIds = (catAttrs ?? [])
      .filter(a => a.attribute_type === 'select' || a.attribute_type === 'multiselect')
      .map(a => a.id)

    const optionsMap = new Map<string, { value: string; label: string }[]>()
    if (selectLikeIds.length > 0) {
      const { data: options } = await supabase
        .from('attribute_options')
        .select('category_attribute_id, value, label')
        .in('category_attribute_id', selectLikeIds)
      for (const opt of options ?? []) {
        const list = optionsMap.get(opt.category_attribute_id) ?? []
        list.push(opt)
        optionsMap.set(opt.category_attribute_id, list)
      }
    }

    const attrsById = new Map((catAttrs ?? []).map(a => [a.id, a]))

    specs = attrValueRows
      .map((v): ProductSpecItem | null => {
        const attr = attrsById.get(v.category_attribute_id)
        if (!attr) return null

        if (attr.attribute_type === 'boolean') {
          if (v.value_boolean === null) return null
          return { label: attr.attribute_label, type: 'boolean', displayValue: '', boolValue: v.value_boolean, sortOrder: attr.sort_order }
        }

        if (attr.attribute_type === 'number') {
          if (v.value_number === null) return null
          const displayValue = attr.unit === '%' ? `${v.value_number}%` : attr.unit ? `${v.value_number} ${attr.unit}` : String(v.value_number)
          return { label: attr.attribute_label, type: 'number', displayValue, boolValue: null, sortOrder: attr.sort_order }
        }

        if (attr.attribute_type === 'select') {
          if (!v.value_text) return null
          const opt = (optionsMap.get(attr.id) ?? []).find(o => o.value === v.value_text)
          return { label: attr.attribute_label, type: 'select', displayValue: opt?.label ?? v.value_text, boolValue: null, sortOrder: attr.sort_order }
        }

        if (attr.attribute_type === 'multiselect') {
          if (!v.value_text) return null
          const codes = v.value_text.split(',').filter(Boolean)
          const opts = optionsMap.get(attr.id) ?? []
          const displayValue = codes.map((c: string) => opts.find(o => o.value === c)?.label ?? c).join(', ')
          return { label: attr.attribute_label, type: 'multiselect', displayValue, boolValue: null, sortOrder: attr.sort_order }
        }

        if (!v.value_text) return null
        return { label: attr.attribute_label, type: 'text', displayValue: v.value_text, boolValue: null, sortOrder: attr.sort_order }
      })
      .filter((s): s is ProductSpecItem => !!s)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  // Dimensiones dinámicas de variante (ej. Capacidad + Color en Smartphones)
  // — si el producto usa el sistema viejo de sizes/colors planos, o no tiene
  // variant_attribute_values, dynamicDimensions queda vacío y ProductActions
  // se comporta exactamente igual que hoy (Talla/Color fijos).
  let dynamicDimensions: VariantDynamicDimension[] = []
  let variantDynamicValues: VariantDynamicValuesMap = {}
  if (variants && variants.length > 0) {
    const variantIds = variants.map(v => v.id)
    const { data: vav } = await supabase
      .from('variant_attribute_values')
      .select('variant_id, category_attribute_id, value_text')
      .in('variant_id', variantIds)

    if (vav && vav.length > 0) {
      const dimAttrIds = [...new Set(vav.map(v => v.category_attribute_id))]
      const { data: dimCatAttrs } = await supabase
        .from('category_attributes')
        .select('id, attribute_key, attribute_label, sort_order')
        .in('id', dimAttrIds)

      const { data: dimOptions } = await supabase
        .from('attribute_options')
        .select('category_attribute_id, value, label, sort_order')
        .in('category_attribute_id', dimAttrIds)
        .order('sort_order')

      const dimOptionsByAttr = new Map<string, { value: string; label: string }[]>()
      for (const opt of dimOptions ?? []) {
        const list = dimOptionsByAttr.get(opt.category_attribute_id) ?? []
        list.push({ value: opt.value, label: opt.label })
        dimOptionsByAttr.set(opt.category_attribute_id, list)
      }

      dynamicDimensions = (dimCatAttrs ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(attr => ({
          attributeId: attr.id,
          key: attr.attribute_key,
          label: attr.attribute_label,
          options: dimOptionsByAttr.get(attr.id) ?? [],
        }))

      for (const row of vav) {
        const bucket = variantDynamicValues[row.variant_id] ?? {}
        if (row.value_text) bucket[row.category_attribute_id] = row.value_text
        variantDynamicValues[row.variant_id] = bucket
      }
    }
  }

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
      <Navbar />
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
          specs={specs}
          dynamicDimensions={dynamicDimensions}
          variantDynamicValues={variantDynamicValues}
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
