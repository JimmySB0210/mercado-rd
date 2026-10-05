'use client'
// ============================================================
// MercadoRD — Modal para dejar reseña
// Ruta: src/components/product/ReviewModal.tsx
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { resolveKnownError, KNOWN_REVIEW_ERRORS } from '@/lib/orderErrors'

interface Props {
  orderId: string
  productId: string
  vendorId: string
  productName: string
  onClose: () => void
  onSuccess: () => void
}

export function ReviewModal({ orderId, productId, vendorId, productName, onClose, onSuccess }: Props) {
  const { t } = useTranslation('products')
  const supabase = createClient()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Selecciona una calificación')
      return
    }

    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        product_id: productId,
        vendor_id: vendorId,
        order_id: orderId,
        rating,
        comment: comment || null,
      })

    if (insertError) {
      console.error('[ReviewModal]', insertError)
      // Nunca el texto crudo de Postgres — validate_real_review() (ver
      // migración 013) tiene 2 mensajes fijos y conocidos, mapeados acá
      // a copy traducido (ES/EN/FR). Cualquier otro error cae al
      // genérico. Ver lib/orderErrors.ts.
      const knownKey = resolveKnownError(insertError, KNOWN_REVIEW_ERRORS)
      setError(
        knownKey === 'REVIEW_NOT_DELIVERED' ? t('reviewNotDeliveredError') :
        knownKey === 'REVIEW_OWN_PRODUCT' ? t('reviewOwnProductError') :
        t('reviewGenericError')
      )
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
        style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%' }}
      >
        <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 700, color: '#111', marginBottom: 4 }}>Califica tu compra</h2>
        <p style={{ fontSize: 'var(--text-small)', color: '#666', marginBottom: 18 }}>{productName}</p>

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, padding: 0, color: n <= (hoverRating || rating) ? '#F5A200' : '#ddd' }}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Cuéntale a otros compradores cómo fue tu experiencia (opcional)"
          rows={4}
          style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 'var(--text-ui)', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 14 }}
        />

        {error && (
          <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '8px 12px', fontSize: 'var(--text-small)', fontWeight: 500, color: '#c00', marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, background: '#fff', border: '1px solid #ddd', color: '#333', padding: '11px', borderRadius: 8, fontWeight: 600, fontSize: 'var(--text-ui)', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex: 1, background: saving ? '#ccc' : BRAND.blue, color: '#fff', border: 'none', padding: '11px', borderRadius: 8, fontWeight: 600, fontSize: 'var(--text-ui)', cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Enviando...' : 'Enviar reseña'}
          </button>
        </div>
      </div>
    </div>
  )
}
