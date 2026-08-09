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

import { useEffect, useState } from 'react'
import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { BRAND } from '@/lib/colors'
import { ProviderFilters } from '@/components/providers/ProviderFilters'
import { ProviderCard } from '@/components/providers/ProviderCard'
import { EMPTY_PROVIDER_FILTERS, type ProviderFiltersState } from '@/components/providers/types'
import type { Vendor, Category, BusinessType, VendorService } from '@/types/database.types'

interface ProvinceOption { id: number; name: string }

export default function ProvidersDirectoryPage() {
  const isMobile = useIsMobile(860)

  const [filters, setFilters] = useState<ProviderFiltersState>(EMPTY_PROVIDER_FILTERS)
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [results, setResults] = useState<Vendor[]>([])
  const [businessTypesByVendor, setBusinessTypesByVendor] = useState<Map<string, BusinessType[]>>(new Map())
  const [servicesByVendor, setServicesByVendor] = useState<Map<string, VendorService[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const updateFilters = (patch: Partial<ProviderFiltersState>) => setFilters(f => ({ ...f, ...patch }))

  // Provincias y categorías — una sola vez
  useEffect(() => {
    const supabase = createPublicClient()
    supabase.from('provinces_rd').select('id, name').order('name').then(({ data }) => setProvinces(data ?? []))
    supabase
      .from('categories')
      .select('id, name, slug, emoji, sort_order, parent_id')
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  // Búsqueda — se dispara con cada cambio de filtro, con un pequeño
  // debounce para que escribir en el input de MOQ no dispare una
  // llamada por cada tecla.
  useEffect(() => {
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
  }, [filters])

  const provinceNameById = new Map(provinces.map(p => [p.id, p.name]))

  const filtersPanel = (
    <ProviderFilters filters={filters} onChange={updateFilters} provinces={provinces} categories={categories} />
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div style={{ marginBottom: 20 }}>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-400 mt-1">
            Fabricantes, mayoristas y distribuidores dominicanos — filtra por lo que necesitas
          </p>
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
            ⚙️ Filtros
          </button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '260px 1fr', gap: 24, alignItems: 'start' }}>
          {!isMobile && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ position: 'sticky', top: 20 }}>
              {filtersPanel}
            </div>
          )}

          <div>
            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-gray-400 text-sm">Buscando proveedores...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500 text-sm">
                  No encontramos proveedores con esos filtros — prueba ajustando la búsqueda
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
            )}
          </div>
        </div>
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
              <span style={{ fontWeight: 700, fontSize: 16, color: BRAND.dark }}>Filtros</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Cerrar filtros"
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
                Ver resultados
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
