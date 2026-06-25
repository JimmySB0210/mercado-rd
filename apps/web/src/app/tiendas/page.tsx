// ============================================================
// MercadoRD — Directorio de tiendas
// Ruta: src/app/tiendas/page.tsx
// ============================================================
// Server Component — usa createPublicClient() (sin cookies) para
// que la página quede cacheable con ISR, igual que la homepage.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'

export const revalidate = 300

export default async function TiendasPage() {
  const supabase = createPublicClient()

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, business_name, logo_url, description, province_id, is_verified, plan, rating_avg, total_sales, provinces_rd(name)')
    .order('is_verified', { ascending: false })
    .order('total_sales', { ascending: false })

  if (error) console.error('[TiendasPage]', error)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <nav className="text-sm text-gray-400 mb-4">
          <a href="/" className="hover:text-gray-600 transition-colors no-underline">Inicio</a>
          <span className="mx-2">/</span>
          <span className="text-gray-600">Tiendas</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Tiendas en MercadoRD</h1>
        <p className="text-sm text-gray-400 mb-6">
          {vendors?.length ?? 0} {(vendors?.length ?? 0) === 1 ? 'tienda activa' : 'tiendas activas'}
        </p>

        {!vendors || vendors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🏬</div>
            <p className="text-gray-500">Todavía no hay tiendas para mostrar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {vendors.map((v: any) => (
              <a
                key={v.id}
                href={`/tienda/${v.id}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center no-underline hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden flex items-center justify-center text-2xl font-bold text-gray-300 mb-3">
                  {v.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.logo_url} alt={v.business_name} className="w-full h-full object-cover" />
                  ) : (
                    v.business_name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <span className="text-sm font-semibold text-gray-900">{v.business_name}</span>
                  {v.is_verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verificado
                    </span>
                  )}
                </div>

                {v.provinces_rd && (
                  <p className="text-xs text-gray-400 mt-1">
                    📍 {(v.provinces_rd as { name: string }).name}
                  </p>
                )}

                {Number(v.rating_avg) > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs text-gray-500">{Number(v.rating_avg).toFixed(1)}</span>
                  </div>
                )}

                <span className="text-xs font-semibold text-blue-700 mt-4">
                  Ver tienda →
                </span>
              </a>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
