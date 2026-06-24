'use client'
// ============================================================
// MercadoRD — Formulario de tracking (vendor dashboard)
// Ruta: src/components/vendor/TrackingForm.tsx
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'

const COURIERS = ['Caribe Express', 'Freddy Courier', 'AeroPost', 'Otro']

interface Props {
  orderId: string
  initialTracking: string | null
  initialCourier: string | null
}

export function TrackingForm({ orderId, initialTracking, initialCourier }: Props) {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courier, setCourier] = useState(COURIERS[0])
  const [saved, setSaved] = useState<{ tracking_number: string; courier: string } | null>(
    initialTracking ? { tracking_number: initialTracking, courier: initialCourier ?? '' } : null
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!trackingNumber.trim()) {
      setError('El número de tracking es obligatorio')
      return
    }
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const { error: rpcError } = await supabase.rpc('update_order_tracking', {
      p_order_id: orderId,
      p_tracking_number: trackingNumber.trim(),
      p_courier: courier,
    })

    setSaving(false)

    if (rpcError) {
      console.error('[TrackingForm]', rpcError)
      setError('No se pudo guardar el tracking. Intenta de nuevo.')
      return
    }

    setSaved({ tracking_number: trackingNumber.trim(), courier })
  }

  if (saved) {
    return (
      <div style={{ background: '#fff', borderRadius: 8, padding: 12, marginTop: 12, border: '1px solid #e0e0e0' }}>
        <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Tracking</p>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>📦 {saved.tracking_number}</p>
        <p style={{ fontSize: 12, color: '#666' }}>{saved.courier}</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 12, marginTop: 12, border: '1px solid #e0e0e0' }}>
      <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Marcar como enviado</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={trackingNumber}
          onChange={e => setTrackingNumber(e.target.value)}
          placeholder="Número de tracking"
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
        </select>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: saving ? '#ccc' : BRAND.blue, color: '#fff', border: 'none',
            borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Guardando...' : 'Marcar como enviado'}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#c00', marginTop: 6 }}>{error}</p>}
    </div>
  )
}
