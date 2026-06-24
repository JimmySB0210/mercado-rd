// ============================================================
// MercadoRD — Productos destacados (homepage)
// Ruta: src/components/shop/FeaturedProducts.tsx
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import { BRAND } from '@/lib/colors'

export async function FeaturedProducts() {
  const supabase = await createServerClient()

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

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 16px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: BRAND.dark, margin: 0 }}>
          Productos destacados ⭐
        </h2>
      </div>
      <div className="grid-products">
        {products.map(p => (
          <ProductCard key={p.id} product={p as any} />
        ))}
      </div>
    </div>
  )
}
