// ============================================================
// MercadoRD — Historial de productos vistos
// Ruta: src/app/perfil/historial/page.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shop/Navbar'
import { HistorialContent } from './HistorialContent'

export default async function HistoryPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/perfil/historial')

  const { data: historyRows, error } = await supabase
    .from('product_view_history')
    .select(`
      viewed_at,
      product:products(
        *,
        vendor:vendors(business_name, is_verified),
        category:categories(name),
        province:provinces_rd(name)
      )
    `)
    .eq('user_id', user.id)
    .order('viewed_at', { ascending: false })
    .limit(30)

  if (error) console.error('[HistoryPage]', error)

  // Productos desactivados/eliminados quedan como null por el embed —
  // se descartan en vez de romper el grid
  const products = (historyRows ?? [])
    .map((row: any) => row.product)
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <HistorialContent products={products} />
    </div>
  )
}
