// ============================================================
// MercadoRD — Confirmación simple de regalo
// Ruta: src/app/regalo/[slug]/gracias/page.tsx
// ============================================================
// A propósito NO es la confirmación de pedido normal (confirm/page.tsx)
// — quien compró el regalo no necesita ver la dirección de envío del
// dueño de la lista, así que esta página solo muestra el alias.
// ============================================================

import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'
import { GraciasContent } from './GraciasContent'

export default async function GraciasPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createPublicClient()

  const { data: list, error } = await supabase
    .from('gift_lists')
    .select('display_name')
    .eq('share_slug', slug)
    .maybeSingle()

  if (error) console.error('[GraciasPage] gift_lists', error)
  if (!list) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <GraciasContent displayName={list.display_name} />
    </div>
  )
}
