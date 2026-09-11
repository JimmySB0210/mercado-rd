'use client'
// ============================================================
// MercadoRD — Cola de flagged_content sin revisar (admin)
// Ruta: src/components/admin/FlaggedContentQueue.tsx
// ============================================================
// flagged_content se llena sola (trigger en Supabase) — este
// componente es puramente de revisión: mostrar qué se marcó, con qué
// término, un link al contenido real, y un botón para marcarlo como
// revisado. Nunca bloquea el producto/mensaje original.
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { BRAND } from '@/lib/colors'
import type { FlaggedContentRow } from '@/lib/queries/admin'

interface Props {
  initialFlags: FlaggedContentRow[]
}

export function FlaggedContentQueue({ initialFlags }: Props) {
  const supabase = createClient()
  const { t, language } = useTranslation('admin')

  const [flags, setFlags] = useState(initialFlags)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMarkReviewed = async (flag: FlaggedContentRow) => {
    setLoadingId(flag.id)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { error: updateError } = await supabase
      .from('flagged_content')
      .update({ reviewed: true, reviewed_by: user?.id ?? null, reviewed_at: new Date().toISOString() })
      .eq('id', flag.id)

    setLoadingId(null)

    if (updateError) {
      console.error('[FlaggedContentQueue] markReviewed', updateError)
      setError(t('markReviewedFailed'))
      return
    }
    setFlags(prev => prev.filter(f => f.id !== flag.id))
  }

  if (flags.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#999' }}>
        {t('noFlaggedContent')}
      </div>
    )
  }

  return (
    <div>
      {error && <p style={{ fontSize: 12, color: BRAND.red, padding: '12px 18px 0' }}>{error}</p>}
      {flags.map((flag, i) => (
        <div
          key={flag.id}
          style={{
            padding: '12px 18px', borderBottom: i < flags.length - 1 ? '1px solid #f0f0f0' : 'none',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            opacity: loadingId === flag.id ? 0.5 : 1,
          }}
        >
          <span
            style={{
              fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 10, flexShrink: 0,
              background: flag.content_type === 'product' ? '#E0E7FF' : '#DBEAFE',
              color: flag.content_type === 'product' ? '#3730a3' : '#1e3a8a',
            }}
          >
            {flag.content_type === 'product' ? t('flaggedTypeProduct') : t('flaggedTypeMessage')}
          </span>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {flag.preview_text ?? t('deletedContentFallback')}
            </div>
            <div style={{ fontSize: 11, color: '#999' }}>
              {t('matchedTermsLabel', { terms: flag.matched_terms.join(', ') })} · {formatDate(flag.created_at, language, { day: 'numeric', month: 'short' })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {flag.link && (
              <a
                href={flag.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, fontWeight: 600, color: BRAND.blue, textDecoration: 'none' }}
              >
                {t('viewContentLink')}
              </a>
            )}
            <button
              type="button"
              onClick={() => handleMarkReviewed(flag)}
              disabled={loadingId !== null}
              style={{
                fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 6,
                background: '#fff', color: '#333', border: '1px solid #ddd',
                cursor: loadingId !== null ? 'not-allowed' : 'pointer',
              }}
            >
              {t('markReviewedButton')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
