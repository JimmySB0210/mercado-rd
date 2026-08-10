'use client'
// ============================================================
// MercadoRD — Fila de disputa en el panel de admin
// Ruta: src/components/admin/DisputeAdminRow.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

interface Props {
  disputeId: string
  orderId: string
  reason: string
  description: string
  status: string
  buyerName: string
  vendorName: string
  createdAt: string
}

const STATUS_VALUES = ['open', 'reviewing', 'resolved', 'closed'] as const

export function DisputeAdminRow({ disputeId, orderId, reason, description, status, buyerName, vendorName, createdAt }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation('admin')

  const [currentStatus, setCurrentStatus] = useState(status)
  const [resolution, setResolution] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shortId = orderId.split('-')[0].toUpperCase()
  const date = new Date(createdAt).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const updates: Record<string, any> = { status: currentStatus, updated_at: new Date().toISOString() }
    if (resolution.trim()) updates.resolution = resolution.trim()

    const { error: updateError } = await supabase
      .from('disputes')
      .update(updates)
      .eq('id', disputeId)

    if (updateError) {
      console.error('[DisputeAdminRow]', updateError)
      setError(t('saveFailedGeneric'))
      setSaving(false)
      return
    }

    setSaving(false)
    router.refresh()
  }

  return (
    <div style={{ padding: '14px 18px', borderBottom: '1px solid #f8f8f8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.blue }}>#RD-{shortId}</div>
          <div style={{ fontSize: 11, color: '#999' }}>{buyerName} → {vendorName} · {date}</div>
        </div>
        <span style={{ background: '#FEF9C3', color: '#713f12', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
          {t(`disputeReason.${reason}` as 'disputeReason.other')}
        </span>
      </div>

      <p style={{ fontSize: 12, color: '#444', marginBottom: 10, lineHeight: 1.5 }}>{description}</p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <select
          value={currentStatus}
          onChange={e => setCurrentStatus(e.target.value)}
          style={{ border: '1px solid #ddd', borderRadius: 6, padding: '6px 10px', fontSize: 12, background: '#fff' }}
        >
          {STATUS_VALUES.map(value => (
            <option key={value} value={value}>{t(`disputeStatusOption.${value}`)}</option>
          ))}
        </select>

        <input
          value={resolution}
          onChange={e => setResolution(e.target.value)}
          placeholder={t('resolutionNotePlaceholder')}
          style={{ flex: 1, minWidth: 160, border: '1px solid #ddd', borderRadius: 6, padding: '6px 10px', fontSize: 12 }}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? '#ccc' : BRAND.blue, color: '#fff', border: 'none',
            padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? t('savingButton') : t('saveButton')}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#c00' }}>{error}</div>
      )}
    </div>
  )
}
