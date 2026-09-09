// ============================================================
// MercadoRD — Mi lista de regalos
// Ruta: src/app/perfil/lista-regalos/page.tsx
// ============================================================
// La dirección de entrega real SÍ se trae aquí (el dueño puede ver y
// usar su propia dirección) — lo que nunca debe llegar al frontend es
// la página PÚBLICA (app/regalo/[slug]/page.tsx), que no la selecciona.
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shop/Navbar'
import { ListaRegalosContent } from './ListaRegalosContent'

export default async function ListaRegalosPage(
  { searchParams }: { searchParams: Promise<{ add?: string }> }
) {
  const { add: pendingProductId } = await searchParams

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/perfil/lista-regalos')

  const { data: list, error: listError } = await supabase
    .from('gift_lists')
    .select('id, display_name, share_slug, delivery_address, province_id, is_active, expires_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (listError) console.error('[ListaRegalosPage] gift_lists', listError)

  const { data: provinces, error: provincesError } = await supabase
    .from('provinces_rd')
    .select('id, name')
    .order('name')

  if (provincesError) console.error('[ListaRegalosPage] provinces_rd', provincesError)

  let items: any[] = []
  if (list) {
    const { data: itemRows, error: itemsError } = await supabase
      .from('gift_list_items')
      .select('id, priority, purchased_by, purchased_at, product:products(id, name, images, price_rdp, compare_rdp)')
      .eq('gift_list_id', list.id)
      .order('priority')

    if (itemsError) console.error('[ListaRegalosPage] gift_list_items', itemsError)
    items = (itemRows ?? []).filter((row: any) => row.product)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ListaRegalosContent
        list={list ?? null}
        items={items}
        provinces={provinces ?? []}
        pendingProductId={pendingProductId ?? null}
      />
    </div>
  )
}
