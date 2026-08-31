// ============================================================
// MercadoRD — "Más vendidos"
// Ruta: src/components/shop/BestSellers.tsx
// ============================================================
// Server Component — ordena por sold_count real. Exige sold_count > 0
// (nunca muestra un producto con 0 ventas como "más vendido") — si
// ninguno califica, la sección no se renderiza.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { HomeProductSection } from '@/components/shop/HomeProductSection'

const SELECT = `
  id, vendor_id, category_id, province_id, name, description,
  price_rdp, compare_rdp, images, stock, sizes, colors, is_active,
  rating_avg, rating_count, sold_count, view_count, created_at, published_at,
  vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp)
`

export async function BestSellers() {
  const supabase = createPublicClient()

  const { data } = await supabase
    .from('products')
    .select(SELECT)
    .eq('is_active', true)
    .gt('sold_count', 0)
    .order('sold_count', { ascending: false })
    .limit(12)

  if (!data || data.length === 0) return null

  return <HomeProductSection titleKey="bestSellersTitle" products={data as any} />
}
