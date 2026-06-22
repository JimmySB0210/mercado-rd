// ============================================================
// MercadoRD — Perfil público de tienda (vendor)
// Ruta: src/app/tienda/[id]/page.tsx
// ============================================================

import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shop/Navbar'
import { ProductCard } from '@/components/product/ProductCard'

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

  const [{ data: products }, { data: reviewsRaw }, { count: reviewCount }] = await Promise.all([
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

  const reviews = (reviewsRaw ?? []).map(r => ({
    ...r,
    buyer_name: reviewerMap.get(r.user_id) ?? 'Cliente',
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header de la tienda */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl font-bold text-gray-300">
              {vendor.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
              ) : (
                vendor.business_name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{vendor.business_name}</h1>
                {vendor.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verificado
                  </span>
                )}
              </div>

              {vendor.province && (
                <p className="text-sm text-gray-400 mt-1">
                  📍 {(vendor.province as { name: string }).name}
                </p>
              )}

              {Number(vendor.rating_avg) > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(vendor.rating_avg) ? 'text-amber-400' : 'text-gray-200'}`}
                        fill="currentColor" viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {Number(vendor.rating_avg).toFixed(1)} ({reviewCount ?? 0} {reviewCount === 1 ? 'reseña' : 'reseñas'})
                  </span>
                </div>
              )}
            </div>
          </div>

          {vendor.description && (
            <p className="text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-line">
              {vendor.description}
            </p>
          )}

          {/* Contacto */}
          <div className="flex flex-wrap gap-2 mt-4">
            {vendor.whatsapp && (
              <a
                href={`https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(`Hola, vi tu tienda ${vendor.business_name} en MercadoRD`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 border border-green-500 text-green-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-50 transition-colors no-underline"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
            {vendor.instagram && (
              <a
                href={`https://instagram.com/${vendor.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 border border-pink-400 text-pink-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-pink-50 transition-colors no-underline"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{vendor.total_sales ?? 0}</p>
              <p className="text-xs text-gray-400">Ventas totales</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 capitalize">{vendor.plan}</p>
              <p className="text-xs text-gray-400">Plan</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 capitalize">{memberSince}</p>
              <p className="text-xs text-gray-400">Miembro desde</p>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Productos {productsWithVendor.length > 0 && `(${productsWithVendor.length})`}
          </h2>
          {productsWithVendor.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-gray-500 text-sm">Esta tienda aún no tiene productos publicados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {productsWithVendor.map(p => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          )}
        </div>

        {/* Reseñas recientes */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Reseñas recientes</h2>
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="text-4xl mb-3">⭐</div>
              <p className="text-gray-500 text-sm">Esta tienda aún no tiene reseñas.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map(r => {
                const date = new Date(r.created_at).toLocaleDateString('es-DO', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                      <span className="text-sm font-semibold text-gray-900">{r.buyer_name}</span>
                      <span className="text-xs text-gray-400">{date}</span>
                    </div>
                    <div className="flex mb-1.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= r.rating ? 'text-amber-400' : 'text-gray-200'}`}
                          fill="currentColor" viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    {r.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
