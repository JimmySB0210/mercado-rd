'use client'
// ============================================================
// MercadoRD — SearchResultsGrid
// Ruta: src/components/shop/SearchResultsGrid.tsx
// ============================================================
// Client Component — recibe del server el primer lote (24, ya
// hidratado) más el estado de búsqueda/filtros/orden vigente.
// search_products ahora pagina de verdad en el servidor
// (p_limit/p_offset) — "Ver más resultados" vuelve a llamar el RPC
// con el offset siguiente y luego hidrata (vendor/category/province)
// solo esos ids, en vez de re-hidratar una lista de ids que ya tenía
// guardada de la carga inicial (así funcionaba antes, cuando el RPC
// devolvía todos los matches de una sola llamada).
// ============================================================

import { useCallback, useState } from 'react'
import { ProductCard } from '@/components/product/ProductCard'
import { useHasVariantsMap } from '@/lib/hooks/useHasVariantsMap'
import { createPublicClient } from '@/lib/supabase/public'
import { BRAND } from '@/lib/colors'

const PAGE_SIZE = 24

export interface SearchState {
  query: string | null
  categoryId: number | null
  vendorId: string | null
  provinceId: number | null
  verifiedOnly: boolean
  minPrice: number | null // RD$, se convierte a centavos antes de llamar el RPC
  maxPrice: number | null
  minRating: number | null
  minReviews: number | null
  sort: string
}

interface Props {
  initialProducts: any[]
  initialHasMore: boolean
  searchState: SearchState
}

export function SearchResultsGrid({ initialProducts, initialHasMore, searchState }: Props) {
  const [products, setProducts] = useState<any[]>(initialProducts)
  // "Ver más resultados" agrega productos a esta lista: los ya verificados
  // conservan su valor y solo los nuevos arrancan en "verificando".
  const variantsById = useHasVariantsMap(products.map(p => p.id))
  const [offset, setOffset] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)

    const supabase = createPublicClient()
    // p_verified_only solo se manda cuando es true -- ver nota en
    // buscar/page.tsx sobre por qué un null explícito rompe el RPC.
    const rpcParams: Record<string, unknown> = {
      p_query: searchState.query,
      p_category_id: searchState.categoryId,
      p_vendor_id: searchState.vendorId,
      p_min_price: searchState.minPrice !== null ? searchState.minPrice * 100 : null,
      p_max_price: searchState.maxPrice !== null ? searchState.maxPrice * 100 : null,
      p_min_rating: searchState.minRating,
      p_sort_by: searchState.sort,
      p_limit: PAGE_SIZE,
      p_offset: offset,
      p_province_id: searchState.provinceId,
      p_min_reviews: searchState.minReviews,
    }
    if (searchState.verifiedOnly) rpcParams.p_verified_only = true

    const { data: rawProducts, error } = await supabase.rpc('search_products', rpcParams)

    if (error || !rawProducts) {
      console.error('[SearchResultsGrid]', error)
      setLoadingMore(false)
      return
    }

    setHasMore(rawProducts.length === PAGE_SIZE)

    const ids = rawProducts.map((p: any) => p.id)
    const { data: hydrated } = await supabase
      .from('products')
      .select(`
        *,
        vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
        category:categories(id, name, slug, emoji),
        province:provinces_rd(id, name)
      `)
      .in('id', ids)

    const orderMap = new Map<string, number>(ids.map((id: string, i: number) => [id, i]))
    const sorted = (hydrated ?? []).sort(
      (a: any, b: any) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
    )

    setProducts(prev => [...prev, ...sorted])
    setOffset(prev => prev + PAGE_SIZE)
    setLoadingMore(false)
  }, [loadingMore, hasMore, offset, searchState])

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {products.map(p => (
          <ProductCard key={p.id} product={p as any} hasVariants={variantsById.get(p.id)} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{ background: BRAND.blue }}
            className="text-white rounded-lg px-7 py-3 text-sm font-semibold disabled:opacity-70 disabled:cursor-wait border-none cursor-pointer"
          >
            {loadingMore ? 'Cargando...' : 'Ver más resultados'}
          </button>
        </div>
      )}
    </>
  )
}
