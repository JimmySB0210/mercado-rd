'use client'
// ============================================================
// MercadoRD — Directorio de búsqueda de proveedores
// Ruta: src/app/proveedores/page.tsx
// ============================================================
// Client Component: cada cambio de filtro llama a search_providers()
// vía createPublicClient(). Los chips de tipo de negocio/servicios de
// cada tarjeta se arman con un fetch aparte (WHERE vendor_id IN (...))
// para no tener que tocar el RPC.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useHasVariantsMap } from '@/lib/hooks/useHasVariantsMap'
import { BRAND } from '@/lib/colors'
import { ProviderFilters } from '@/components/providers/ProviderFilters'
import { ProviderCard } from '@/components/providers/ProviderCard'
import { ProductCard, type ProductCardPricingTier } from '@/components/product/ProductCard'
import { EMPTY_PROVIDER_FILTERS, type ProviderFiltersState } from '@/components/providers/types'
import type { Vendor, Category, BusinessType, VendorService, ProductWithVendor } from '@/types/database.types'

interface ProvinceOption { id: number; name: string }

const PRODUCTS_PAGE_SIZE = 24

// Mismo join que /buscar (buscar/page.tsx, SearchResultsGrid.tsx) — el
// RPC search_products devuelve SETOF products sin relaciones; esta
// consulta trae vendor/category/province para hidratar ProductCard.
const PRODUCT_HYDRATE_SELECT = `
  *,
  vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
  category:categories(id, name, slug, emoji),
  province:provinces_rd(id, name)
`

export default function ProvidersDirectoryPage() {
  const isMobile = useIsMobile(860)
  const { t } = useTranslation('directory')
  const { t: tp } = useTranslation('products')

  const [activeTab, setActiveTab] = useState<'tiendas' | 'productos'>('tiendas')
  const [filters, setFilters] = useState<ProviderFiltersState>(EMPTY_PROVIDER_FILTERS)
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [results, setResults] = useState<Vendor[]>([])
  const [businessTypesByVendor, setBusinessTypesByVendor] = useState<Map<string, BusinessType[]>>(new Map())
  const [servicesByVendor, setServicesByVendor] = useState<Map<string, VendorService[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // ─── Pestaña "Productos" — mismo directorio, filtrando product_status
  // real en vez de vendors (search_products, extendido con los mismos 6
  // filtros que search_providers ya soporta para vendors) ───
  const [productResults, setProductResults] = useState<ProductWithVendor[]>([])
  const [pricingTiersByProduct, setPricingTiersByProduct] = useState<Map<string, ProductCardPricingTier[]>>(new Map())
  const [productLoading, setProductLoading] = useState(true)
  const [productOffset, setProductOffset] = useState(0)
  const [productHasMore, setProductHasMore] = useState(false)
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false)
  const variantsById = useHasVariantsMap(productResults.map(p => p.id))

  // Cuántos productos van en la grilla "de arriba" (4 columnas, junto al
  // sidebar de filtros) antes de pasar a la grilla de ancho completo (6
  // columnas, igual que home/búsqueda) -- se recalcula con la altura
  // real del sidebar (varía según cuántas categorías/servicios carguen),
  // no un número fijo a ojo.
  const filtersSidebarRef = useRef<HTMLDivElement>(null)
  const [topGridProductCount, setTopGridProductCount] = useState(8)

  useEffect(() => {
    const el = filtersSidebarRef.current
    if (!el) return
    // Alto real de una fila de ProductCard (imagen cuadrada + info +
    // CTA) a 4 columnas, medido en vivo contra el componente real
    // (Playwright, viewport 1440px) -- no hay forma de medirlo antes de
    // que la fila exista, así que sigue siendo una aproximación (varía
    // un poco con badges/tramos de precio), pero calibrada contra el
    // dato real en vez de una cifra a ojo.
    const ROW_HEIGHT_ESTIMATE = 481
    const measure = () => {
      const rows = Math.max(1, Math.round(el.getBoundingClientRect().height / ROW_HEIGHT_ESTIMATE))
      setTopGridProductCount(rows * 4)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const updateFilters = (patch: Partial<ProviderFiltersState>) => setFilters(f => ({ ...f, ...patch }))

  // Provincias y categorías — una sola vez
  useEffect(() => {
    const supabase = createPublicClient()
    supabase.from('provinces_rd').select('id, name').order('name').then(({ data }) => setProvinces(data ?? []))
    supabase
      .from('categories')
      .select('id, name, name_en, name_fr, slug, emoji, sort_order, parent_id, requires_age_confirmation')
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  // Búsqueda de tiendas — se dispara con cada cambio de filtro (solo en
  // la pestaña "tiendas"), con un pequeño debounce para que escribir en
  // el input de MOQ no dispare una llamada por cada tecla.
  useEffect(() => {
    if (activeTab !== 'tiendas') return
    const supabase = createPublicClient()
    setLoading(true)

    const timeout = setTimeout(async () => {
      const { data: vendors, error } = await supabase.rpc('search_providers', {
        p_business_types: filters.businessTypes.length > 0 ? filters.businessTypes : null,
        p_category_ids: filters.categoryIds.length > 0 ? filters.categoryIds : null,
        p_services: filters.services.length > 0 ? filters.services : null,
        p_province_id: filters.provinceId ? Number(filters.provinceId) : null,
        p_max_moq: filters.maxMoq ? Number(filters.maxMoq) : null,
        p_min_verification_level: filters.minVerificationLevel ? Number(filters.minVerificationLevel) : null,
        p_limit: 30,
        p_offset: 0,
      })

      if (error) {
        console.error('[ProvidersDirectoryPage] search_providers', error)
        setResults([])
        setLoading(false)
        return
      }

      const vendorList = (vendors ?? []) as Vendor[]
      setResults(vendorList)

      const vendorIds = vendorList.map(v => v.id)
      if (vendorIds.length === 0) {
        setBusinessTypesByVendor(new Map())
        setServicesByVendor(new Map())
        setLoading(false)
        return
      }

      const [{ data: businessTypesRows }, { data: servicesRows }] = await Promise.all([
        supabase.from('vendor_business_types').select('vendor_id, business_type').in('vendor_id', vendorIds),
        supabase.from('vendor_services').select('vendor_id, service').in('vendor_id', vendorIds),
      ])

      const btMap = new Map<string, BusinessType[]>()
      for (const row of businessTypesRows ?? []) {
        const list = btMap.get(row.vendor_id) ?? []
        list.push(row.business_type)
        btMap.set(row.vendor_id, list)
      }
      setBusinessTypesByVendor(btMap)

      const svcMap = new Map<string, VendorService[]>()
      for (const row of servicesRows ?? []) {
        const list = svcMap.get(row.vendor_id) ?? []
        list.push(row.service)
        svcMap.set(row.vendor_id, list)
      }
      setServicesByVendor(svcMap)

      setLoading(false)
    }, 350)

    return () => clearTimeout(timeout)
  }, [filters, activeTab])

  // Mismos 6 filtros que search_providers, en los parámetros que
  // search_products acepta hoy — p_category_id es singular (a
  // diferencia de p_category_ids en search_providers), así que con
  // varias categorías seleccionadas solo se aplica la primera; el resto
  // de filtros no tiene esa limitación.
  const buildProductRpcParams = (offset: number) => ({
    p_category_id: filters.categoryIds.length > 0 ? filters.categoryIds[0] : null,
    p_province_id: filters.provinceId ? Number(filters.provinceId) : null,
    p_business_types: filters.businessTypes.length > 0 ? filters.businessTypes : null,
    p_services: filters.services.length > 0 ? filters.services : null,
    p_max_moq: filters.maxMoq ? Number(filters.maxMoq) : null,
    p_min_verification_level: filters.minVerificationLevel ? Number(filters.minVerificationLevel) : null,
    p_limit: PRODUCTS_PAGE_SIZE,
    p_offset: offset,
  })

  // product_pricing_tiers para los productos de la página actual — una
  // sola consulta batched (mismo patrón que businessTypesByVendor /
  // servicesByVendor más arriba), nunca una por tarjeta.
  const fetchPricingTiers = async (supabase: ReturnType<typeof createPublicClient>, productIds: string[]) => {
    if (productIds.length === 0) return new Map<string, ProductCardPricingTier[]>()
    const { data } = await supabase
      .from('product_pricing_tiers')
      .select('id, product_id, min_quantity, max_quantity, price_rdp, unit_label')
      .in('product_id', productIds)
      .order('min_quantity', { ascending: true })

    const map = new Map<string, ProductCardPricingTier[]>()
    for (const row of data ?? []) {
      const list = map.get(row.product_id) ?? []
      list.push(row)
      map.set(row.product_id, list)
    }
    return map
  }

  // Búsqueda de productos — mismo debounce, solo en la pestaña
  // "productos". search_products devuelve SETOF products (sin
  // relaciones); se hidrata con el mismo join que /buscar y se
  // preserva el orden del RPC (.in() no lo garantiza).
  useEffect(() => {
    if (activeTab !== 'productos') return
    const supabase = createPublicClient()
    setProductLoading(true)

    const timeout = setTimeout(async () => {
      const { data: rawProducts, error } = await supabase.rpc('search_products', buildProductRpcParams(0))

      if (error) {
        console.error('[ProvidersDirectoryPage] search_products', error)
        setProductResults([])
        setPricingTiersByProduct(new Map())
        setProductLoading(false)
        return
      }

      const ids = (rawProducts ?? []).map((p: { id: string }) => p.id)
      setProductHasMore(ids.length === PRODUCTS_PAGE_SIZE)

      if (ids.length === 0) {
        setProductResults([])
        setPricingTiersByProduct(new Map())
        setProductOffset(0)
        setProductLoading(false)
        return
      }

      const [{ data: hydrated }, tiersMap] = await Promise.all([
        supabase.from('products').select(PRODUCT_HYDRATE_SELECT).in('id', ids),
        fetchPricingTiers(supabase, ids),
      ])

      const orderMap = new Map<string, number>(ids.map((id: string, i: number) => [id, i]))
      const sorted = (hydrated ?? []).sort(
        (a: { id: string }, b: { id: string }) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
      )

      setProductResults(sorted as unknown as ProductWithVendor[])
      setPricingTiersByProduct(tiersMap)
      setProductOffset(PRODUCTS_PAGE_SIZE)
      setProductLoading(false)
    }, 350)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeTab])

  const handleLoadMoreProducts = async () => {
    if (loadingMoreProducts || !productHasMore) return
    setLoadingMoreProducts(true)

    const supabase = createPublicClient()
    const { data: rawProducts, error } = await supabase.rpc('search_products', buildProductRpcParams(productOffset))

    if (error || !rawProducts) {
      console.error('[ProvidersDirectoryPage] search_products (load more)', error)
      setLoadingMoreProducts(false)
      return
    }

    setProductHasMore(rawProducts.length === PRODUCTS_PAGE_SIZE)
    const ids = rawProducts.map((p: { id: string }) => p.id)

    if (ids.length === 0) {
      setLoadingMoreProducts(false)
      return
    }

    const [{ data: hydrated }, tiersMap] = await Promise.all([
      supabase.from('products').select(PRODUCT_HYDRATE_SELECT).in('id', ids),
      fetchPricingTiers(supabase, ids),
    ])

    const orderMap = new Map<string, number>(ids.map((id: string, i: number) => [id, i]))
    const sorted = (hydrated ?? []).sort(
      (a: { id: string }, b: { id: string }) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
    )

    setProductResults(prev => [...prev, ...(sorted as unknown as ProductWithVendor[])])
    setPricingTiersByProduct(prev => new Map([...prev, ...tiersMap]))
    setProductOffset(prev => prev + PRODUCTS_PAGE_SIZE)
    setLoadingMoreProducts(false)
  }

  const provinceNameById = new Map(provinces.map(p => [p.id, p.name]))

  const filtersPanel = (
    <ProviderFilters filters={filters} onChange={updateFilters} provinces={provinces} categories={categories} />
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* maxWidth 1400 + padding 24px -- igual que el contenedor del
          Navbar (Desktop row / Category bar) -- para que "Proveedores"
          y el filtro queden exactamente a la par del logo MercadoRD,
          no un contenedor más angosto (max-w-7xl = 1280px) centrado
          aparte, que los corría hacia la derecha. */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '8px 24px 32px' }}>
        <div style={{ marginBottom: 8 }}>
          <h1 className="text-2xl font-bold text-gray-900">{t('providersPageTitle')}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {t('providersPageSubtitle')}
          </p>
        </div>

        {/* Tiendas / Productos — mismo panel de filtros para ambas
            pestañas (filtersPanel más abajo), solo cambia qué se
            busca y cómo se renderiza el resultado. */}
        <div className="flex gap-1 border-b border-gray-200" style={{ marginBottom: 20 }} role="tablist">
          {(['tiendas', 'productos'] as const).map(tab => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2.5 text-sm font-semibold bg-transparent border-none cursor-pointer"
                style={{
                  color: isActive ? BRAND.blue : BRAND.gray,
                  borderBottom: isActive ? `2px solid ${BRAND.blue}` : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {tab === 'tiendas' ? t('storesTabLabel') : t('productsTabLabel')}
              </button>
            )
          })}
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #E0E0E0',
              borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, color: BRAND.dark,
              marginBottom: 16, cursor: 'pointer',
            }}
          >
            {t('mobileFiltersButton')}
          </button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '260px 1fr', gap: 24, alignItems: 'start' }}>
          {!isMobile && (
            <div ref={filtersSidebarRef} className="bg-white rounded-2xl border border-gray-100 p-5" style={{ position: 'sticky', top: 20 }}>
              {filtersPanel}
            </div>
          )}

          <div>
            {activeTab === 'tiendas' ? (
              loading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <p className="text-gray-400 text-sm">{t('searchingProviders')}</p>
                </div>
              ) : results.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-gray-500 text-sm">
                    {t('noProvidersFound')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map(vendor => (
                    <ProviderCard
                      key={vendor.id}
                      vendor={vendor}
                      provinceName={vendor.province_id ? provinceNameById.get(vendor.province_id) ?? null : null}
                      businessTypes={businessTypesByVendor.get(vendor.id) ?? []}
                      services={servicesByVendor.get(vendor.id) ?? []}
                    />
                  ))}
                </div>
              )
            ) : productLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-gray-400 text-sm">{t('searchingProducts')}</p>
              </div>
            ) : productResults.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 text-sm">
                  {t('noProductsFoundDirectory')}
                </p>
              </div>
            ) : (
              // Solo los primeros N (misma altura que el sidebar, a 4
              // columnas) van acá adentro del grid de 260px+1fr — el
              // resto se renderiza más abajo, fuera de ese grid, a todo
              // el ancho de la página.
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {productResults.slice(0, topGridProductCount).map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    hasVariants={variantsById.get(product.id)}
                    pricingTiers={pricingTiersByProduct.get(product.id) ?? []}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resto de los productos — ya no compite por espacio con el
            sidebar, así que usa el mismo formato de 6 columnas que
            home/búsqueda (SearchResultsGrid.tsx) en vez de las 4 de
            arriba. */}
        {activeTab === 'productos' && !productLoading && productResults.length > topGridProductCount && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" style={{ marginTop: 16 }}>
            {productResults.slice(topGridProductCount).map(product => (
              <ProductCard
                key={product.id}
                product={product}
                hasVariants={variantsById.get(product.id)}
                pricingTiers={pricingTiersByProduct.get(product.id) ?? []}
              />
            ))}
          </div>
        )}

        {activeTab === 'productos' && productHasMore && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={handleLoadMoreProducts}
              disabled={loadingMoreProducts}
              style={{ background: BRAND.blue }}
              className="text-white rounded-lg px-7 py-3 text-sm font-semibold disabled:opacity-70 disabled:cursor-wait border-none cursor-pointer"
            >
              {loadingMoreProducts ? tp('loading') : tp('loadMore')}
            </button>
          </div>
        )}
      </div>

      {/* Drawer de filtros — mobile */}
      {isMobile && (
        <>
          <div
            onClick={() => setMobileFiltersOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199,
              opacity: mobileFiltersOpen ? 1 : 0,
              pointerEvents: mobileFiltersOpen ? 'auto' : 'none',
              transition: 'opacity 0.3s ease',
            }}
          />
          <div
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, width: 300, maxWidth: '85vw',
              background: '#fff', zIndex: 200, boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
              transform: `translateX(${mobileFiltersOpen ? '0' : '-100%'})`,
              transition: 'transform 0.3s ease',
              display: 'flex', flexDirection: 'column', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #eee', flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: BRAND.dark }}>{t('filtersDrawerTitle')}</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label={t('closeFiltersAria')}
                style={{ background: 'transparent', border: 'none', color: BRAND.gray, fontSize: 20, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 20 }}>
              {filtersPanel}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  width: '100%', background: BRAND.blue, color: '#fff', border: 'none', padding: 12,
                  borderRadius: 8, fontWeight: 700, fontSize: 14, marginTop: 20, cursor: 'pointer',
                }}
              >
                {t('viewResultsButton')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
