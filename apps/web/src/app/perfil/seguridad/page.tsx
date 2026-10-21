'use client'
// ============================================================
// MercadoRD — Seguridad de la cuenta (contraseña, email, teléfono, MFA TOTP
// y eliminación de la cuenta)
// Ruta: src/app/perfil/seguridad/page.tsx
// ============================================================
// Los handlers son los de siempre; esta página solo cambia la
// presentación. Las tres opciones de acceso son filas desplegables (una
// abierta a la vez) con el formulario existente dentro. El estado de MFA
// distingue "no disponible" (listFactors() falló) de "desactivado".
// Nota: hoy el MFA no se exige al iniciar sesión (no hay comprobación de
// AAL2), así que ningún texto lo promete.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, KeyRound, Lock, Mail, ShieldCheck, Smartphone, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { usePhoneField } from '@/lib/hooks/usePhoneField'
import { BRAND } from '@/lib/colors'
import { FOCUS_RING } from '@/components/profile/ProfileCard'
import { Breadcrumb } from '@/components/profile/Breadcrumb'
import { StatusChip } from '@/components/profile/StatusChip'
import { AccessRow } from '@/components/profile/AccessRow'

interface DeletionBlockers {
  can_delete: boolean
  pending_orders_as_buyer: number
  pending_orders_as_vendor: number
  open_disputes: number
}

type AccessRowId = 'password' | 'email' | 'phone'

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--color-card-bg)',
  border: '1px solid var(--color-divider)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
}
const INPUT_CLASS = 'w-full min-h-[44px] px-4 text-ui focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]'
const INPUT_STYLE: React.CSSProperties = {
  background: 'var(--color-card-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-control)',
  color: 'var(--color-text-primary)',
}
const LABEL_CLASS = 'block text-small font-semibold mb-1.5'
const PRIMARY_BUTTON = `inline-flex items-center justify-center gap-2 min-h-[44px] px-5 text-ui font-semibold border-none cursor-pointer transition-colors hover:bg-[color:var(--color-primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS_RING}`
const PRIMARY_STYLE: React.CSSProperties = { background: 'var(--color-primary)', color: 'var(--color-card-bg)', borderRadius: 'var(--radius-control)' }
const OUTLINE_BUTTON = `inline-flex items-center justify-center gap-2 min-h-[44px] px-5 text-ui font-semibold cursor-pointer transition-colors hover:bg-[color:var(--color-primary-subtle)] disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS_RING}`
const OUTLINE_STYLE: React.CSSProperties = { color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-control)' }

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-small px-3 py-2" style={{ borderRadius: 'var(--radius-control)' }}>
      {children}
    </div>
  )
}

function SuccessMessage({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-2 text-small px-3 py-2" style={{ background: 'var(--color-green-subtle)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-control)' }}>
      <CheckCircle2 size={16} aria-hidden="true" className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-green)' }} />
      {children}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, text, aside, titleId }: { icon: LucideIcon; title: string; text?: string; aside?: React.ReactNode; titleId?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex items-center justify-center flex-shrink-0 w-11 h-11"
        style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }}
        aria-hidden="true"
      >
        <Icon size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h2 id={titleId} className="text-h4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
          {aside}
        </div>
        {text && <p className="text-small mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{text}</p>}
      </div>
    </div>
  )
}

export default function SecurityPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Contraseña
  const [passwordNew, setPasswordNew] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Email
  const [emailNew, setEmailNew] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState(false)

  // Teléfono
  const phoneField = usePhoneField()
  const [phoneSaving, setPhoneSaving] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneSuccess, setPhoneSuccess] = useState(false)

  // Eliminar cuenta
  const [deleteStep, setDeleteStep] = useState<'idle' | 'blocked' | 'confirm'>('idle')
  const [deleteChecking, setDeleteChecking] = useState(false)
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // MFA
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaBusy, setMfaBusy] = useState(false)
  // true si listFactors() falló: el estado no se pudo leer ("No disponible")
  const [mfaUnavailable, setMfaUnavailable] = useState(false)
  const [mfaRetrying, setMfaRetrying] = useState(false)

  // Información de acceso: solo una fila abierta a la vez
  const [openRow, setOpenRow] = useState<AccessRowId | null>(null)
  const rowButtonRefs = {
    password: useRef<HTMLButtonElement>(null),
    email: useRef<HTMLButtonElement>(null),
    phone: useRef<HTMLButtonElement>(null),
  }
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)

  const loadMfaStatus = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      console.error('[SecurityPage listFactors]', error)
      setMfaUnavailable(true)
      return
    }
    setMfaUnavailable(false)
    const verified = data.totp.find(f => f.status === 'verified')
    setMfaFactorId(verified?.id ?? null)
  }

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/perfil/seguridad')
        return
      }
      setUserId(user.id)
      await loadMfaStatus()
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (passwordNew.length < 6) {
      setPasswordError(t('passwordTooShort'))
      return
    }
    if (passwordNew !== passwordConfirm) {
      setPasswordError(t('passwordMismatch'))
      return
    }

    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: passwordNew })
    setPasswordSaving(false)

    if (error) {
      console.error('[SecurityPage updateUser]', error)
      setPasswordError(t('passwordChangeError'))
      return
    }

    setPasswordSuccess(true)
    setPasswordNew('')
    setPasswordConfirm('')
    setTimeout(() => setPasswordSuccess(false), 3000)

    // Alerta de seguridad — fire and forget
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      supabase.rpc('notify_self', {
        p_type: 'security_alert',
        p_title: 'Contraseña cambiada 🔒',
        p_body: 'Tu contraseña fue cambiada. Si no fuiste tú, contacta soporte inmediatamente.',
        p_link: '/perfil/seguridad',
      }).then(({ error: notifyError }) => {
        if (notifyError) console.error('[SecurityPage] No se pudo crear la alerta de seguridad:', notifyError)
      })
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    setEmailSuccess(false)

    if (!emailNew.trim() || !emailNew.includes('@')) {
      setEmailError(t('emailInvalid'))
      return
    }

    setEmailSaving(true)
    const { error } = await supabase.auth.updateUser({ email: emailNew.trim() })
    setEmailSaving(false)

    if (error) {
      console.error('[SecurityPage updateEmail]', error)
      setEmailError(error.message)
      return
    }

    setEmailSuccess(true)
    setEmailNew('')
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError(null)
    setPhoneSuccess(false)

    // Aquí el número es obligatorio: vacío también cuenta como inválido.
    const phone = phoneField.validate()
    if (phone === false) return
    if (phone === null) {
      setPhoneError(tc('phoneInvalid'))
      return
    }

    setPhoneSaving(true)
    // Validación de formato la repite el propio RPC del lado del
    // servidor — esto es solo feedback inmediato, no la única barrera.
    const { error } = await supabase.rpc('update_own_phone', { p_phone: phone })
    setPhoneSaving(false)

    if (error) {
      console.error('[SecurityPage updatePhone]', error)
      setPhoneError(error.message)
      return
    }

    setPhoneSuccess(true)
    phoneField.reset()
  }

  const buildBlockersMessage = (blockers: DeletionBlockers): string => {
    const pendingOrders = blockers.pending_orders_as_buyer + blockers.pending_orders_as_vendor
    const parts: string[] = []
    if (pendingOrders > 0) {
      parts.push(t(pendingOrders === 1 ? 'deleteBlockerOrdersSingular' : 'deleteBlockerOrdersPlural', { count: pendingOrders }))
    }
    if (blockers.open_disputes > 0) {
      parts.push(t(blockers.open_disputes === 1 ? 'deleteBlockerDisputesSingular' : 'deleteBlockerDisputesPlural', { count: blockers.open_disputes }))
    }
    return t('deleteBlockedMessage', { items: parts.join(` ${t('deleteBlockerAnd')} `) })
  }

  const handleDeleteClick = async () => {
    if (!userId) return
    setDeleteError(null)
    setDeleteChecking(true)

    const { data, error } = await supabase.rpc('check_account_deletion_blockers', { p_user_id: userId })
    setDeleteChecking(false)

    if (error || !data) {
      console.error('[SecurityPage checkDeletionBlockers]', error)
      setDeleteError(t('deleteGenericError'))
      return
    }

    if (!data.can_delete) {
      setDeleteBlockedMessage(buildBlockersMessage(data as DeletionBlockers))
      setDeleteStep('blocked')
      return
    }

    setDeleteStep('confirm')
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== t('deleteConfirmPlaceholder').toUpperCase()) {
      setDeleteError(t('deleteConfirmTextMismatch'))
      return
    }

    setDeleteSaving(true)
    setDeleteError(null)

    const { data, error } = await supabase.rpc('delete_own_account')
    setDeleteSaving(false)

    if (error) {
      console.error('[SecurityPage deleteAccount]', error)
      setDeleteError(t('deleteGenericError'))
      return
    }

    // Defensa en profundidad — delete_own_account() vuelve a chequear los
    // bloqueadores server-side aunque ya los hayamos verificado antes.
    if (!data?.success) {
      setDeleteBlockedMessage(data?.blockers ? buildBlockersMessage(data.blockers as DeletionBlockers) : t('deleteGenericError'))
      setDeleteStep('blocked')
      return
    }

    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleEnrollStart = async () => {
    setMfaError(null)
    setMfaBusy(true)

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    setMfaBusy(false)

    if (error || !data) {
      console.error('[SecurityPage enroll]', error)
      setMfaError(t('mfaEnrollStartError'))
      return
    }

    setPendingFactorId(data.id)
    setQrCode(data.totp.qr_code)
    setEnrolling(true)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setMfaError(null)

    if (!pendingFactorId || verifyCode.trim().length !== 6) {
      setMfaError(t('mfaCodeRequired'))
      return
    }

    setMfaBusy(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: pendingFactorId,
      code: verifyCode.trim(),
    })
    setMfaBusy(false)

    if (error) {
      console.error('[SecurityPage verify]', error)
      setMfaError(t('mfaVerifyError'))
      return
    }

    setMfaFactorId(pendingFactorId)
    setEnrolling(false)
    setQrCode(null)
    setPendingFactorId(null)
    setVerifyCode('')
  }

  const handleCancelEnroll = async () => {
    if (pendingFactorId) {
      await supabase.auth.mfa.unenroll({ factorId: pendingFactorId })
    }
    setEnrolling(false)
    setQrCode(null)
    setPendingFactorId(null)
    setVerifyCode('')
    setMfaError(null)
  }

  const handleUnenroll = async () => {
    if (!mfaFactorId) return
    setMfaError(null)
    setMfaBusy(true)

    const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId })
    setMfaBusy(false)

    if (error) {
      console.error('[SecurityPage unenroll]', error)
      setMfaError(t('mfaUnenrollError'))
      return
    }

    setMfaFactorId(null)
  }

  // ── Presentación ──────────────────────────────────────────
  const resetRow = (row: AccessRowId) => {
    if (row === 'password') {
      setPasswordNew('')
      setPasswordConfirm('')
      setPasswordError(null)
      setPasswordSuccess(false)
    } else if (row === 'email') {
      setEmailNew('')
      setEmailError(null)
      setEmailSuccess(false)
    } else {
      phoneField.reset()
      setPhoneError(null)
      setPhoneSuccess(false)
    }
  }

  // Abrir una fila cierra las demás y limpia sus campos y mensajes;
  // cancelar la cierra y devuelve el foco a su botón.
  const toggleRow = (row: AccessRowId) => {
    if (openRow === row) {
      resetRow(row)
      setOpenRow(null)
      requestAnimationFrame(() => rowButtonRefs[row].current?.focus())
      return
    }
    ;(['password', 'email', 'phone'] as AccessRowId[]).forEach(r => { if (r !== row) resetRow(r) })
    setOpenRow(row)
  }

  // Al abrir una fila, el foco va a su primer campo
  useEffect(() => {
    if (!openRow) return
    const target = openRow === 'password' ? passwordInputRef : openRow === 'email' ? emailInputRef : phoneInputRef
    target.current?.focus()
  }, [openRow])

  const handleMfaRetry = async () => {
    setMfaRetrying(true)
    await loadMfaStatus()
    setMfaRetrying(false)
  }

  const mfaStatus = mfaUnavailable ? 'unavailable' : mfaFactorId ? 'on' : 'off'
  const mfaStatusLabel = mfaStatus === 'on' ? t('mfaStatusOn') : mfaStatus === 'off' ? t('mfaStatusOff') : t('mfaStatusUnavailable')

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg-main)' }}>
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-ui" style={{ color: 'var(--color-text-secondary)' }}>{t('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-main)' }}>
      <Navbar />

      <main className="max-w-[880px] mx-auto px-4 py-6 md-860:py-8 flex flex-col gap-5">
        <header>
          <Breadcrumb
            ariaLabel={t('breadcrumbAria')}
            items={[
              { label: t('breadcrumbHome'), href: '/' },
              { label: tc('settings'), href: '/perfil/configuracion' },
              { label: t('securityPageTitle') },
            ]}
          />
          <div className="flex items-start gap-3">
            <ShieldCheck size={36} aria-hidden="true" className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
            <div className="min-w-0">
              <h1 className="text-h1 font-bold" style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-heading)' }}>{t('securityPageTitle')}</h1>
              <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>{t('securityPageSubtitle')}</p>
            </div>
          </div>
        </header>

        {/* Panel informativo */}
        <div className="flex items-start gap-4 p-4 sm:p-5" style={{ background: 'var(--color-primary-subtle)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-card)' }}>
          <span
            className="flex items-center justify-center flex-shrink-0 w-12 h-12"
            style={{ background: 'var(--color-card-bg)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }}
            aria-hidden="true"
          >
            <ShieldCheck size={24} />
          </span>
          <div className="min-w-0">
            <p className="text-ui font-semibold" style={{ color: 'var(--color-blue-dark)' }}>{t('securityTipTitle')}</p>
            <p className="text-small mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{t('securityTipText')}</p>
          </div>
        </div>

        {/* Bloque 1 — Información de acceso */}
        <section className="p-4 sm:p-5 flex flex-col gap-4" style={CARD_STYLE} aria-labelledby="seguridad-acceso">
          <SectionHeader icon={Lock} title={t('accessInfoTitle')} text={t('accessInfoText')} titleId="seguridad-acceso" />

          <div className="flex flex-col gap-3">
            <AccessRow
              ref={rowButtonRefs.password}
              id="fila-contrasena"
              icon={KeyRound}
              title={t('changePasswordTitle')}
              text={t('changePasswordText')}
              buttonLabel={t('updateRowButton')}
              cancelLabel={t('cancelButton')}
              open={openRow === 'password'}
              onToggle={() => toggleRow('password')}
            >
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
                <div>
                  <label htmlFor="seguridad-contrasena" className={LABEL_CLASS} style={{ color: 'var(--color-text-primary)' }}>{t('newPasswordPlaceholder')}</label>
                  <input
                    ref={passwordInputRef}
                    id="seguridad-contrasena"
                    type="password"
                    autoComplete="new-password"
                    value={passwordNew}
                    onChange={e => setPasswordNew(e.target.value)}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label htmlFor="seguridad-contrasena-confirmar" className={LABEL_CLASS} style={{ color: 'var(--color-text-primary)' }}>{t('confirmNewPasswordPlaceholder')}</label>
                  <input
                    id="seguridad-contrasena-confirmar"
                    type="password"
                    autoComplete="new-password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>

                {passwordError && <ErrorMessage>{passwordError}</ErrorMessage>}
                {passwordSuccess && <SuccessMessage>{t('passwordChangeSuccess')}</SuccessMessage>}

                <div>
                  <button type="submit" disabled={passwordSaving} className={PRIMARY_BUTTON} style={PRIMARY_STYLE}>
                    {passwordSaving ? t('savingButton') : t('updatePasswordButton')}
                  </button>
                </div>
              </form>
            </AccessRow>

            <AccessRow
              ref={rowButtonRefs.email}
              id="fila-email"
              icon={Mail}
              title={t('changeEmailTitle')}
              text={t('changeEmailText')}
              buttonLabel={t('updateRowButton')}
              cancelLabel={t('cancelButton')}
              open={openRow === 'email'}
              onToggle={() => toggleRow('email')}
            >
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                <div>
                  <label htmlFor="seguridad-email" className={LABEL_CLASS} style={{ color: 'var(--color-text-primary)' }}>{t('newEmailPlaceholder')}</label>
                  <input
                    ref={emailInputRef}
                    id="seguridad-email"
                    type="email"
                    autoComplete="email"
                    value={emailNew}
                    onChange={e => setEmailNew(e.target.value)}
                    className={INPUT_CLASS}
                    style={INPUT_STYLE}
                  />
                </div>

                {emailError && <ErrorMessage>{emailError}</ErrorMessage>}
                {emailSuccess && <SuccessMessage>{t('emailChangeSuccess')}</SuccessMessage>}

                <div>
                  <button type="submit" disabled={emailSaving} className={PRIMARY_BUTTON} style={PRIMARY_STYLE}>
                    {emailSaving ? t('savingButton') : t('updateEmailButton')}
                  </button>
                </div>
              </form>
            </AccessRow>

            <AccessRow
              ref={rowButtonRefs.phone}
              id="fila-telefono"
              icon={Smartphone}
              title={t('changePhoneTitle')}
              text={t('changePhoneText')}
              buttonLabel={t('updateRowButton')}
              cancelLabel={t('cancelButton')}
              open={openRow === 'phone'}
              onToggle={() => toggleRow('phone')}
            >
              <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-3">
                <div>
                  <label htmlFor="seguridad-telefono" className={LABEL_CLASS} style={{ color: 'var(--color-text-primary)' }}>{t('newPhonePlaceholder')}</label>
                  <input
                    ref={phoneInputRef}
                    id="seguridad-telefono"
                    {...phoneField.inputProps}
                    className={INPUT_CLASS}
                    style={{ ...INPUT_STYLE, ...(phoneField.error ? { border: `1px solid ${BRAND.red}` } : null) }}
                  />
                  {phoneField.error && <p role="alert" className="mt-1 text-small font-medium text-red-700">{phoneField.error}</p>}
                </div>

                {phoneError && <ErrorMessage>{phoneError}</ErrorMessage>}
                {phoneSuccess && <SuccessMessage>{t('phoneChangeSuccess')}</SuccessMessage>}

                <div>
                  <button type="submit" disabled={phoneSaving} className={PRIMARY_BUTTON} style={PRIMARY_STYLE}>
                    {phoneSaving ? t('savingButton') : t('updatePhoneButton')}
                  </button>
                </div>
              </form>
            </AccessRow>
          </div>
        </section>

        {/* Bloque 2 — Autenticación en dos pasos (MFA) */}
        <section className="p-4 sm:p-5 flex flex-col gap-4" style={CARD_STYLE} aria-labelledby="seguridad-mfa">
          <SectionHeader
            icon={ShieldCheck}
            title={t('mfaTitle')}
            text={t('mfaDescription')}
            titleId="seguridad-mfa"
            aside={<StatusChip status={mfaStatus} label={mfaStatusLabel} />}
          />

          {mfaError && <ErrorMessage>{mfaError}</ErrorMessage>}

          {mfaUnavailable ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="flex-1 text-small" style={{ color: 'var(--color-text-secondary)' }}>{t('mfaUnavailableText')}</p>
              <button type="button" onClick={handleMfaRetry} disabled={mfaRetrying} className={OUTLINE_BUTTON} style={OUTLINE_STYLE}>
                {t('retryButton')}
              </button>
            </div>
          ) : mfaFactorId && !enrolling ? (
            <div>
              <button type="button" onClick={handleUnenroll} disabled={mfaBusy} className={OUTLINE_BUTTON} style={OUTLINE_STYLE}>
                {mfaBusy ? t('deactivatingButton') : t('deactivateButton')}
              </button>
            </div>
          ) : enrolling ? (
            <div className="flex flex-col gap-4 pt-4" style={{ borderTop: '1px solid var(--color-divider)' }}>
              <p className="text-small" style={{ color: 'var(--color-text-secondary)' }}>{t('mfaScanInstructions')}</p>

              {qrCode && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt={t('mfaQrAlt')} className="w-44 h-44" style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-control)' }} />
                </div>
              )}

              <form onSubmit={handleVerify} className="flex flex-col gap-3">
                <div>
                  <label htmlFor="seguridad-mfa-codigo" className={LABEL_CLASS} style={{ color: 'var(--color-text-primary)' }}>{t('mfaCodePlaceholder')}</label>
                  <input
                    id="seguridad-mfa-codigo"
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className={`${INPUT_CLASS} tracking-widest`}
                    style={INPUT_STYLE}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button type="submit" disabled={mfaBusy} className={PRIMARY_BUTTON} style={PRIMARY_STYLE}>
                    {t('confirmButton')}
                  </button>
                  <button type="button" onClick={handleCancelEnroll} className={OUTLINE_BUTTON} style={OUTLINE_STYLE}>
                    {t('cancelButton')}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <button type="button" onClick={handleEnrollStart} disabled={mfaBusy} className={PRIMARY_BUTTON} style={PRIMARY_STYLE}>
                {mfaBusy ? t('startingButton') : t('activateMfaButton')}
              </button>
            </div>
          )}
        </section>

        {/* Bloque 3 — Zona de peligro: eliminar la cuenta */}
        <section className="p-4 sm:p-5 flex flex-col gap-4 border border-red-200 bg-red-50" style={{ borderRadius: 'var(--radius-card)' }} aria-labelledby="seguridad-eliminar">
          <div className="flex items-start gap-3">
            <span
              className="flex items-center justify-center flex-shrink-0 w-11 h-11"
              style={{ background: 'var(--color-card-bg)', color: BRAND.red, borderRadius: 'var(--radius-pill)' }}
              aria-hidden="true"
            >
              <Trash2 size={20} />
            </span>
            <div className="min-w-0">
              <h2 id="seguridad-eliminar" className="text-h4 font-semibold" style={{ color: BRAND.red }}>{t('deleteAccountTitle')}</h2>
              <p className="text-small mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{t('deleteAccountHint')}</p>
            </div>
          </div>

          {deleteStep === 'idle' && (
            <div className="flex flex-col gap-3">
              {deleteError && <ErrorMessage>{deleteError}</ErrorMessage>}
              <div>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={deleteChecking}
                  className={`inline-flex items-center justify-center min-h-[44px] px-5 text-ui font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS_RING}`}
                  style={{ background: 'var(--color-card-bg)', border: `1px solid ${BRAND.red}`, color: BRAND.red, borderRadius: 'var(--radius-control)' }}
                >
                  {deleteChecking ? t('checkingButton') : t('deleteAccountButton')}
                </button>
              </div>
            </div>
          )}

          {deleteStep === 'blocked' && (
            <div className="flex flex-col gap-3">
              <ErrorMessage>{deleteBlockedMessage}</ErrorMessage>
              <div>
                <button type="button" onClick={() => setDeleteStep('idle')} className={OUTLINE_BUTTON} style={OUTLINE_STYLE}>
                  {t('cancelButton')}
                </button>
              </div>
            </div>
          )}

          {deleteStep === 'confirm' && (
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="seguridad-eliminar-confirmar" className={LABEL_CLASS} style={{ color: 'var(--color-text-primary)' }}>{t('deleteConfirmInstructions')}</label>
                <input
                  id="seguridad-eliminar-confirmar"
                  type="text"
                  autoComplete="off"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder={t('deleteConfirmPlaceholder')}
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
              </div>

              {deleteError && <ErrorMessage>{deleteError}</ErrorMessage>}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteSaving}
                  className={`inline-flex items-center justify-center min-h-[44px] px-5 text-ui font-semibold border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS_RING}`}
                  style={{ background: BRAND.red, color: 'var(--color-card-bg)', borderRadius: 'var(--radius-control)' }}
                >
                  {deleteSaving ? t('deletingButton') : t('confirmDeleteButton')}
                </button>
                <button
                  type="button"
                  onClick={() => { setDeleteStep('idle'); setDeleteConfirmText(''); setDeleteError(null) }}
                  disabled={deleteSaving}
                  className={OUTLINE_BUTTON}
                  style={OUTLINE_STYLE}
                >
                  {t('cancelButton')}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
