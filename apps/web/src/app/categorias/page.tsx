// ============================================================
// MercadoRD — Todas las categorías
// Ruta: src/app/categorias/page.tsx
// ============================================================
// Server Component — usa createPublicClient() (sin cookies) para
// que la página quede cacheable con ISR, igual que /tiendas. El
// texto traducido vive en CategoriasContent (Client Component).
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'
import { CategoriasContent } from './CategoriasContent'

export const revalidate = 300

export default async function CategoriasPage() {
  const supabase = createPublicClient()

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug, emoji')
    .order('name')

  if (error) console.error('[CategoriasPage]', error)

  // Tiendas (vendors únicos) con al menos un producto activo por categoría —
  // agregado en el servidor en vez de una vista/RPC nueva en la base de datos.
  const { data: productRows } = await supabase
    .from('products')
    .select('category_id, vendor_id')
    .eq('is_active', true)

  const storesByCategory = new Map<number, Set<string>>()
  for (const p of productRows ?? []) {
    if (!p.category_id || !p.vendor_id) continue
    const set = storesByCategory.get(p.category_id) ?? new Set<string>()
    set.add(p.vendor_id)
    storesByCategory.set(p.category_id, set)
  }

  const categoriesWithCounts = (categories ?? []).map(c => ({
    ...c,
    storeCount: storesByCategory.get(c.id)?.size ?? 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CategoriasContent categories={categoriesWithCounts} />
    </div>
  )
}
