'use client'
// ============================================================
// MercadoRD — Confirmar entrega con código OTP (vendor dashboard)
// Ruta: src/components/vendor/DeliveryOtpForm.tsx
// ============================================================
// El código en texto plano solo existe en la notificación que recibió
// el comprador cuando se generó (generate_delivery_otp, disparado desde
// TrackingForm) — la tabla solo guarda el hash, así que no hay forma de
// volver a mostrarlo. Este formulario solo verifica el código que el
// comprador le da al vendor/transportista en persona.
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Props {
  orderId: string
}

interface VerifyOtpResult {
  success: boolean
  error?: string
  attempts_remaining?: number
}

export function DeliveryOtpForm({ orderId }: Props) {
  const { t } = useTranslation('dashboard')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [delivered, setDelivered] = useState(false)

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t('otpInvalidFormatError'))
      return
    }
    setError(null)
    setVerifying(true)

    const supabase = createClient()
    const { data, error: rpcError } = await supabase.rpc('verify_delivery_otp', {
      p_order_id: orderId,
      p_otp_code: code.trim(),
    })

    setVerifying(false)

    if (rpcError) {
      console.error('[DeliveryOtpForm]', rpcError)
      setError(t('otpVerifyGenericError'))
      return
    }

    const result = data as VerifyOtpResult
    if (!result.success) {
      setError(
        result.attempts_remaining !== undefined
          ? `${result.error} — ${t('otpAttemptsLeft', { count: result.attempts_remaining })}`
          : result.error ?? t('otpVerifyGenericError')
      )
      return
    }

    setDelivered(true)
  }

  if (delivered) {
    return (
      <div style={{ background: '#F0FDF4', borderRadius: 8, padding: 12, marginTop: 12, border: '1px solid #BBF7D0' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>✅ {t('deliveryConfirmedLabel')}</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 12, marginTop: 12, border: '1px solid #e0e0e0' }}>
      <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>{t('confirmDeliveryHeading')}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder={t('otpCodePlaceholder')}
          maxLength={6}
          inputMode="numeric"
          style={{ flex: 1, minWidth: 140, border: '1px solid #ddd', borderRadius: 6, padding: '7px 10px', fontSize: 13, letterSpacing: 2 }}
        />
        <button
          onClick={handleVerify}
          disabled={verifying}
          style={{
            background: verifying ? '#ccc' : BRAND.blue, color: '#fff', border: 'none',
            borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 700,
            cursor: verifying ? 'not-allowed' : 'pointer',
          }}
        >
          {verifying ? t('verifyingOtpBtn') : t('confirmDeliveryBtn')}
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#c00', marginTop: 6 }}>{error}</p>}
    </div>
  )
}
