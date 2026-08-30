// ============================================================
// MercadoRD — Reseñas del producto
// Ruta: src/components/shop/ProductReviews.tsx
// ============================================================
// Server Component — nunca existió una lista de reseñas en la página
// de producto (solo el resumen ⭐ junto al nombre). Toda fila de
// reviews está ligada a un order_id real, así que todas se muestran
// como compra verificada.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { ProductReviewsList, type ReviewViewModel } from '@/components/shop/ProductReviewsList'

interface Props {
  productId: string
}

export async function ProductReviews({ productId }: Props) {
  const supabase = createPublicClient()

  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, user_id')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  // Nombres de compradores — consulta separada (no embebida). users
  // tiene RLS restrictivo (solo el propio usuario o un admin), así que
  // embeber user:users(full_name) aquí vaciaría la fila completa para
  // cualquier visitante anónimo (mismo motivo que tienda/[id]/page.tsx).
  const reviewerIds = [...new Set((reviewsRaw ?? []).map(r => r.user_id))]
  const { data: reviewers } = reviewerIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', reviewerIds)
    : { data: [] as { id: string; full_name: string }[] }

  const reviewerMap = new Map((reviewers ?? []).map(u => [u.id, u.full_name]))

  const reviews: ReviewViewModel[] = (reviewsRaw ?? []).map(r => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
    buyerName: reviewerMap.get(r.user_id) ?? null,
  }))

  return <ProductReviewsList reviews={reviews} />
}
