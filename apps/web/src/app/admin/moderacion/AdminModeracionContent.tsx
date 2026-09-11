'use client'
// ============================================================
// MercadoRD — Contenido traducido de /admin/moderacion
// Ruta: src/app/admin/moderacion/AdminModeracionContent.tsx
// ============================================================
// page.tsx es un Server Component y no puede usar useTranslation.
// Este componente recibe los datos ya resueltos y se encarga de todo
// el texto traducido, coordinando los 2 managers client-side.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { ContentFlagTermsManager } from '@/components/admin/ContentFlagTermsManager'
import { FlaggedContentQueue } from '@/components/admin/FlaggedContentQueue'
import type { ContentFlagTerm } from '@/types/database.types'
import type { FlaggedContentRow } from '@/lib/queries/admin'

interface Props {
  initialTerms: ContentFlagTerm[]
  initialFlags: FlaggedContentRow[]
}

export function AdminModeracionContent({ initialTerms, initialFlags }: Props) {
  const { t } = useTranslation('admin')

  return (
    <div style={{ padding: 28, background: '#f5f5f5' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{t('moderationPageTitle')}</h1>
        <p style={{ color: '#666', fontSize: 14 }}>{t('moderationPageSubtitle')}</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
          {t('flaggedQueueTitle', { count: initialFlags.length })}
        </div>
        <FlaggedContentQueue initialFlags={initialFlags} />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
          {t('flagTermsTitle', { count: initialTerms.length })}
        </div>
        <ContentFlagTermsManager initialTerms={initialTerms} />
      </div>
    </div>
  )
}
