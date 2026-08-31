// ============================================================
// MercadoRD — "Populares" (más vistas históricas)
// Ruta: src/components/shop/Popular.tsx
// ============================================================
// Server Component. Llama a get_product_view_counts(p_days: null) —
// mismo RPC que Trending.tsx, sin ventana de tiempo (histórico
// completo). Ver Trending.tsx para el porqué del SECURITY DEFINER.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { HomeProductSection } from '@/components/shop/HomeProductSection'

const SELECT = `
  id, vendor_id, category_id, province_id, name, description,
  price_rdp, compare_rdp, images, stock, sizes, colors, is_active,
  rating_avg, rating_count, sold_count, view_count, created_at, published_at,
  vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp)
`

export async function Popular() {
  const supabase = createPublicClient()

  const { data: counts, error } = await supabase.rpc('get_product_view_counts', { p_limit: 12 })
  if (error) console.error('[Popular]', error)
  if (!counts || counts.length === 0) return null

  const orderedIds = counts.map((c: any) => c.product_id)
  const { data: products } = await supabase.from('products').select(SELECT).in('id', orderedIds).eq('is_active', true)

  const productById = new Map((products ?? []).map((p: any) => [p.id, p]))
  const ordered = orderedIds.map((id: string) => productById.get(id)).filter(Boolean)

  if (ordered.length === 0) return null

  return <HomeProductSection titleKey="popularTitle" products={ordered as any} />
}
