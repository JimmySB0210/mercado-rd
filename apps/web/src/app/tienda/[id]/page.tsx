// ============================================================
// MercadoRD — Perfil público de tienda (vendor)
// Ruta: src/app/tienda/[id]/page.tsx
// ============================================================
// Server Component — el texto traducido vive en VendorStoreContent
// (Client Component).
// ============================================================

import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shop/Navbar'
import { VendorStoreContent } from './VendorStoreContent'
import type { BusinessType, CustomerType, VendorService } from '@/types/database.types'

export default async function VendorStorePage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*, province:provinces_rd(name)')
    .eq('id', id)
    .single()

  if (error || !vendor) notFound()

  const [
    { data: products }, { data: reviewsRaw }, { count: reviewCount },
    { data: businessTypesRaw }, { data: vendorCategoriesRaw }, { data: servicesRaw }, { data: targetCustomersRaw },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(id, name, slug, emoji), province:provinces_rd(id, name)')
      .eq('vendor_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id')
      .eq('vendor_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', id),
    supabase.from('vendor_business_types').select('business_type').eq('vendor_id', id),
    supabase.from('vendor_categories').select('category_id, category:categories(id, name, emoji, slug)').eq('vendor_id', id),
    supabase.from('vendor_services').select('service').eq('vendor_id', id),
    supabase.from('vendor_target_customers').select('customer_type').eq('vendor_id', id),
  ])

  // Nombres de compradores — consulta separada (no embebida). users tiene
  // RLS restrictivo (solo el propio usuario o un admin), así que embeber
  // user:users(full_name) aquí vaciaría la fila completa para cualquier
  // visitante anónimo, igual que el bug que ya arreglamos en confirm/page.tsx.
  const reviewerIds = [...new Set((reviewsRaw ?? []).map(r => r.user_id))]
  const { data: reviewers } = reviewerIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', reviewerIds)
    : { data: [] as { id: string; full_name: string }[] }

  const reviewerMap = new Map((reviewers ?? []).map(u => [u.id, u.full_name]))

  // El fallback de nombre ("Cliente") se resuelve traducido dentro de
  // VendorStoreContent — aquí solo se pasa null si no hay nombre.
  const reviews = (reviewsRaw ?? []).map(r => ({
    ...r,
    buyer_name: reviewerMap.get(r.user_id) ?? null,
  }))

  // Adjuntar el vendor (subset que espera ProductCard) a cada producto
  const productsWithVendor = (products ?? []).map(p => ({
    ...p,
    vendor: {
      id: vendor.id,
      business_name: vendor.business_name,
      logo_url: vendor.logo_url,
      is_verified: vendor.is_verified,
      rating_avg: vendor.rating_avg,
      whatsapp: vendor.whatsapp,
    },
  }))

  const memberSince = new Date(vendor.created_at).toLocaleDateString('es-DO', {
    month: 'long', year: 'numeric',
  })

  const businessTypes = (businessTypesRaw ?? []).map(r => r.business_type as BusinessType)
  const vendorCategories = (vendorCategoriesRaw ?? [])
    .map(r => r.category as unknown as { id: number; name: string; emoji: string; slug: string } | null)
    .filter((c): c is { id: number; name: string; emoji: string; slug: string } => !!c)
  const services = (servicesRaw ?? []).map(r => r.service as VendorService)
  const targetCustomers = (targetCustomersRaw ?? []).map(r => r.customer_type as CustomerType)

  const showsManufacturing = !!vendor.manufacturing_status

  const hasProviderInfo = businessTypes.length > 0 || vendorCategories.length > 0 || showsManufacturing
    || services.length > 0 || targetCustomers.length > 0 || !!vendor.min_order_quantity

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <VendorStoreContent
        vendor={vendor as any}
        productsWithVendor={productsWithVendor}
        reviews={reviews as any}
        reviewCount={reviewCount ?? 0}
        businessTypes={businessTypes}
        vendorCategories={vendorCategories}
        services={services}
        targetCustomers={targetCustomers}
        showsManufacturing={showsManufacturing}
        hasProviderInfo={hasProviderInfo}
        memberSince={memberSince}
      />
    </div>
  )
}
