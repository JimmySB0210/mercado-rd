'use client'
// ============================================================
// MercadoRD — Contenido traducido de /perfil/historial
// Ruta: src/app/perfil/historial/HistorialContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase) y no
// puede usar useTranslation (hook de cliente). Este componente recibe
// los productos ya resueltos como prop y se encarga de todo el texto
// traducido.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { ProductCard } from '@/components/product/ProductCard'

export function HistorialContent({ products }: { products: any[] }) {
  const { t } = useTranslation('profile')

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('historyPageTitle')}</h1>
      <p className="text-sm text-gray-400 mb-6">
        {products.length} {products.length === 1 ? t('viewedProductSingular') : t('viewedProductPlural')} {t('recentlySuffix')}
      </p>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">🕐</div>
          <p className="text-gray-500 mb-2">{t('emptyHistoryMessage')}</p>
          <a href="/" className="text-blue-600 underline text-sm">{t('exploreProductsLink')}</a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {products.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  )
}
