// ============================================================
// MercadoRD — Datos reales de tienda para el paso "Vista previa"
// del wizard de Configuración (lado cliente)
// Ruta: src/lib/queries/vendorStorePreviewClient.ts
// ============================================================
// Espeja (no importa) la carga de app/tienda/[id]/page.tsx -- ese es un
// Server Component (createServerClient), y el wizard de Configuración
// es 'use client' de punta a punta, así que necesita su propia versión
// con el cliente de navegador. Mismas tablas, mismas columnas
// (VENDOR_PROFILE_SELECT), mismo mapper y mismo VendorStoreData de
// salida -- la duplicación es deliberada: si cambia una consulta allí,
// cambia aquí también.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { VendorStoreData } from '@/app/tienda/[id]/VendorStoreContent'
import { VENDOR_PROFILE_SELECT, toPublicVendorProfile, type PublicCategory } from '@/lib/publicVendor'
import type { BusinessType, CustomerType, VendorService } from '@/types/database.types'

export type VendorStorePreviewData = VendorStoreData

export async function fetchVendorStorePreviewData(supabase: SupabaseClient, vendorId: string): Promise<VendorStorePreviewData | null> {
  // Es la tienda del propio vendedor: get_my_vendor, con las mismas
  // columnas públicas que la página real.
  const { data: vendorRow, error } = await supabase
    .rpc('get_my_vendor')
    .select(VENDOR_PROFILE_SELECT)
    .maybeSingle()

  if (error || !vendorRow || (vendorRow as any).id !== vendorId) return null

  const [
    { data: storeAddress },
    { data: products }, { data: reviewsRaw },
    { data: businessTypesRaw }, { data: vendorCategoriesRaw }, { data: servicesRaw }, { data: targetCustomersRaw },
    { data: faqsRaw }, { data: realStats },
  ] = await Promise.all([
    supabase.rpc('get_vendor_store_address', { p_vendor_id: vendorId }),
    supabase
      .from('products')
      .select('*, category:categories(id, name, slug, emoji), province:provinces_rd(id, name)')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false }),
    supabase.from('vendor_business_types').select('business_type').eq('vendor_id', vendorId),
    supabase.from('vendor_categories').select('category:categories(id, name, name_en, name_fr, emoji, slug)').eq('vendor_id', vendorId),
    supabase.from('vendor_services').select('service').eq('vendor_id', vendorId),
    supabase.from('vendor_target_customers').select('customer_type').eq('vendor_id', vendorId),
    supabase.from('vendor_faqs').select('id, question, answer').eq('vendor_id', vendorId).eq('is_active', true).order('sort_order', { ascending: true }),
    supabase.from('vendor_real_stats').select('real_rating_avg, real_total_sales, real_rating_count').eq('vendor_id', vendorId).maybeSingle(),
  ])

  const reviewerIds = [...new Set((reviewsRaw ?? []).map((r: any) => r.user_id))]
  const { data: reviewers } = reviewerIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', reviewerIds)
    : { data: [] as { id: string; full_name: string }[] }
  const reviewerMap = new Map((reviewers ?? []).map((u: any) => [u.id, u.full_name]))

  const vendor = toPublicVendorProfile(vendorRow as any, (storeAddress as string | null) ?? null)

  return {
    vendor,
    products: (products ?? []).map((p: any) => ({
      ...p,
      vendor: { id: vendor.id, business_name: vendor.businessName, logo_url: vendor.logoUrl, is_verified: vendor.isVerified, whatsapp: vendor.whatsapp },
    })),
    reviews: (reviewsRaw ?? []).map((r: any) => ({
      id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at, buyerName: reviewerMap.get(r.user_id) ?? null,
    })),
    realRatingAvg: realStats?.real_rating_avg ?? null,
    realTotalSales: realStats?.real_total_sales ?? 0,
    realRatingCount: realStats?.real_rating_count ?? 0,
    businessTypes: (businessTypesRaw ?? []).map((r: any) => r.business_type as BusinessType),
    categories: (vendorCategoriesRaw ?? []).map((r: any) => r.category as PublicCategory | null).filter((c): c is PublicCategory => !!c),
    services: (servicesRaw ?? []).map((r: any) => r.service as VendorService),
    targetCustomers: (targetCustomersRaw ?? []).map((r: any) => r.customer_type as CustomerType),
    faqs: (faqsRaw ?? []).map((f: any) => ({ id: f.id, question: f.question, answer: f.answer })),
  }
}
