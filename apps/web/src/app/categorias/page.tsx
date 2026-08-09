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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CategoriasContent categories={categories ?? []} />
    </div>
  )
}
