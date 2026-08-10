'use client'
// ============================================================
// MercadoRD — Modal para abrir una disputa
// Ruta: src/components/order/DisputeModal.tsx
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

interface Props {
  orderId: string
  vendorId: string
  refundEligible?: boolean
  refundIneligibleReason?: string | null
  onClose: () => void
  onSuccess: () => void
}

const REASON_VALUES = ['not_received', 'not_as_described', 'damaged', 'wrong_item', 'refund_request', 'other'] as const

export function DisputeModal({ orderId, vendorId, refundEligible = true, refundIneligibleReason = null, onClose, onSuccess }: Props) {
  const supabase = createClient()
  const { t } = useTranslation('profile')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!reason) {
      setError(t('reasonRequired'))
      return
    }
    if (description.trim().length < 20) {
      setError(t('descriptionTooShort'))
      return
    }

    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertError } = await supabase
      .from('disputes')
      .insert({
        order_id: orderId,
        buyer_id: user.id,
        vendor_id: vendorId,
        reason,
        description: description.trim(),
      })

    if (insertError) {
      console.error('[DisputeModal]', insertError)
      setError(t('openDisputeError'))
      setSaving(false)
      return
    }

    onSuccess()
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 440, width: '100%' }}
      >
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 4 }}>{t('openDisputeTitle')}</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 18 }}>
          {t('orderNumberLabel', { id: orderId.split('-')[0].toUpperCase() })}
        </p>

        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>{t('reasonLabel')}</label>
        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', background: '#fff', marginBottom: refundEligible ? 14 : 4 }}
        >
          <option value="">{t('selectReasonOption')}</option>
          {REASON_VALUES.map(value => (
            <option
              key={value}
              value={value}
              disabled={value === 'refund_request' && !refundEligible}
            >
              {t(`disputeReason.${value}`)}
            </option>
          ))}
        </select>
        {!refundEligible && refundIneligibleReason && (
          <p style={{ fontSize: 11, color: '#999', margin: '0 0 14px' }}>
            {t('refundRequestUnavailable', { reason: refundIneligibleReason })}
          </p>
        )}

        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
          {t('describeProblemLabel')} <span style={{ color: '#999' }}>{t('minCharsHint')}</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('describePlaceholder')}
          rows={4}
          style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 4 }}
        />
        <p style={{ fontSize: 11, color: description.trim().length < 20 ? '#c00' : '#999', marginBottom: 14 }}>
          {t('charCounter', { count: description.trim().length })}
        </p>

        {error && (
          <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#c00', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, background: '#fff', border: '1px solid #ddd', color: '#333', padding: '11px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            {t('cancelButton')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex: 1, background: saving ? '#ccc' : BRAND.red, color: '#fff', border: 'none', padding: '11px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? t('sendingButton') : t('openDisputeButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
