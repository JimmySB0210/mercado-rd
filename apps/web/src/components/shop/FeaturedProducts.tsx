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
    // vendors(id, whatsapp) — faltaban: sin ellos, ProductCard no puede
    // armar "Ver tienda" ni el botón de WhatsApp, así que un producto
    // con variantes (que no puede ofrecer "Agregar al carrito" directo)
    // quedaba con el área de CTA completamente vacía. Mismo shape que ya
    // usan RecentlyPublished.tsx/BestSellers.tsx/etc.
    .select('*, vendors(id, business_name, is_verified, whatsapp), categories(name), provinces_rd(name)')
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
