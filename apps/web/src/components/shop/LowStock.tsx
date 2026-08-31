// ============================================================
// MercadoRD — "Últimas unidades"
// Ruta: src/components/shop/LowStock.tsx
// ============================================================
// Server Component — mismo umbral que el badge individual en
// ProductCard.tsx (stock > 0 && stock <= 5), no uno nuevo inventado
// para esta sección. Si ningún producto califica, no se renderiza.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { HomeProductSection } from '@/components/shop/HomeProductSection'

const LOW_STOCK_THRESHOLD = 5

const SELECT = `
  id, vendor_id, category_id, province_id, name, description,
  price_rdp, compare_rdp, images, stock, sizes, colors, is_active,
  rating_avg, rating_count, sold_count, view_count, created_at, published_at,
  vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp)
`

export async function LowStock() {
  const supabase = createPublicClient()

  const { data } = await supabase
    .from('products')
    .select(SELECT)
    .eq('is_active', true)
    .gt('stock', 0)
    .lte('stock', LOW_STOCK_THRESHOLD)
    .order('stock', { ascending: true })
    .limit(12)

  if (!data || data.length === 0) return null

  return <HomeProductSection titleKey="lowStockTitle" products={data as any} />
}
