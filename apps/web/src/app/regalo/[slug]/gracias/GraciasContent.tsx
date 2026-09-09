'use client'
// ============================================================
// MercadoRD — Contenido traducido de /regalo/[slug]/gracias
// Ruta: src/app/regalo/[slug]/gracias/GraciasContent.tsx
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

export function GraciasContent({ displayName }: { displayName: string }) {
  const { t } = useTranslation('giftLists')

  return (
    <main className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{t('thankYouTitle', { alias: displayName })}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('thankYouHint')}</p>
      <a
        href="/"
        className="inline-block text-sm font-medium hover:underline"
        style={{ color: BRAND.blue }}
      >
        {t('backHomeLink')}
      </a>
    </main>
  )
}
