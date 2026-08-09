// ============================================================
// MercadoRD — Productos destacados (homepage)
// Ruta: src/components/shop/FeaturedProducts.tsx
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { FeaturedProductsGrid } from '@/components/shop/FeaturedProductsGrid'

export async function FeaturedProducts() {
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, vendors(business_name, is_verified), categories(name), provinces_rd(name)')
    .eq('is_featured', true)
    .eq('is_active', true)
    .limit(8)

  if (error) console.error('[FeaturedProducts]', error)
  if (!data || data.length === 0) return null

  // ProductCard espera product.vendor (singular) — la query embebe la
  // relación como `vendors` (nombre de la tabla, sin alias)
  const products = data.map((p: any) => ({ ...p, vendor: p.vendors }))

  return <FeaturedProductsGrid products={products as any} />
}
