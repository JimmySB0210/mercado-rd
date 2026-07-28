'use client'
// ============================================================
// MercadoRD — Crear nuevo producto (vendor)
// Ruta: src/app/dashboard/productos/nuevo/page.tsx
// ============================================================
// El formulario en sí vive en components/dashboard/ProductForm.tsx,
// compartido con la edición (app/dashboard/productos/[id]/editar).
// Esta página solo resuelve el vendorId del usuario autenticado.
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductForm } from '@/components/dashboard/ProductForm'

export default function NewProductPage() {
  const router = useRouter()
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard/productos/nuevo')
        return
      }

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!vendor) {
        router.push('/vendor/register')
        return
      }

      setVendorId(vendor.id)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading || !vendorId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return <ProductForm mode="crear" vendorId={vendorId} />
}
