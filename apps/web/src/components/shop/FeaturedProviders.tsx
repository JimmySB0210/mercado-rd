// ============================================================
// MercadoRD — Proveedores destacados (homepage)
// Ruta: src/components/shop/FeaturedProviders.tsx
// ============================================================
// Nueva — no existía antes de la Fase 2A. Reusa search_providers()
// (mismo RPC que ya usa /proveedores) sin filtros y p_limit: 6 — ya
// ordena por verification_level DESC, rating_avg DESC por defecto,
// no hizo falta tocar el RPC.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
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

  return <FeaturedProvidersGrid providers={data as Vendor[]} />
}
