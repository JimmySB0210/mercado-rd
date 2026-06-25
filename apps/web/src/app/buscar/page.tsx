// ============================================================
// MercadoRD — Resultados de búsqueda
// Ruta: src/app/buscar/page.tsx
// ============================================================
// Usa la función RPC search_products (tolerante a tildes/mayúsculas)
// en vez de .or() con ilike crudo. Solo se hidrata el primer lote
// de 12 resultados aquí — el resto lo pagina SearchResultsGrid.
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import { SearchResultsGrid } from '@/components/shop/SearchResultsGrid'
import { Navbar } from '@/components/shop/Navbar'

const PAGE_SIZE = 12

function sanitizeSearchQuery(raw: string): string {
  return raw
    .replace(/[(),%*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

export default async function SearchPage(
  { searchParams }: { searchParams: Promise<{ q?: string }> }
) {
  const { q } = await searchParams
  const rawQuery = (q ?? '').trim()
  const query = sanitizeSearchQuery(rawQuery)

  let orderedIds: string[] = []
  let initialProducts: any[] = []

  if (query.length >= 2) {
    const supabase = await createServerClient()

    const { data: rawProducts, error } = await supabase
      .rpc('search_products', { p_query: query })

    if (error) {
      console.error('[SearchPage]', error)
    } else if (rawProducts && rawProducts.length > 0) {
      // search_products devuelve solo la tabla products, ya en orden de
      // relevancia — guardamos todos los ids para paginar, pero solo
      // hidratamos (vendor/category/province) el primer lote de 12 aquí
      orderedIds = rawProducts.map((p: any) => p.id)
      const firstBatchIds = orderedIds.slice(0, PAGE_SIZE)

      const { data: hydrated } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
          category:categories(id, name, slug, emoji),
          province:provinces_rd(id, name)
        `)
        .in('id', firstBatchIds)

      // Mantener el orden de relevancia que ya trajo search_products
      const orderMap = new Map<string, number>(firstBatchIds.map((id: string, i: number) => [id, i]))
      initialProducts = (hydrated ?? []).sort(
        (a: any, b: any) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <nav className="text-sm text-gray-400 mb-4">
          <a href="/" className="hover:text-gray-600 transition-colors no-underline">Inicio</a>
          <span className="mx-2">/</span>
          <span className="text-gray-600">Búsqueda</span>
        </nav>

        {query.length < 2 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500">Escribe al menos 2 caracteres para buscar.</p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              Resultados para &ldquo;{query}&rdquo;
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              {orderedIds.length} {orderedIds.length === 1 ? 'producto encontrado' : 'productos encontrados'}
            </p>

            {orderedIds.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-500 mb-2">No encontramos productos para &ldquo;{query}&rdquo;</p>
                <p className="text-sm text-gray-400">Intenta con otra palabra o revisa la ortografía.</p>
              </div>
            ) : (
              <SearchResultsGrid initialProducts={initialProducts} orderedIds={orderedIds} />
            )}
          </>
        )}

      </div>
    </div>
  )
}
