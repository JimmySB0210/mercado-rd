// ============================================================
// MercadoRD — Resultados de búsqueda
// Ruta: src/app/buscar/page.tsx
// ============================================================
// Usa la función RPC search_products (documentada en
// supabase/migrations/004_search_products_filters_sort.sql): texto +
// categoría + rango de precio + rating mínimo + orden, con paginación
// real en el servidor (p_limit/p_offset). "Ver más resultados" en
// SearchResultsGrid vuelve a llamar el RPC con el offset siguiente —
// ya no hidrata ids que traía guardados de antes (el RPC viejo
// devolvía todos los matches de una sola vez; el nuevo pagina de
// verdad, así que asumir eso rompería los resultados después de la
// primera página).
//
// category/minPrice/maxPrice/minRating solos (sin texto) también
// disparan una búsqueda — así funciona el link "Buscar dentro de esta
// categoría" desde categoria/[slug].
//
// Corrección ortográfica: suggest_search_correction() compara contra
// categorías/sinónimos, no contra nombres de producto — puede sugerir
// algo aunque la búsqueda original YA tenga resultados reales (ej.
// "camiseta" encuentra 1 producto pero igual sugiere "camisetas" por
// similitud). Por eso solo se llama y se muestra cuando la búsqueda
// original trajo pocos resultados (<3) — nunca solo porque la función
// devolvió algo.
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import { SearchResultsGrid } from '@/components/shop/SearchResultsGrid'
import { SearchFiltersBar } from '@/components/shop/SearchFiltersBar'
import { Navbar } from '@/components/shop/Navbar'

const PAGE_SIZE = 24 // coincide con el p_limit default del RPC

function sanitizeSearchQuery(raw: string): string {
  return raw
    .replace(/[(),%*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

function parseIntParam(raw: string | undefined): number | null {
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

interface SearchPageParams {
  q?: string
  category?: string
  minPrice?: string
  maxPrice?: string
  minRating?: string
  sort?: string
}

const VALID_SORTS = new Set(['relevance', 'price_asc', 'price_desc', 'rating', 'newest', 'sales', 'popularity'])

export default async function SearchPage(
  { searchParams }: { searchParams: Promise<SearchPageParams> }
) {
  const sp = await searchParams
  const rawQuery = (sp.q ?? '').trim()
  const query = sanitizeSearchQuery(rawQuery)
  const hasQuery = query.length >= 2

  const categoryId = parseIntParam(sp.category)
  const minPrice = parseIntParam(sp.minPrice) // RD$, se convierte a centavos solo al llamar el RPC
  const maxPrice = parseIntParam(sp.maxPrice)
  const minRating = parseIntParam(sp.minRating)
  const sort = sp.sort && VALID_SORTS.has(sp.sort) ? sp.sort : 'relevance'

  const hasFilters = categoryId !== null || minPrice !== null || maxPrice !== null || minRating !== null
  const shouldSearch = hasQuery || hasFilters

  const supabase = await createServerClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, emoji')
    .order('sort_order')

  let initialProducts: any[] = []
  let hasMore = false

  if (shouldSearch) {
    const { data: rawProducts, error } = await supabase.rpc('search_products', {
      p_query: hasQuery ? query : null,
      p_category_id: categoryId,
      p_vendor_id: null,
      p_min_price: minPrice !== null ? minPrice * 100 : null,
      p_max_price: maxPrice !== null ? maxPrice * 100 : null,
      p_min_rating: minRating,
      p_sort_by: sort,
      p_limit: PAGE_SIZE,
      p_offset: 0,
    })

    if (error) {
      console.error('[SearchPage]', error)
    } else if (rawProducts && rawProducts.length > 0) {
      const orderedIds = rawProducts.map((p: any) => p.id)
      hasMore = rawProducts.length === PAGE_SIZE

      const { data: hydrated } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
          category:categories(id, name, slug, emoji),
          province:provinces_rd(id, name)
        `)
        .in('id', orderedIds)

      // Mantener el orden que ya trajo search_products (relevancia u
      // otro sort) — .in() no preserva orden.
      const orderMap = new Map<string, number>(orderedIds.map((id: string, i: number) => [id, i]))
      initialProducts = (hydrated ?? []).sort(
        (a: any, b: any) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
      )
    }
  }

  // Solo se consulta con pocos resultados (<3) para la búsqueda de
  // texto original — ver nota arriba sobre por qué no basta con que
  // la función tenga algo que sugerir.
  let suggestion: string | null = null
  if (hasQuery && initialProducts.length < 3) {
    const { data: suggestionData, error: suggestionError } = await supabase
      .rpc('suggest_search_correction', { p_query: query })

    if (suggestionError) console.error('[SearchPage] suggest_search_correction', suggestionError)
    else if (typeof suggestionData === 'string' && suggestionData.trim()) suggestion = suggestionData
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

        <SearchFiltersBar categories={categories ?? []} />

        {!shouldSearch ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500">Escribe al menos 2 caracteres para buscar, o elige un filtro.</p>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {hasQuery ? <>Resultados para &ldquo;{query}&rdquo;</> : 'Resultados de búsqueda'}
            </h1>
            <p className={`text-sm text-gray-400 ${suggestion ? 'mb-1' : 'mb-6'}`}>
              {initialProducts.length}{hasMore ? '+' : ''}{' '}
              {initialProducts.length === 1 && !hasMore ? 'producto encontrado' : 'productos encontrados'}
            </p>

            {suggestion && (
              <p className="text-sm text-gray-500 mb-6">
                ¿Quisiste decir:{' '}
                <a
                  href={`/buscar?q=${encodeURIComponent(suggestion)}`}
                  className="font-medium hover:underline"
                  style={{ color: 'var(--brand-blue)' }}
                >
                  {suggestion}
                </a>
                ?
              </p>
            )}

            {initialProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-500 mb-2">No encontramos productos con estos criterios</p>
                <p className="text-sm text-gray-400">Intenta con otra palabra, revisa la ortografía, o ajusta los filtros.</p>
              </div>
            ) : (
              <SearchResultsGrid
                // Fuerza un remount cuando cambia la búsqueda/filtros/orden —
                // SearchResultsGrid guarda los productos en useState, que solo
                // toma initialProducts como valor inicial al montar. Sin este
                // key, un cambio de filtro re-renderiza el padre con
                // initialProducts nuevos pero el grid se queda con el estado
                // viejo (verificado en vivo: el <select> cambiaba la URL pero
                // el grid no se actualizaba hasta un reload manual).
                key={`${query}-${categoryId}-${minPrice}-${maxPrice}-${minRating}-${sort}`}
                initialProducts={initialProducts}
                initialHasMore={hasMore}
                searchState={{
                  query: hasQuery ? query : null,
                  categoryId,
                  minPrice,
                  maxPrice,
                  minRating,
                  sort,
                }}
              />
            )}
          </>
        )}

      </div>
    </div>
  )
}
