'use client'
// ============================================================
// MercadoRD — Aviso «Tienes un producto sin terminar»
// Ruta: src/components/dashboard/ProductDraftNotice.tsx
// ============================================================
// Se muestra en el inicio del panel y en «Mis productos» cuando el vendedor
// dejó un producto nuevo a medias (borrador local, lib/productDraft.ts). No
// aparece si no hay nada guardado, si ya caducó o si el navegador no deja
// usar IndexedDB. «Continuar» entra directo al asistente con el avance
// recuperado; «Descartar» borra el borrador de este dispositivo.
// ============================================================

import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { discardDraft, formatDraftAge, peekDraft, type DraftSummary } from '@/lib/productDraft'

const buttonReset: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-small)', padding: '6px 8px',
}

export function ProductDraftNotice({ vendorId }: { vendorId: string }) {
  const { t, language } = useTranslation('dashboard')
  const [draft, setDraft] = useState<DraftSummary | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    let alive = true
    peekDraft(vendorId).then(found => { if (alive) setDraft(found) })
    return () => { alive = false }
  }, [vendorId])

  if (!draft) return null

  const discard = async () => {
    await discardDraft(vendorId)
    setDraft(null)
  }

  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px', marginBottom: 14,
        background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(10,30,60,0.06)', border: '1px solid #EEF2F6',
        borderLeft: '4px solid var(--dashboard-blue)',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 22 }}>📝</span>
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--text-ui)', color: '#131A18' }}>
          {confirming ? t('draftResumeDiscardConfirm') : t('draftResumeTitle')}
        </div>
        {!confirming && (
          <div style={{ fontSize: 'var(--text-small)', color: '#818F98', overflowWrap: 'anywhere' }}>
            {draft.name || t('draftResumeNoName')} · {t('draftResumeSaved', { when: formatDraftAge(draft.savedAt, Date.now(), language) })}
          </div>
        )}
      </div>

      {confirming ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button type="button" onClick={discard} style={{ ...buttonReset, color: 'var(--brand-red)' }}>
            {t('draftResumeDiscardYes')}
          </button>
          <button type="button" onClick={() => setConfirming(false)} style={{ ...buttonReset, color: '#818F98' }}>
            {t('draftResumeDiscardNo')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a
            href="/dashboard/productos/nuevo?continuar=1"
            style={{
              background: 'var(--dashboard-blue)', color: '#fff', textDecoration: 'none', padding: '8px 14px',
              borderRadius: 8, fontWeight: 600, fontSize: 'var(--text-ui)',
            }}
          >
            {t('draftResumeContinue')}
          </a>
          <button type="button" onClick={() => setConfirming(true)} style={{ ...buttonReset, color: '#818F98' }}>
            {t('draftNoticeDiscard')}
          </button>
        </div>
      )}
    </div>
  )
}
