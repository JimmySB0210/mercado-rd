// ============================================================
// MercadoRD — Registrar vista de producto
// Ruta: src/app/api/views/[id]/route.ts
// ============================================================
// La página de producto es estática (ISR) y ya no incrementa el
// contador en el render — lo dispara el cliente con un POST
// fire-and-forget para que la vista se cuente en cada visita real.
// ============================================================

import { incrementProductView } from '@/lib/supabase/products'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await incrementProductView(id)
  return new Response(null, { status: 204 })
}
