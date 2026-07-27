// ============================================================
// MercadoRD — Todas las categorías
// Ruta: src/app/categorias/page.tsx
// ============================================================
// Server Component — usa createPublicClient() (sin cookies) para
// que la página quede cacheable con ISR, igual que /tiendas.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <nav className="text-sm text-gray-400 mb-4">
          <a href="/" className="hover:text-gray-600 transition-colors no-underline">Inicio</a>
          <span className="mx-2">/</span>
          <span className="text-gray-600">Categorías</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Todas las categorías</h1>
        <p className="text-sm text-gray-400 mb-6">
          {categories?.length ?? 0} {(categories?.length ?? 0) === 1 ? 'categoría' : 'categorías'}
        </p>

        {!categories || categories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">📂</div>
            <p className="text-gray-500">Todavía no hay categorías para mostrar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map(c => (
              <a
                key={c.id}
                href={`/categoria/${c.slug}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center gap-2 no-underline hover:shadow-md hover:border-gray-200 transition-all"
              >
                <span className="text-4xl">{c.emoji}</span>
                <span className="text-sm font-semibold text-gray-900">{c.name}</span>
              </a>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
