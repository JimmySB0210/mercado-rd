// ============================================================
// MercadoRD — Proveedores destacados (homepage)
// Ruta: src/components/shop/FeaturedProviders.tsx
// ============================================================
// Nueva — no existía antes de la Fase 2A. Reusa search_providers()
// (mismo RPC que ya usa /proveedores) sin filtros y p_limit: 6. El
// orden lo define el RPC: verification_level DESC y, después, la
// calificación y las ventas reales de vendor_real_stats (migración 037).
// Las cifras que se muestran salen de vendor_real_stats en lote, no de
// las columnas sembradas que también devuelve el RPC.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { getVendorRealStatsBatch } from '@/lib/queries/vendorRealStatsBatch'
import { FeaturedProvidersGrid } from '@/components/shop/FeaturedProvidersGrid'
import type { Vendor } from '@/types/database.types'

export async function FeaturedProviders() {
  const supabase = createPublicClient()

  const { data, error } = await supabase.rpc('search_providers', {
    p_business_types: null,
    p_category_ids: null,
    p_services: null,
    p_province_id: null,
    p_max_moq: null,
    p_min_verification_level: null,
    p_limit: 6,
    p_offset: 0,
  })

  if (error) console.error('[FeaturedProviders]', error)
  if (!data || data.length === 0) return null

  const providers = data as Vendor[]
  const realStats = await getVendorRealStatsBatch(providers.map(v => v.id))

  return <FeaturedProvidersGrid providers={providers} realStats={realStats} />
}
