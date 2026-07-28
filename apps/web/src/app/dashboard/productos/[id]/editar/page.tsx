// ============================================================
// MercadoRD — Editar producto (vendor)
// Ruta: src/app/dashboard/productos/[id]/editar/page.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentVendor } from '@/lib/queries/vendor-dashboard'
import { ProductForm } from '@/components/dashboard/ProductForm'

export default async function EditProductPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=/dashboard/productos/${id}/editar`)

  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/vendor/register')

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  // Producto inexistente o de otro vendor — no se puede editar
  if (error || !product || product.vendor_id !== vendor.id) {
    redirect('/dashboard/productos')
  }

  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', id)
    .order('created_at')

  return (
    <ProductForm
      mode="editar"
      vendorId={vendor.id}
      initialData={{
        product,
        variants: variants ?? [],
        existingImages: product.images ?? [],
      }}
    />
  )
}
