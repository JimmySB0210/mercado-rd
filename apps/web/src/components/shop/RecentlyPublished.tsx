// ============================================================
// MercadoRD — "Recién publicados"
// Ruta: src/components/shop/RecentlyPublished.tsx
// ============================================================
// Server Component — ordena por published_at (se llena solo la
// primera vez que un producto pasa a 'published'), no created_at
// (que puede ser de semanas atrás si el vendor lo dejó en borrador).
// Si no hay productos con published_at, la sección no se renderiza.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { HomeProductSection } from '@/components/shop/HomeProductSection'

const SELECT = `
  id, vendor_id, category_id, province_id, name, description,
  price_rdp, compare_rdp, images, stock, sizes, colors, is_active,
  rating_avg, rating_count, sold_count, view_count, created_at, published_at,
  vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp)
`

export async function RecentlyPublished() {
  const supabase = createPublicClient()

  const { data } = await supabase
    .from('products')
    .select(SELECT)
    .eq('is_active', true)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(12)

  if (!data || data.length === 0) return null

  return <HomeProductSection titleKey="recentlyPublishedTitle" products={data as any} />
}
