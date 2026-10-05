// ============================================================
// MercadoRD — Datos reales de tienda para el paso "Vista previa"
// del wizard de Configuración (lado cliente)
// Ruta: src/lib/queries/vendorStorePreviewClient.ts
// ============================================================
// Espeja (no importa) el mismo Promise.all de app/tienda/[id]/page.tsx
// -- ese es un Server Component (createServerClient), y el wizard de
// Configuración es 'use client' de punta a punta, así que necesita su
// propia versión con el cliente de navegador. Mismas tablas, mismos
// filtros, mismo shape de salida -- la duplicación es deliberada, no
// un atajo (ver plan de implementación).
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { BusinessType, CustomerType, VendorService } from '@/types/database.types'

export interface VendorStorePreviewData {
  vendor: any
  productsWithVendor: any[]
  reviews: any[]
  realRatingAvg: number | null
  realTotalSales: number
  realRatingCount: number
  businessTypes: BusinessType[]
  vendorCategories: { id: number; name: string; name_en: string; name_fr: string; emoji: string; slug: string }[]
  services: VendorService[]
  targetCustomers: CustomerType[]
  showsManufacturing: boolean
  hasProviderInfo: boolean
  memberSinceRaw: string
}

export async function fetchVendorStorePreviewData(supabase: SupabaseClient, vendorId: string): Promise<VendorStorePreviewData | null> {
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*, province:provinces_rd(name)')
    .eq('id', vendorId)
    .single()

  if (error || !vendor) return null

  const [
    { data: products }, { data: reviewsRaw },
    { data: businessTypesRaw }, { data: vendorCategoriesRaw }, { data: servicesRaw }, { data: targetCustomersRaw },
    { data: realStats },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(id, name, slug, emoji), province:provinces_rd(id, name)')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('vendor_business_types').select('business_type').eq('vendor_id', vendorId),
    supabase.from('vendor_categories').select('category_id, category:categories(id, name, name_en, name_fr, emoji, slug)').eq('vendor_id', vendorId),
    supabase.from('vendor_services').select('service').eq('vendor_id', vendorId),
    supabase.from('vendor_target_customers').select('customer_type').eq('vendor_id', vendorId),
    supabase.from('vendor_real_stats').select('real_rating_avg, real_total_sales, real_rating_count').eq('vendor_id', vendorId).maybeSingle(),
  ])

  const reviewerIds = [...new Set((reviewsRaw ?? []).map((r: any) => r.user_id))]
  const { data: reviewers } = reviewerIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', reviewerIds)
    : { data: [] as { id: string; full_name: string }[] }

  const reviewerMap = new Map((reviewers ?? []).map((u: any) => [u.id, u.full_name]))

  const reviews = (reviewsRaw ?? []).map((r: any) => ({
    ...r,
    buyer_name: reviewerMap.get(r.user_id) ?? null,
  }))

  const productsWithVendor = (products ?? []).map((p: any) => ({
    ...p,
    vendor: {
      id: vendor.id,
      business_name: vendor.business_name,
      logo_url: vendor.logo_url,
      is_verified: vendor.is_verified,
      whatsapp: vendor.whatsapp,
    },
  }))

  const businessTypes = (businessTypesRaw ?? []).map((r: any) => r.business_type as BusinessType)
  const vendorCategories = (vendorCategoriesRaw ?? [])
    .map((r: any) => r.category as { id: number; name: string; name_en: string; name_fr: string; emoji: string; slug: string } | null)
    .filter((c: any): c is { id: number; name: string; name_en: string; name_fr: string; emoji: string; slug: string } => !!c)
  const services = (servicesRaw ?? []).map((r: any) => r.service as VendorService)
  const targetCustomers = (targetCustomersRaw ?? []).map((r: any) => r.customer_type as CustomerType)

  const showsManufacturing = !!vendor.manufacturing_status

  const hasProviderInfo = businessTypes.length > 0 || vendorCategories.length > 0 || showsManufacturing
    || services.length > 0 || targetCustomers.length > 0 || !!vendor.min_order_quantity

  return {
    vendor,
    productsWithVendor,
    reviews,
    realRatingAvg: realStats?.real_rating_avg ?? null,
    realTotalSales: realStats?.real_total_sales ?? 0,
    realRatingCount: realStats?.real_rating_count ?? 0,
    businessTypes,
    vendorCategories,
    services,
    targetCustomers,
    showsManufacturing,
    hasProviderInfo,
    memberSinceRaw: vendor.created_at,
  }
}
