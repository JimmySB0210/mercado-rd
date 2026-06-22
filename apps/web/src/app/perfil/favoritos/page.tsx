// ============================================================
// MercadoRD — Mis Favoritos
// Ruta: src/app/perfil/favoritos/page.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shop/Navbar'
import { ProductCard } from '@/components/product/ProductCard'

export default async function FavoritesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/perfil/favoritos')

  const { data: wishlistRows, error } = await supabase
    .from('wishlists')
    .select(`
      product_id,
      products(
        *,
        vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
        category:categories(id, name, slug, emoji),
        province:provinces_rd(id, name)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) console.error('[FavoritesPage]', error)

  // Productos desactivados/eliminados quedan como null por el embed —
  // se descartan en vez de romper el grid
  const products = (wishlistRows ?? [])
    .map((row: any) => row.products)
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mis favoritos</h1>
        <p className="text-sm text-gray-400 mb-6">
          {products.length} {products.length === 1 ? 'producto guardado' : 'productos guardados'}
        </p>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🤍</div>
            <p className="text-gray-500 mb-2">Aún no tienes productos favoritos.</p>
            <p className="text-sm text-gray-400 mb-4">
              Toca el corazón en cualquier producto para guardarlo aquí.
            </p>
            <a href="/" className="text-blue-600 underline text-sm">Explorar productos</a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
