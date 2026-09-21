'use client'
// ============================================================
// MercadoRD — "Basado en lo que viste"
// Ruta: src/components/shop/RecommendedProducts.tsx
// ============================================================
// Recomendaciones personalizadas con get_recommended_products (Supabase,
// SECURITY DEFINER, usa auth.uid()): toma el historial real de productos
// vistos (mínimo 3 para intentar personalizar), sus 3 categorías más
// vistas, y devuelve productos activos de esas categorías que todavía no
// vio, ordenados por sold_count. Sin sesión, con poco historial o si ya
// vio todo lo de sus categorías devuelve vacío.
//
// Client Component por necesidad, como NearbyProducts: el home es ISR
// (revalidate = 300), así que ninguna parte de esta página puede depender
// de quién la mira — la sesión solo existe en el navegador. Un Server
// Component acá rompería el ISR o, peor, cachearía las recomendaciones de
// una persona para todas las demás.
//
// Se oculta sola (return null) — sin mensaje vacío, sin placeholder, sin
// esqueleto de carga — cuando no hay sesión, la función devuelve vacío o
// algo falla. Nunca se rellena con productos que no vinieron de la función.
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HomeProductSection } from '@/components/shop/HomeProductSection'
import type { ProductWithVendor } from '@/types/database.types'

// 12 = dos filas completas del grid de 6 columnas, igual que las demás
// secciones (recién publicados, cerca de ti)
const LIMIT = 12

// La función devuelve filas planas de products (SETOF products), sin el
// vendor que ProductCard necesita — se hidratan aparte con el mismo
// select que usan las demás secciones del home.
const SELECT = `
  id, vendor_id, category_id, province_id, name, description,
  price_rdp, compare_rdp, images, stock, sizes, colors, is_active,
  rating_avg, rating_count, sold_count, view_count, created_at, published_at,
  vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp)
`

export function RecommendedProducts() {
  const [userId, setUserId] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductWithVendor[]>([])

  // Solo el id de la sesión (useAuth además carga el perfil completo en
  // cada montaje, innecesario acá). onAuthStateChange emite la sesión
  // inicial sin pedir nada a la red — un visitante anónimo no genera
  // ninguna petición — y sigue cambios en vivo: al cerrar sesión desde
  // el Navbar la sección desaparece sin recargar. Acá solo se guarda el
  // id; las consultas van en el efecto de abajo (llamar a Supabase dentro
  // de este callback puede dejar el cliente esperándose a sí mismo).
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) {
      setProducts([])
      return
    }

    let active = true
    const supabase = createClient()

    const load = async () => {
      const { data: recommended, error } = await supabase.rpc('get_recommended_products', { p_limit: LIMIT })
      if (error) {
        console.error('[RecommendedProducts]', error)
        if (active) setProducts([])
        return
      }

      const ids: string[] = (recommended ?? []).map((p: { id: string }) => p.id)
      if (ids.length === 0) {
        if (active) setProducts([])
        return
      }

      const { data: hydrated, error: hydrateError } = await supabase
        .from('products')
        .select(SELECT)
        .in('id', ids)

      if (hydrateError) {
        console.error('[RecommendedProducts] hydrate', hydrateError)
        if (active) setProducts([])
        return
      }

      // La función ya los ordenó (más vendidos primero); .in() no garantiza orden
      const position = new Map(ids.map((id, i) => [id, i]))
      const sorted = ((hydrated ?? []) as unknown as ProductWithVendor[])
        .sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0))

      if (active) setProducts(sorted)
    }

    load()
    return () => { active = false }
  }, [userId])

  if (products.length === 0) return null

  return <HomeProductSection titleKey="recommendedTitle" products={products} />
}
