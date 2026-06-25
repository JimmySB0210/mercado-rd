'use client'
// ============================================================
// MercadoRD — SearchResultsGrid
// Ruta: src/components/shop/SearchResultsGrid.tsx
// ============================================================
// Client Component — recibe del server el primer lote (12) ya
// hidratado y la lista completa de ids en orden de relevancia
// (search_products no soporta paginación, así que el orden ya
// viene resuelto). "Ver más resultados" hidrata el siguiente lote
// de ids con createPublicClient() y lo acumula al estado existente.
// ============================================================

import { useCallback, useState } from 'react'
import { ProductCard } from '@/components/product/ProductCard'
import { createPublicClient } from '@/lib/supabase/public'
import { BRAND } from '@/lib/colors'

const PAGE_SIZE = 12

interface Props {
  initialProducts: any[]
  orderedIds: string[]
}

export function SearchResultsGrid({ initialProducts, orderedIds }: Props) {
  const [products, setProducts] = useState<any[]>(initialProducts)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(Math.min(PAGE_SIZE, orderedIds.length))

  const hasMore = nextOffset < orderedIds.length

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)

    const nextIds = orderedIds.slice(nextOffset, nextOffset + PAGE_SIZE)

    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
        category:categories(id, name, slug, emoji),
        province:provinces_rd(id, name)
      `)
      .in('id', nextIds)

    if (error) {
      console.error('[SearchResultsGrid]', error)
      setLoadingMore(false)
      return
    }

    // Mantener el orden de relevancia que trajo search_products
    const orderMap = new Map(nextIds.map((id, i) => [id, i]))
    const sorted = (data ?? []).sort(
      (a: any, b: any) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
    )

    setProducts(prev => {
      const seen = new Set(prev.map(p => p.id))
      return [...prev, ...sorted.filter(p => !seen.has(p.id))]
    })
    setNextOffset(prev => Math.min(prev + nextIds.length, orderedIds.length))
    setLoadingMore(false)
  }, [hasMore, loadingMore, nextOffset, orderedIds])

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(p => (
          <ProductCard key={p.id} product={p as any} />
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
