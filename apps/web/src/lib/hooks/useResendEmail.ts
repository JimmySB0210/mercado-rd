'use client'
// ============================================================
// MercadoRD — Hook: reenviar un correo de autenticación
// Archivo: lib/hooks/useResendEmail.ts
// ============================================================
// Lo usan /recuperar-password (correo de recuperación), /register (correo
// de confirmación) y /login (cuenta sin confirmar). Maneja:
//   - la espera de 60 s entre correos (la misma que aplica Supabase por
//     usuario), con cuenta atrás;
//   - que la espera se recuerde si la persona sale y vuelve a la pantalla
//     (sessionStorage, ver lib/emailResend.ts);
//   - el aviso de resultado: enviado / hay que esperar / falló.
// `send` hace la llamada a Supabase y devuelve { error }.
// ============================================================

import { useEffect, useState } from 'react'
import {
  clearPendingEmail,
  isEmailRateLimitError,
  readPendingEmail,
  resendCooldownLeft,
  savePendingEmail,
  type PendingEmail,
  type PendingEmailKind,
} from '@/lib/emailResend'

export type ResendNotice = 'sent' | 'rate_limited' | 'failed'

export function useResendEmail(
  kind: PendingEmailKind,
  send: (email: string) => Promise<{ error: unknown }>
) {
  const [pending, setPending] = useState<PendingEmail | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<ResendNotice | null>(null)

  // Si la persona sale y vuelve a esta pantalla (misma pestaña), recupera el
  // último envío y lo que queda de espera.
  useEffect(() => {
    const saved = readPendingEmail(kind)
    if (!saved) return
    setPending(saved)
    setNow(Date.now())
  }, [kind])

  // Segundos que faltan para poder reenviar; el reloj de 1 s solo corre
  // mientras haya espera.
  const secondsLeft = pending === null ? 0 : resendCooldownLeft(pending.sentAt, now)
  const waiting = secondsLeft > 0
  useEffect(() => {
    if (!waiting) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [waiting])

  // Anota que se acaba de enviar un correo (el primero o un reenvío) y
  // empieza la espera.
  const markSent = (email: string) => {
    const at = Date.now()
    savePendingEmail(kind, email, at)
    setPending({ email, sentAt: at })
    setNow(at)
    setNotice(null)
  }

  // Reenvía a `email` (por defecto, el del último envío).
  const resend = async (email?: string) => {
    const target = email ?? pending?.email
    if (!target || waiting || sending) return
    setSending(true)
    setNotice(null)

    let error: unknown = null
    try {
      error = (await send(target)).error
    } catch (e) {
      error = e ?? new Error('send failed')
    }

    setSending(false)

    if (error) {
      if (isEmailRateLimitError(error)) {
        // El servidor dijo «espera»: reinicia la espera local para no insistir
        const at = Date.now()
        setPending({ email: target, sentAt: at })
        setNow(at)
        setNotice('rate_limited')
      } else {
        setNotice('failed')
      }
      return
    }

    markSent(target)
    setNotice('sent')
  }

  const clearNotice = () => setNotice(null)

  // Olvida el último envío (p. ej. «Usar otro correo»)
  const reset = () => {
    clearPendingEmail(kind)
    setPending(null)
    setNotice(null)
  }

  return { pending, secondsLeft, sending, notice, markSent, resend, clearNotice, reset }
}
