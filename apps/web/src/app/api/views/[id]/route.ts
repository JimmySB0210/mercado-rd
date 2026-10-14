// ============================================================
// MercadoRD — Registrar vista de producto
// Ruta: src/app/api/views/[id]/route.ts
// ============================================================
// La página de producto es estática (ISR) y ya no incrementa el
// contador en el render — lo dispara el cliente con un POST
// fire-and-forget para que la vista se cuente en cada visita real.
// ============================================================

import { incrementProductView } from '@/lib/supabase/products'
import { createServerClient } from '@/lib/supabase/server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!UUID.test(id)) return new Response(null, { status: 204 })
  // record_product_view no hace nada sin sesión: no se llama.
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) await incrementProductView(id)
  return new Response(null, { status: 204 })
}
