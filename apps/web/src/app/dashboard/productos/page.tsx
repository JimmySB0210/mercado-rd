// ============================================================
// MercadoRD — Mis Productos (vendor dashboard)
// Ruta: src/app/dashboard/productos/page.tsx
// ============================================================
// Server Component — el texto traducido vive en ProductosContent
// (Client Component). También calcula la "calidad de publicación" de
// cada producto (ver lib/productQuality.ts) a partir de sus atributos
// fijos llenos + foto + descripción — solo cuenta category_attributes
// con applies_to_variant = false, ya que los de variante no tienen un
// valor único a nivel de producto.
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentVendor, getVendorProducts } from '@/lib/queries/vendor-dashboard'
import { computePublishQuality } from '@/lib/productQuality'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { ProductosContent } from './ProductosContent'

export default async function VendorProductsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/productos')

  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/vendor/register')

  const products = await getVendorProducts(vendor.id)

  const categoryIds = [...new Set(products.map((p: any) => p.category_id).filter((id): id is number => id != null))]
  const productIds = products.map((p: any) => p.id)

  const [{ data: categoryAttrs }, { data: attrValues }] = await Promise.all([
    categoryIds.length > 0
      ? supabase
          .from('category_attributes')
          .select('id, category_id, is_required, is_recommended')
          .in('category_id', categoryIds)
          .eq('applies_to_variant', false)
      : Promise.resolve({ data: [] as any[] }),
    productIds.length > 0
      ? supabase
          .from('product_attribute_values')
          .select('product_id, category_attribute_id')
          .in('product_id', productIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const attrsByCategory = new Map<number, { id: number; is_required: boolean; is_recommended: boolean }[]>()
  for (const attr of categoryAttrs ?? []) {
    const list = attrsByCategory.get(attr.category_id) ?? []
    list.push(attr)
    attrsByCategory.set(attr.category_id, list)
  }

  const filledAttrsByProduct = new Map<string, Set<number>>()
  for (const v of attrValues ?? []) {
    const set = filledAttrsByProduct.get(v.product_id) ?? new Set<number>()
    set.add(v.category_attribute_id)
    filledAttrsByProduct.set(v.product_id, set)
  }

  const productsWithQuality = products.map((p: any) => {
    const attrs = p.category_id != null ? attrsByCategory.get(p.category_id) ?? [] : []
    const filled = filledAttrsByProduct.get(p.id) ?? new Set<number>()
    const required = attrs.filter(a => a.is_required)
    const recommended = attrs.filter(a => !a.is_required && a.is_recommended)

    const qualityPercent = computePublishQuality({
      totalRequired: required.length,
      filledRequired: required.filter(a => filled.has(a.id)).length,
      totalRecommended: recommended.length,
      filledRecommended: recommended.filter(a => filled.has(a.id)).length,
      hasPhoto: (p.images?.length ?? 0) > 0,
      hasDescription: !!p.description?.trim(),
    })

    return { ...p, qualityPercent }
  })

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>
      <DashboardSidebar />
      <ProductosContent products={productsWithQuality as any} isPro={vendor.plan === 'pro'} />
    </div>
  )
}
