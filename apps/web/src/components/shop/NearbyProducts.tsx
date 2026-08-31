'use client'
// ============================================================
// MercadoRD — "Cerca de ti"
// Ruta: src/components/shop/NearbyProducts.tsx
// ============================================================
// A diferencia de las demás secciones nuevas del home, esta SÍ tiene
// que ser Client Component desde el inicio: la provincia elegida vive
// en useLocationStore (Zustand + localStorage), invisible para un
// Server Component. Si no hay provincia seleccionada, no hay señal
// real de "cerca" — la sección no se renderiza, nunca asume una
// provincia por defecto.
//
// Primero intenta vendors en la provincia exacta; si no alcanza un
// mínimo razonable, cae a la misma zona de envío (shipping_rates.zone
// — agrupación real ya usada para tarifas, no una inventada aquí).
// ============================================================

import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useLocationStore } from '@/lib/store/location'
import { createPublicClient } from '@/lib/supabase/public'
import { ProductCard } from '@/components/product/ProductCard'
import type { ProductWithVendor } from '@/types/database.types'

const MIN_EXACT_MATCH = 4
const LIMIT = 12

const SELECT = `
  id, vendor_id, category_id, province_id, name, description,
  price_rdp, compare_rdp, images, stock, sizes, colors, is_active,
  rating_avg, rating_count, sold_count, view_count, created_at, published_at,
  vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp)
`

export function NearbyProducts() {
  const { t } = useTranslation('products')
  const province = useLocationStore(s => s.province)
  const [products, setProducts] = useState<ProductWithVendor[]>([])

  useEffect(() => {
    if (!province) {
      setProducts([])
      return
    }

    let active = true
    const supabase = createPublicClient()

    const load = async () => {
      const { data: exactVendors } = await supabase
        .from('vendors')
        .select('id')
        .eq('province_id', province.id)

      const exactVendorIds = (exactVendors ?? []).map((v: any) => v.id)

      let result: any[] = []
      if (exactVendorIds.length > 0) {
        const { data } = await supabase
          .from('products')
          .select(SELECT)
          .in('vendor_id', exactVendorIds)
          .eq('is_active', true)
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(LIMIT)
        result = data ?? []
      }

      // No alcanza en la provincia exacta — caer a la misma zona de
      // envío (superset real de provincias, ya incluye la exacta).
      if (result.length < MIN_EXACT_MATCH) {
        const { data: zoneRow } = await supabase
          .from('shipping_rates')
          .select('zone')
          .eq('province_id', province.id)
          .maybeSingle()

        if (zoneRow?.zone) {
          const { data: zoneProvinces } = await supabase
            .from('shipping_rates')
            .select('province_id')
            .eq('zone', zoneRow.zone)

          const zoneProvinceIds = (zoneProvinces ?? []).map((p: any) => p.province_id)
          const { data: zoneVendors } = await supabase
            .from('vendors')
            .select('id')
            .in('province_id', zoneProvinceIds)

          const zoneVendorIds = (zoneVendors ?? []).map((v: any) => v.id)
          if (zoneVendorIds.length > 0) {
            const { data } = await supabase
              .from('products')
              .select(SELECT)
              .in('vendor_id', zoneVendorIds)
              .eq('is_active', true)
              .order('published_at', { ascending: false, nullsFirst: false })
              .limit(LIMIT)
            result = data ?? []
          }
        }
      }

      if (active) setProducts(result)
    }

    load()
    return () => { active = false }
  }, [province])

  if (!province || products.length === 0) return null

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 16px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          {t('nearbyTitle')}
        </h2>
      </div>
      <div className="grid-products">
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
