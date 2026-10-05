'use client'
// ============================================================
// MercadoRD — Encabezado traducido de /admin/centro-ayuda
// Ruta: src/components/admin/HelpCenterPageHeader.tsx
// ============================================================
// page.tsx es un Server Component y no puede usar useTranslation.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'

export function HelpCenterPageHeader() {
  const { t } = useTranslation('admin')

  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 'var(--text-dash-title)', fontWeight: 700, lineHeight: 'var(--leading-h1)', marginBottom: 4 }}>{t('helpPageTitle')}</h1>
      <p style={{ color: '#666', fontSize: 'var(--text-ui)' }}>{t('helpPageSubtitle')}</p>
    </div>
  )
}
