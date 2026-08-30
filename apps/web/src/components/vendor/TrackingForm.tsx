'use client'
// ============================================================
// MercadoRD — Formulario de tracking (vendor dashboard)
// Ruta: src/components/vendor/TrackingForm.tsx
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'

const COURIERS = ['Caribe Express', 'Freddy Courier', 'AeroPost']

interface Props {
  orderId: string
  initialTracking: string | null
  initialCourier: string | null
}

export function TrackingForm({ orderId, initialTracking, initialCourier }: Props) {
  const { t } = useTranslation('dashboard')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courier, setCourier] = useState(COURIERS[0])
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('')
  const [saved, setSaved] = useState<{ tracking_number: string; courier: string } | null>(
    initialTracking ? { tracking_number: initialTracking, courier: initialCourier ?? '' } : null
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!trackingNumber.trim()) {
      setError(t('trackingRequiredError'))
      return
    }
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const { error: rpcError } = await supabase.rpc('update_order_tracking', {
      p_order_id: orderId,
      p_tracking_number: trackingNumber.trim(),
      p_courier: courier,
      p_estimated_delivery_date: estimatedDeliveryDate || null,
    })

    setSaving(false)

    if (rpcError) {
      console.error('[TrackingForm]', rpcError)
      setError(t('trackingSaveError'))
      return
    }

    setSaved({ tracking_number: trackingNumber.trim(), courier })

    // Genera y envía el código de entrega al comprador — fire and forget,
    // no debe bloquear ni fallar el flujo de tracking si esto falla.
    supabase.rpc('generate_delivery_otp', { p_order_id: orderId }).then(({ error: otpError }) => {
      if (otpError) console.error('[TrackingForm generate_delivery_otp]', otpError)
    })
  }

  if (saved) {
    return (
      <div style={{ background: '#fff', borderRadius: 8, padding: 12, marginTop: 12, border: '1px solid #e0e0e0' }}>
        <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>{t('trackingHeading')}</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>📦 {saved.tracking_number}</p>
        <p style={{ fontSize: 12, color: '#666' }}>{saved.courier}</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 12, marginTop: 12, border: '1px solid #e0e0e0' }}>
      <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>{t('markAsShippedHeading')}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={trackingNumber}
          onChange={e => setTrackingNumber(e.target.value)}
          placeholder={t('trackingNumberPlaceholder')}
          style={{ flex: 1, minWidth: 160, border: '1px solid #ddd', borderRadius: 6, padding: '7px 10px', fontSize: 13 }}
        />
        <select
          value={courier}
          onChange={e => setCourier(e.target.value)}
          style={{ border: '1px solid #ddd', borderRadius: 6, padding: '7px 10px', fontSize: 13, background: '#fff' }}
        >
          {COURIERS.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
          <option value="Otro">{t('courierOtherOption')}</option>
        </select>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 10, color: '#999' }}>
          {t('estimatedDeliveryLabel')} <span style={{ fontWeight: 400 }}>({t('estimatedDeliveryOptional')})</span>
          <input
            type="date"
            value={estimatedDeliveryDate}
            onChange={e => setEstimatedDeliveryDate(e.target.value)}
            style={{ border: '1px solid #ddd', borderRadius: 6, padding: '6px 10px', fontSize: 13 }}
          />
        </label>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: saving ? '#ccc' : BRAND.blue, color: '#fff', border: 'none',
            borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? t('savingTracking') : t('markAsShippedBtn')}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#c00', marginTop: 6 }}>{error}</p>}
    </div>
  )
}
