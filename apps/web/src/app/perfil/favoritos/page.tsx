// ============================================================
// MercadoRD — Mis Favoritos
// Ruta: src/app/perfil/favoritos/page.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shop/Navbar'
import { FavoritosContent } from './FavoritosContent'

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
      <FavoritosContent products={products} />
    </div>
  )
}
