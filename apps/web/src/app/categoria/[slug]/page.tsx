// ============================================================
// MercadoRD — Página de categoría
// Ruta: src/app/categoria/[slug]/page.tsx
// ============================================================
// Server Component — el texto traducido vive en CategoryContent
// (Client Component).
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'
import { CategoryContent } from './CategoryContent'

export const revalidate = 300

// Pre-construye las categorías conocidas en build time; cualquier slug
// fuera de esta lista (incluyendo los de CATEGORY_LABELS) se renderiza
// on-demand en la primera visita y queda cacheado por `revalidate`.
export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data } = await supabase.from('categories').select('slug')
  return (data ?? []).filter(c => c.slug).map(c => ({ slug: c.slug as string }))
}

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
  const supabase = createPublicClient()

  // Buscar la categoría por slug (case-insensitive, tolera acentos simples)
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, emoji, parent_id')

  const category = categories?.find(
    c => c.slug?.toLowerCase() === slug.toLowerCase() ||
         c.name?.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
  )

  // Si es una categoría principal, incluir también los productos de sus
  // subcategorías — el vendor puede haber asignado el producto directo
  // a la subcategoría (category_id), no a la principal.
  const categoryIds = category
    ? [category.id, ...(categories ?? []).filter(c => c.parent_id === category.id).map(c => c.id)]
    : []

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
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (category) {
    query = query.in('category_id', categoryIds)
  }

  const { data: products, error } = await query.limit(60)

  if (error) {
    console.error('[CategoryPage]', error)
  }

  // null = usa el fallback traducido ("Todos los productos") en CategoryContent
  const title = category?.name ?? CATEGORY_LABELS[slug.toLowerCase()] ?? null
  const emoji = category?.emoji ?? '🛍️'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CategoryContent title={title} emoji={emoji} products={(products ?? []) as any} />
    </div>
  )
}
