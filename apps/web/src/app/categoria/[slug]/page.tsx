// ============================================================
// MercadoRD — Página de categoría
// Ruta: src/app/categoria/[slug]/page.tsx
// ============================================================

import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import { Navbar } from '@/components/shop/Navbar'

const CATEGORY_LABELS: Record<string, string> = {
  electronica: 'Electrónica',
  moda: 'Moda',
  hogar: 'Hogar',
  belleza: 'Belleza',
  deportes: 'Deportes',
  autos: 'Autos',
  mas: 'Más',
}

export default async function CategoryPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createServerClient()

  // Buscar la categoría por slug (case-insensitive, tolera acentos simples)
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, emoji')

  const category = categories?.find(
    c => c.slug?.toLowerCase() === slug.toLowerCase() ||
         c.name?.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
  )

  // Traer productos — si hay categoría específica, filtrar; si no, todos
  let query = supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
      category:categories(id, name, slug, emoji),
      province:provinces_rd(id, name)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category_id', category.id)
  }

  const { data: products, error } = await query.limit(60)

  if (error) {
    console.error('[CategoryPage]', error)
  }

  const title = category?.name ?? CATEGORY_LABELS[slug.toLowerCase()] ?? 'Todos los productos'
  const emoji = category?.emoji ?? '🛍️'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <nav className="text-sm text-gray-400 mb-4">
          <a href="/" className="hover:text-gray-600 transition-colors no-underline">Inicio</a>
          <span className="mx-2">/</span>
          <span className="text-gray-600">{title}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {emoji} {title}
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          {products?.length ?? 0} productos encontrados
        </p>

        {!products || products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500">Todavía no hay productos en esta categoría.</p>
            <a href="/" className="text-blue-600 underline mt-4 inline-block text-sm">
              Volver al inicio
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
