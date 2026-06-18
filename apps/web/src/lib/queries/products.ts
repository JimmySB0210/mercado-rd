// ============================================================
// MercadoRD — Queries de productos
// Archivo: lib/queries/products.ts
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import type { ProductWithVendor } from '@/types/database.types'

// ─── Productos para la homepage (más vendidos) ────────────────────────────────
export async function getFeaturedProducts(limit = 12): Promise<ProductWithVendor[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
      category:categories(id, name, slug, emoji),
      province:provinces_rd(id, name)
    `)
    .eq('is_active', true)
    .gt('stock', 0)
    .order('sold_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getFeaturedProducts]', error)
    return []
  }

  return (data as ProductWithVendor[]) ?? []
}

// ─── Productos por categoría ───────────────────────────────────────────────────
export async function getProductsByCategory(
  slug: string,
  limit = 24
): Promise<ProductWithVendor[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
      category:categories!inner(id, name, slug, emoji),
      province:provinces_rd(id, name)
    `)
    .eq('is_active', true)
    .eq('categories.slug', slug)
    .gt('stock', 0)
    .order('sold_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getProductsByCategory]', error)
    return []
  }

  return (data as ProductWithVendor[]) ?? []
}

// ─── Detalle de un producto ─────────────────────────────────────────────────────
export async function getProductById(id: string): Promise<ProductWithVendor | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
      category:categories(id, name, slug, emoji),
      province:provinces_rd(id, name)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('[getProductById]', error)
    return null
  }

  // Incrementar vistas en background (no bloqueante)
  supabase.rpc('increment_product_views', { product_id: id }).then(() => {})

  return data as ProductWithVendor
}

// ─── Búsqueda por texto (usa pg_trgm) ────────────────────────────────────────
export async function searchProducts(
  query: string,
  limit = 24
): Promise<ProductWithVendor[]> {
  if (!query || query.trim().length < 2) return []

  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
      category:categories(id, name, slug, emoji),
      province:provinces_rd(id, name)
    `)
    .eq('is_active', true)
    .gt('stock', 0)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('sold_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[searchProducts]', error)
    return []
  }

  return (data as ProductWithVendor[]) ?? []
}

// ─── Productos del mismo vendor ───────────────────────────────────────────────
export async function getVendorProducts(
  vendorId: string,
  limit = 8
): Promise<ProductWithVendor[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
      category:categories(id, name, slug, emoji),
      province:provinces_rd(id, name)
    `)
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getVendorProducts]', error)
    return []
  }

  return (data as ProductWithVendor[]) ?? []
}

// ─── Nuevos productos ─────────────────────────────────────────────────────────
export async function getNewProducts(limit = 8): Promise<ProductWithVendor[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp),
      category:categories(id, name, slug, emoji),
      province:provinces_rd(id, name)
    `)
    .eq('is_active', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getNewProducts]', error)
    return []
  }

  return (data as ProductWithVendor[]) ?? []
}
