'use client'
// ============================================================
// MercadoRD — Estado "Acceso restringido" (admin)
// Ruta: src/components/admin/RestrictedAccess.tsx
// ============================================================
// Compartido entre app/admin/page.tsx y app/admin/promociones/page.tsx
// (ambos Server Components) — evita duplicar el mismo texto traducido
// en dos archivos.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'

export function RestrictedAccess() {
  const { t } = useTranslation('admin')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t('restrictedAccessTitle')}</h1>
        <p className="text-gray-500 text-sm mb-6">
          {t('restrictedAccessMessage')}
        </p>
        <a href="/" className="text-blue-600 underline text-sm">{t('backToHomeLink')}</a>
      </div>
    </div>
  )
}
