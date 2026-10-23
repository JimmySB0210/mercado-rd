'use client'
// ============================================================
// MercadoRD — Botón «Reenviar correo» (con cuenta atrás y aviso)
// Archivo: components/auth/ResendEmailButton.tsx
// ============================================================
// Parte visual de lib/hooks/useResendEmail.ts: el botón (deshabilitado
// mientras corre la espera o se está enviando) y el aviso del resultado.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatCountdown } from '@/lib/emailResend'
import type { ResendNotice } from '@/lib/hooks/useResendEmail'

interface ResendEmailButtonProps {
  secondsLeft: number
  sending: boolean
  notice: ResendNotice | null
  onResend: () => void
}

export default function ResendEmailButton({ secondsLeft, sending, notice, onResend }: ResendEmailButtonProps) {
  const { t } = useTranslation('auth')
  const waiting = secondsLeft > 0

  return (
    <>
      <button
        type="button"
        onClick={onResend}
        disabled={waiting || sending}
        className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed text-ui font-semibold py-3 rounded-lg transition-colors"
      >
        {sending
          ? t('resendingEmail')
          : waiting
            ? t('resendEmailWait', { time: formatCountdown(secondsLeft) })
            : t('resendEmailButton')}
      </button>
      {notice && (
        <p
          role={notice === 'sent' ? 'status' : 'alert'}
          className={`mt-3 text-small font-medium ${notice === 'sent' ? 'text-green-700' : 'text-red-700'}`}
        >
          {notice === 'sent'
            ? t('resendEmailSent')
            : notice === 'rate_limited'
              ? t('emailRateLimited')
              : t('resendEmailFailed')}
        </p>
      )}
    </>
  )
}
