// ============================================================
// MercadoRD — Queries de categorías y provincias
// Archivo: lib/queries/catalog.ts
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import type { Category, Province } from '@/types/database.types'

export async function getCategories(): Promise<Category[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  if (error) {
    console.error('[getCategories]', error)
    return []
  }

  return data ?? []
}

export async function getProvinces(): Promise<Province[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('provinces_rd')
    .select('*')
    .order('name')

  if (error) {
    console.error('[getProvinces]', error)
    return []
  }

  return data ?? []
}
