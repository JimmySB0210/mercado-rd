'use client'
// ============================================================
// MercadoRD — Encabezado traducido de /admin/promociones
// Ruta: src/components/admin/PromoBannerPageHeader.tsx
// ============================================================
// page.tsx es un Server Component y no puede usar useTranslation.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'

export function PromoBannerPageHeader() {
  const { t } = useTranslation('admin')

  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 'var(--text-dash-title)', fontWeight: 700, lineHeight: 'var(--leading-h1)', marginBottom: 4 }}>{t('bannersPageTitle')}</h1>
      <p style={{ color: '#666', fontSize: 'var(--text-ui)' }}>{t('bannersPageSubtitle')}</p>
    </div>
  )
}
