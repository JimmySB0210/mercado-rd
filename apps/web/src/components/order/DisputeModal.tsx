'use client'
// ============================================================
// MercadoRD — Modal para abrir una disputa
// Ruta: src/components/order/DisputeModal.tsx
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'

interface Props {
  orderId: string
  vendorId: string
  onClose: () => void
  onSuccess: () => void
}

const REASONS = [
  { value: 'not_received',     label: 'No recibí el pedido' },
  { value: 'not_as_described', label: 'No es como se describe' },
  { value: 'damaged',          label: 'Llegó dañado' },
  { value: 'wrong_item',       label: 'Producto equivocado' },
  { value: 'refund_request',   label: 'Solicito reembolso' },
  { value: 'other',            label: 'Otro' },
]

export function DisputeModal({ orderId, vendorId, onClose, onSuccess }: Props) {
  const supabase = createClient()
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!reason) {
      setError('Selecciona una razón')
      return
    }
    if (description.trim().length < 20) {
      setError('Describe el problema con al menos 20 caracteres')
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
      setError('No se pudo abrir la disputa. Intenta de nuevo.')
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
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 4 }}>Abrir disputa</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 18 }}>
          Pedido #{orderId.split('-')[0].toUpperCase()}
        </p>

        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Razón *</label>
        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', background: '#fff', marginBottom: 14 }}
        >
          <option value="">Selecciona una razón</option>
          {REASONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
          Describe el problema * <span style={{ color: '#999' }}>(mínimo 20 caracteres)</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Cuéntanos qué pasó con tu pedido..."
          rows={4}
          style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 4 }}
        />
        <p style={{ fontSize: 11, color: description.trim().length < 20 ? '#c00' : '#999', marginBottom: 14 }}>
          {description.trim().length}/20
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
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex: 1, background: saving ? '#ccc' : BRAND.red, color: '#fff', border: 'none', padding: '11px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Enviando...' : 'Abrir disputa'}
          </button>
        </div>
      </div>
    </div>
  )
}
