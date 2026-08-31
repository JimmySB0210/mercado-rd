// ============================================================
// MercadoRD — "Actividad reciente" (agregada por producto)
// Ruta: src/components/shop/RecentActivity.tsx
// ============================================================
// Server Component. Llama a get_recent_product_activity() —
// SECURITY DEFINER porque orders/order_items tienen RLS restringido
// al comprador/vendor dueño; el RPC solo devuelve un total agregado
// por producto, nunca un evento individual con hora exacta o
// ubicación. "Agregada por producto, nunca por persona" — nunca
// "Juan en Santiago compró esto hace 2 min".
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { RecentActivityList, type ActivityViewModel } from '@/components/shop/RecentActivityList'

export async function RecentActivity() {
  const supabase = createPublicClient()

  const { data: activity, error } = await supabase.rpc('get_recent_product_activity', {
    p_hours: 24,
    p_min_quantity: 2,
    p_limit: 6,
  })
  if (error) console.error('[RecentActivity]', error)
  if (!activity || activity.length === 0) return null

  const productIds = activity.map((a: any) => a.product_id)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, images')
    .in('id', productIds)

  const productById = new Map((products ?? []).map((p: any) => [p.id, p]))

  const items: ActivityViewModel[] = activity
    .map((a: any) => {
      const product = productById.get(a.product_id)
      if (!product) return null
      return {
        productId: a.product_id,
        productName: product.name,
        productImage: product.images?.[0] ?? null,
        quantity: Number(a.quantity_sold),
      }
    })
    .filter((v: ActivityViewModel | null): v is ActivityViewModel => v !== null)

  if (items.length === 0) return null

  return <RecentActivityList items={items} />
}
