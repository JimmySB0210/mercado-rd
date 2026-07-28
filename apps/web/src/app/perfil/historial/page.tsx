// ============================================================
// MercadoRD — Historial de productos vistos
// Ruta: src/app/perfil/historial/page.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shop/Navbar'
import { ProductCard } from '@/components/product/ProductCard'

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Historial</h1>
        <p className="text-sm text-gray-400 mb-6">
          {products.length} {products.length === 1 ? 'producto visto' : 'productos vistos'} recientemente
        </p>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🕐</div>
            <p className="text-gray-500 mb-2">Aún no has visto ningún producto.</p>
            <a href="/" className="text-blue-600 underline text-sm">Explorar productos</a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {products.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
