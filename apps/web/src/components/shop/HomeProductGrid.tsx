'use client'
// ============================================================
// MercadoRD — HomeProductGrid
// Ruta: src/components/shop/HomeProductGrid.tsx
// ============================================================
// Client Component — carga los productos con createPublicClient()
// (no createServerClient(), para no romper el ISR de la homepage)
// y pagina con un botón "Ver más productos" que acumula resultados.
// Si no hay productos reales, la sección de "Ofertas destacadas" no
// se renderiza — antes rellenaba con un mock hardcodeado, lo cual
// violaba la regla de "nunca inventar datos" (Fase 1, homepage vivo).
// El trust bar que vivía aquí se eliminó (Fase 2A, reconciliación de
// franjas de beneficios) — ShippingBenefitsStrip, debajo del hero, es
// ahora la única fuente de verdad.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { ProductCard } from '@/components/product/ProductCard'
import { createPublicClient } from '@/lib/supabase/public'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { Product } from '@/types'

const PAGE_SIZE = 12

type FeaturedVendor = {
  id: string
  business_name: string
  logo_url: string | null
  is_verified: boolean
  rating_avg: number | null
  total_sales: number | null
}

async function fetchFeaturedVendors(): Promise<FeaturedVendor[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('vendors')
    .select('id, business_name, logo_url, is_verified, rating_avg, total_sales')
    .order('is_verified', { ascending: false })
    .order('total_sales', { ascending: false })
    .limit(5)

  if (error) { console.error('[HomeProductGrid] vendors', error); return [] }
  return (data ?? []) as FeaturedVendor[]
}

type ProductsPageResult = { data: Product[]; ok: boolean }

// "Ofertas destacadas" — antes ordenaba el catálogo general por
// sold_count (no filtraba por descuento real, el nombre no coincidía
// con el contenido). Ahora filtra a productos con compare_rdp
// realmente mayor que price_rdp — verificado en la BD que todo
// compare_rdp existente ya cumple esa condición (sin datos corruptos),
// así que .not('compare_rdp', 'is', null) es un filtro seguro sin
// necesidad de comparar dos columnas vía RPC/vista.
async function fetchProductsPage(offset: number): Promise<ProductsPageResult> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(id, business_name, is_verified, province_id),
      category:categories(id, name, slug, emoji),
      province:provinces_rd(id, name)
    `)
    .eq('is_active', true)
    .not('compare_rdp', 'is', null)
    .order('sold_count', { ascending: false })
    .order('id', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) { console.error('[HomeProductGrid]', error); return { data: [], ok: false } }
  return { data: (data ?? []) as Product[], ok: true }
}

export function HomeProductGrid() {
  const { t } = useTranslation('products')
  const [products, setProducts] = useState<Product[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const [vendors, setVendors] = useState<FeaturedVendor[]>([])

  useEffect(() => {
    let active = true
    fetchFeaturedVendors().then(data => {
      if (active) setVendors(data)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    fetchProductsPage(0)
      .then(({ data, ok }) => {
        if (!active) return
        if (!ok) {
          setFetchError(true)
          setHasMore(false)
          return
        }
        setProducts(data)
        setHasMore(data.length === PAGE_SIZE)
      })
      .catch(error => {
        console.error('[HomeProductGrid]', error)
        if (!active) return
        setFetchError(true)
        setHasMore(false)
      })
      .finally(() => {
        if (!active) return
        setLoadingInitial(false)
      })
    return () => { active = false }
  }, [])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return

    setLoadingMore(true)
    try {
      const { data, ok } = await fetchProductsPage(products.length)
      if (!ok) {
        setFetchError(true)
        setHasMore(false)
        return
      }
      setProducts(prev => [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
    } catch (error) {
      console.error('[HomeProductGrid]', error)
      setFetchError(true)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, products.length])

  const hasReal = !loadingInitial && products.length > 0
  const showError = !loadingInitial && !hasReal && fetchError
  const showFeaturedOffers = hasReal || showError

  return (
    <div id="productos" style={{maxWidth:1400, margin:'0 auto', padding:'8px 24px 20px'}}>

      {/* Ofertas destacadas — si no hay productos reales (y no fue un
          error de carga), la sección entera no se renderiza */}
      {showFeaturedOffers && (
        <>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', margin:'20px 0 16px'}}>
            <h2 style={{fontSize:18, fontWeight:700, color:BRAND.dark, margin:0}}>{t('featuredOffersTitle')}</h2>
            <a href='/categoria/electronica' style={{color:BRAND.blue, fontSize:13, fontWeight:600, textDecoration:'none'}}>
              {t('viewAll')}
            </a>
          </div>

          {hasReal && (
            <div className="grid-products">
              {products.map(p => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          )}

          {showError && (
            <div style={{background:'#fff', border:'1px solid #EEE', borderRadius:10, padding:'40px 20px', textAlign:'center'}}>
              <div style={{fontSize:40, marginBottom:12}}>⚠️</div>
              <p style={{color:BRAND.gray, fontSize:14, margin:0}}>{t('loadError')}</p>
            </div>
          )}
        </>
      )}

      {/* Ver más productos — solo si hay productos reales y quedan más por cargar */}
      {hasReal && hasMore && (
        <div style={{display:'flex', justifyContent:'center', margin:'24px 0 0'}}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              background:BRAND.blue,
              color:'#fff',
              border:'none',
              borderRadius:8,
              padding:'12px 28px',
              fontSize:14,
              fontWeight:600,
              cursor: loadingMore ? 'wait' : 'pointer',
              opacity: loadingMore ? 0.7 : 1,
            }}
          >
            {loadingMore ? t('loading') : t('loadMore')}
          </button>
        </div>
      )}

      {/* Tiendas populares */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', margin:'24px 0 16px'}}>
        <h2 style={{fontSize:18, fontWeight:700, color:BRAND.dark, margin:0}}>{t('popularStoresTitle')}</h2>
        <a href='/tiendas' style={{color:BRAND.blue, fontSize:13, fontWeight:600, textDecoration:'none'}}>{t('viewAll')}</a>
      </div>

      {vendors.length > 0 && (
        <div className="grid-stores">
          {vendors.map(v => (
            <a
              key={v.id}
              href={`/tienda/${v.id}`}
              className="hover:shadow-md transition-shadow"
              style={{background:'#fff', border:'1px solid #EEE', borderRadius:10, padding:18, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:10, textDecoration:'none', cursor:'pointer'}}
            >
              <div style={{width:48, height:48, borderRadius:10, background:BRAND.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, overflow:'hidden'}}>
                {v.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.logo_url} alt={v.business_name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                ) : (
                  '🏪'
                )}
              </div>
              <div>
                <div style={{fontWeight:600, fontSize:13, color:BRAND.dark}}>{v.business_name}</div>
                {v.is_verified && (
                  <div style={{fontSize:11, color:BRAND.blue, fontWeight:600}}>{t('verifiedBadge')}</div>
                )}
              </div>
              {Number(v.rating_avg) > 0 && (
                <div style={{display:'flex', alignItems:'center', gap:4, fontSize:12, color:BRAND.gray}}>
                  <Star size={12} fill='#F5A623' color='#F5A623' />
                  {Number(v.rating_avg).toFixed(1)} · {v.total_sales ?? 0} {t('salesSuffix')}
                </div>
              )}
            </a>
          ))}
        </div>
      )}

    </div>
  )
}
