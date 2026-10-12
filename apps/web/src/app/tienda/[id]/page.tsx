// ============================================================
// MercadoRD — Perfil público de tienda (vendor)
// Ruta: src/app/tienda/[id]/page.tsx
// ============================================================
// Server Component — el texto traducido vive en VendorStoreContent
// (Client Component), que solo recibe VendorStoreData: el vendor ya
// pasado por toPublicVendorProfile (columnas explícitas, sin datos
// privados) y reseñas sin user_id.
//
// lib/queries/vendorStorePreviewClient.ts repite esta misma carga con
// el cliente de navegador para el paso 9 del asistente. La duplicación
// es a propósito: si cambia una consulta aquí, cambia allí también.
// ============================================================

import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shop/Navbar'
import { VendorStoreContent, type VendorStoreData } from './VendorStoreContent'
import { VENDOR_PROFILE_SELECT, toPublicVendorProfile, type PublicCategory } from '@/lib/publicVendor'
import type { BusinessType, CustomerType, VendorService } from '@/types/database.types'

export default async function VendorStorePage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: vendorRow, error } = await supabase
    .from('vendors')
    .select(VENDOR_PROFILE_SELECT)
    .eq('id', id)
    .single()

  if (error || !vendorRow) notFound()

  const [
    { data: storeAddress },
    { data: products }, { data: reviewsRaw },
    { data: businessTypesRaw }, { data: vendorCategoriesRaw }, { data: servicesRaw }, { data: targetCustomersRaw },
    { data: faqsRaw }, { data: realStats },
  ] = await Promise.all([
    // address es privada: solo esta RPC la devuelve, y solo con tienda física.
    supabase.rpc('get_vendor_store_address', { p_vendor_id: id }),
    supabase
      .from('products')
      .select('*, category:categories(id, name, slug, emoji), province:provinces_rd(id, name)')
      .eq('vendor_id', id)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),
    // Misma consulta que ProductReviews.tsx, por tienda en vez de por producto.
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id')
      .eq('vendor_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('vendor_business_types').select('business_type').eq('vendor_id', id),
    supabase.from('vendor_categories').select('category:categories(id, name, name_en, name_fr, emoji, slug)').eq('vendor_id', id),
    supabase.from('vendor_services').select('service').eq('vendor_id', id),
    supabase.from('vendor_target_customers').select('customer_type').eq('vendor_id', id),
    supabase.from('vendor_faqs').select('id, question, answer').eq('vendor_id', id).eq('is_active', true).order('sort_order', { ascending: true }),
    // vendor_real_stats, nunca columnas sembradas.
    supabase.from('vendor_real_stats').select('real_rating_avg, real_total_sales, real_rating_count').eq('vendor_id', id).maybeSingle(),
  ])

  // Nombres de compradores — consulta separada (no embebida), igual que
  // ProductReviews.tsx: users tiene RLS restrictivo, así que para un
  // visitante el nombre llega null y se muestra el genérico.
  const reviewerIds = [...new Set((reviewsRaw ?? []).map(r => r.user_id))]
  const { data: reviewers } = reviewerIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', reviewerIds)
    : { data: [] as { id: string; full_name: string }[] }
  const reviewerMap = new Map((reviewers ?? []).map(u => [u.id, u.full_name]))

  const vendor = toPublicVendorProfile(vendorRow as any, (storeAddress as string | null) ?? null)

  const data: VendorStoreData = {
    vendor,
    products: (products ?? []).map(p => ({
      ...p,
      vendor: { id: vendor.id, business_name: vendor.businessName, logo_url: vendor.logoUrl, is_verified: vendor.isVerified, whatsapp: vendor.whatsapp },
    })),
    reviews: (reviewsRaw ?? []).map(r => ({
      id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at, buyerName: reviewerMap.get(r.user_id) ?? null,
    })),
    realRatingAvg: realStats?.real_rating_avg ?? null,
    realTotalSales: realStats?.real_total_sales ?? 0,
    realRatingCount: realStats?.real_rating_count ?? 0,
    businessTypes: (businessTypesRaw ?? []).map(r => r.business_type as BusinessType),
    categories: (vendorCategoriesRaw ?? []).map(r => r.category as unknown as PublicCategory | null).filter((c): c is PublicCategory => !!c),
    services: (servicesRaw ?? []).map(r => r.service as VendorService),
    targetCustomers: (targetCustomersRaw ?? []).map(r => r.customer_type as CustomerType),
    faqs: (faqsRaw ?? []).map(f => ({ id: f.id, question: f.question, answer: f.answer })),
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)]">
      <Navbar />
      <VendorStoreContent data={data} />
    </div>
  )
}
