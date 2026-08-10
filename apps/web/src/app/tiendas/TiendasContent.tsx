'use client'
// ============================================================
// MercadoRD — Contenido traducido de /tiendas
// Ruta: src/app/tiendas/TiendasContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase, cacheable
// con ISR) y no puede usar useTranslation (hook de cliente). Este
// componente recibe los vendors ya resueltos como prop y se encarga de
// todo el texto traducido.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'

interface VendorRow {
  id: string
  business_name: string
  logo_url: string | null
  is_verified: boolean
  rating_avg: number | null
  provinces_rd: { name: string } | null
}

export function TiendasContent({ vendors }: { vendors: VendorRow[] }) {
  const { t } = useTranslation('directory')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <nav className="text-sm text-gray-400 mb-4">
        <a href="/" className="hover:text-gray-600 transition-colors no-underline">{t('breadcrumbHome')}</a>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{t('breadcrumbStores')}</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900 mb-1">{t('storesPageTitle')}</h1>
      <p className="text-sm text-gray-400 mb-6">
        {vendors.length} {vendors.length === 1 ? t('activeStoreSingular') : t('activeStorePlural')}
      </p>

      {vendors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">🏬</div>
          <p className="text-gray-500">{t('noStoresYet')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {vendors.map((v) => (
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
                    {t('verifiedBadge')}
                  </span>
                )}
              </div>

              {v.provinces_rd && (
                <p className="text-xs text-gray-400 mt-1">
                  📍 {v.provinces_rd.name}
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
                {t('viewStoreLink')}
              </span>
            </a>
          ))}
        </div>
      )}

    </div>
  )
}
