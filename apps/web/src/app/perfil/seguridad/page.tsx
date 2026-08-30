'use client'
// ============================================================
// MercadoRD — Seguridad de la cuenta (contraseña + MFA TOTP)
// Ruta: src/app/perfil/seguridad/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { validatePhone } from '@/lib/validation'
import { BRAND } from '@/lib/colors'

interface DeletionBlockers {
  can_delete: boolean
  pending_orders_as_buyer: number
  pending_orders_as_vendor: number
  open_disputes: number
}

export default function SecurityPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation('profile')

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
  const [phoneNew, setPhoneNew] = useState('')
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

  const loadMfaStatus = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      console.error('[SecurityPage listFactors]', error)
      return
    }
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
      supabase.rpc('create_notification', {
        p_user_id: user.id,
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

    const validationError = validatePhone(phoneNew)
    if (validationError) {
      setPhoneError(validationError)
      return
    }

    setPhoneSaving(true)
    // Validación de formato la repite el propio RPC del lado del
    // servidor — esto es solo feedback inmediato, no la única barrera.
    const { error } = await supabase.rpc('update_own_phone', { p_phone: phoneNew.trim() })
    setPhoneSaving(false)

    if (error) {
      console.error('[SecurityPage updatePhone]', error)
      setPhoneError(error.message)
      return
    }

    setPhoneSuccess(true)
    setPhoneNew('')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">{t('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('securityPageTitle')}</h1>
        <p className="text-sm text-gray-400 mb-6">{t('securityPageSubtitle')}</p>

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('changePasswordTitle')}</h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              value={passwordNew}
              onChange={e => setPasswordNew(e.target.value)}
              placeholder={t('newPasswordPlaceholder')}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
            />
            <input
              type="password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              placeholder={t('confirmNewPasswordPlaceholder')}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
            />

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2">
                {t('passwordChangeSuccess')}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordSaving}
              style={{ background: passwordSaving ? '#ccc' : BRAND.blue }}
              className="w-full text-white font-medium py-2.5 rounded-lg text-sm border-none cursor-pointer"
            >
              {passwordSaving ? t('savingButton') : t('updatePasswordButton')}
            </button>
          </form>
        </div>

        {/* Cambiar email */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('changeEmailTitle')}</h2>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              value={emailNew}
              onChange={e => setEmailNew(e.target.value)}
              placeholder={t('newEmailPlaceholder')}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
            />

            {emailError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
                {emailError}
              </div>
            )}
            {emailSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2">
                {t('emailChangeSuccess')}
              </div>
            )}

            <button
              type="submit"
              disabled={emailSaving}
              style={{ background: emailSaving ? '#ccc' : BRAND.blue }}
              className="w-full text-white font-medium py-2.5 rounded-lg text-sm border-none cursor-pointer"
            >
              {emailSaving ? t('savingButton') : t('updateEmailButton')}
            </button>
          </form>
        </div>

        {/* Cambiar teléfono */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('changePhoneTitle')}</h2>

          <form onSubmit={handlePhoneSubmit} className="space-y-3">
            <input
              type="tel"
              value={phoneNew}
              onChange={e => setPhoneNew(e.target.value)}
              placeholder={t('newPhonePlaceholder')}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
            />

            {phoneError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
                {phoneError}
              </div>
            )}
            {phoneSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2">
                {t('phoneChangeSuccess')}
              </div>
            )}

            <button
              type="submit"
              disabled={phoneSaving}
              style={{ background: phoneSaving ? '#ccc' : BRAND.blue }}
              className="w-full text-white font-medium py-2.5 rounded-lg text-sm border-none cursor-pointer"
            >
              {phoneSaving ? t('savingButton') : t('updatePhoneButton')}
            </button>
          </form>
        </div>

        {/* MFA */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('mfaTitle')}</h2>

          {mfaError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
              {mfaError}
            </div>
          )}

          {mfaFactorId && !enrolling ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: BRAND.green }}>
                {t('mfaActive')}
              </span>
              <button
                onClick={handleUnenroll}
                disabled={mfaBusy}
                className="text-sm font-semibold underline bg-transparent border-none cursor-pointer"
                style={{ color: BRAND.red }}
              >
                {mfaBusy ? t('deactivatingButton') : t('deactivateButton')}
              </button>
            </div>
          ) : enrolling ? (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                {t('mfaScanInstructions')}
              </p>

              {qrCode && (
                <div className="flex justify-center mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt={t('mfaQrAlt')} className="w-44 h-44 border border-gray-100 rounded-lg" />
                </div>
              )}

              <form onSubmit={handleVerify} className="flex gap-2">
                <input
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('mfaCodePlaceholder')}
                  inputMode="numeric"
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none tracking-widest"
                />
                <button
                  type="submit"
                  disabled={mfaBusy}
                  style={{ background: mfaBusy ? '#ccc' : BRAND.blue }}
                  className="text-white font-medium px-5 rounded-lg text-sm border-none cursor-pointer"
                >
                  {t('confirmButton')}
                </button>
              </form>
              <button
                onClick={handleCancelEnroll}
                className="text-xs text-gray-400 underline bg-transparent border-none cursor-pointer mt-3"
              >
                {t('cancelButton')}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                {t('mfaEnrollHint')}
              </p>
              <button
                onClick={handleEnrollStart}
                disabled={mfaBusy}
                style={{ background: mfaBusy ? '#ccc' : BRAND.blue }}
                className="text-white font-medium px-5 py-2.5 rounded-lg text-sm border-none cursor-pointer"
              >
                {mfaBusy ? t('startingButton') : t('activateMfaButton')}
              </button>
            </div>
          )}
        </div>

        {/* Eliminar cuenta — destructivo, separado claramente del resto */}
        <div className="bg-white rounded-2xl border-2 p-6 mt-8" style={{ borderColor: '#FCA5A5' }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: BRAND.red }}>{t('deleteAccountTitle')}</h2>
          <p className="text-xs text-gray-500 mb-3">{t('deleteAccountHint')}</p>

          {deleteStep === 'idle' && (
            <button
              onClick={handleDeleteClick}
              disabled={deleteChecking}
              style={{ background: '#fff', border: `1px solid ${BRAND.red}`, color: BRAND.red }}
              className="font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer"
            >
              {deleteChecking ? t('checkingButton') : t('deleteAccountButton')}
            </button>
          )}

          {deleteStep === 'blocked' && (
            <div>
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
                {deleteBlockedMessage}
              </div>
              <button
                onClick={() => setDeleteStep('idle')}
                className="text-xs text-gray-400 underline bg-transparent border-none cursor-pointer"
              >
                {t('cancelButton')}
              </button>
            </div>
          )}

          {deleteStep === 'confirm' && (
            <div>
              <p className="text-xs text-gray-600 mb-2">{t('deleteConfirmInstructions')}</p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder={t('deleteConfirmPlaceholder')}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none mb-3"
              />

              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteSaving}
                  style={{ background: deleteSaving ? '#ccc' : BRAND.red }}
                  className="flex-1 text-white font-medium py-2.5 rounded-lg text-sm border-none cursor-pointer"
                >
                  {deleteSaving ? t('deletingButton') : t('confirmDeleteButton')}
                </button>
                <button
                  onClick={() => { setDeleteStep('idle'); setDeleteConfirmText(''); setDeleteError(null) }}
                  disabled={deleteSaving}
                  className="px-4 py-2.5 rounded-lg text-sm border border-gray-200 bg-white cursor-pointer"
                >
                  {t('cancelButton')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
