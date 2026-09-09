// ============================================================
// MercadoRD — Lista de regalos pública
// Ruta: src/app/regalo/[slug]/page.tsx
// ============================================================
// Pública, sin sesión requerida para VER (solo para comprar). Usa
// createPublicClient() a propósito, no createServerClient() — no
// depende de cookies del visitante y permite cachear con ISR.
//
// La dirección real del dueño de la lista NUNCA se selecciona aquí —
// solo la usa create_gift_order() internamente en el servidor.
//
// Sin ISR: a diferencia del homepage (donde un "42 vendidos" desfasado
// no importa), acá el estado disponible/ya-regalado tiene que ser
// exacto — dos personas pueden estar mirando el mismo enlace casi
// simultáneamente, y create_gift_order() ya resuelve esa carrera con
// FOR UPDATE, pero de nada sirve si la página sigue mostrando
// "Regalar esto" en un artículo que otro visitante ya compró hace 2
// segundos. revalidate=0 fuerza fetch fresco de Supabase en cada
// request.
// ============================================================

import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'
import { RegaloPublicContent } from './RegaloPublicContent'

export const revalidate = 0

export default async function RegaloPublicPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createPublicClient()

  const { data: list, error } = await supabase
    .from('gift_lists')
    .select('id, display_name, share_slug, is_active, expires_at, province:provinces_rd(name)')
    .eq('share_slug', slug)
    .maybeSingle()

  if (error) console.error('[RegaloPublicPage] gift_lists', error)
  if (!list) notFound()

  const isExpired = !!list.expires_at && new Date(list.expires_at) < new Date()
  const isUnavailable = !list.is_active || isExpired

  let items: any[] = []
  if (!isUnavailable) {
    const { data: itemRows, error: itemsError } = await supabase
      .from('gift_list_items')
      .select('id, priority, purchased_by, product:products(id, name, images, price_rdp, compare_rdp)')
      .eq('gift_list_id', list.id)
      .order('priority')

    if (itemsError) console.error('[RegaloPublicPage] gift_list_items', itemsError)
    items = (itemRows ?? []).filter((row: any) => row.product)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <RegaloPublicContent
        slug={slug}
        displayName={list.display_name}
        provinceName={(list.province as any)?.name ?? null}
        isUnavailable={isUnavailable}
        items={items}
      />
    </div>
  )
}
