'use client'
// ============================================================
// MercadoRD — Seguridad de la cuenta (contraseña + MFA TOTP)
// Ruta: src/app/perfil/seguridad/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { BRAND } from '@/lib/colors'

export default function SecurityPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)

  // Contraseña
  const [passwordNew, setPasswordNew] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

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
      setPasswordError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (passwordNew !== passwordConfirm) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: passwordNew })
    setPasswordSaving(false)

    if (error) {
      console.error('[SecurityPage updateUser]', error)
      setPasswordError('No se pudo cambiar la contraseña. Intenta de nuevo.')
      return
    }

    setPasswordSuccess(true)
    setPasswordNew('')
    setPasswordConfirm('')
    setTimeout(() => setPasswordSuccess(false), 3000)
  }

  const handleEnrollStart = async () => {
    setMfaError(null)
    setMfaBusy(true)

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    setMfaBusy(false)

    if (error || !data) {
      console.error('[SecurityPage enroll]', error)
      setMfaError('No se pudo iniciar la activación de MFA. Intenta de nuevo.')
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
      setMfaError('Ingresa el código de 6 dígitos')
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
      setMfaError('Código incorrecto. Intenta de nuevo.')
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
      setMfaError('No se pudo desactivar MFA. Intenta de nuevo.')
      return
    }

    setMfaFactorId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Seguridad de la cuenta</h1>
        <p className="text-sm text-gray-400 mb-6">Protege el acceso a tu cuenta de MercadoRD</p>

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Cambiar contraseña</h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              value={passwordNew}
              onChange={e => setPasswordNew(e.target.value)}
              placeholder="Contraseña nueva"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
            />
            <input
              type="password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              placeholder="Confirma la contraseña nueva"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
            />

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2">
                ✓ Contraseña actualizada correctamente
              </div>
            )}

            <button
              type="submit"
              disabled={passwordSaving}
              style={{ background: passwordSaving ? '#ccc' : BRAND.blue }}
              className="w-full text-white font-medium py-2.5 rounded-lg text-sm border-none cursor-pointer"
            >
              {passwordSaving ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>

        {/* MFA */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Autenticación de dos factores (MFA)</h2>

          {mfaError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
              {mfaError}
            </div>
          )}

          {mfaFactorId && !enrolling ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: BRAND.green }}>
                MFA activado ✓
              </span>
              <button
                onClick={handleUnenroll}
                disabled={mfaBusy}
                className="text-sm font-semibold underline bg-transparent border-none cursor-pointer"
                style={{ color: BRAND.red }}
              >
                {mfaBusy ? 'Desactivando...' : 'Desactivar'}
              </button>
            </div>
          ) : enrolling ? (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                Escanea este código QR con Google Authenticator (o una app similar) y luego ingresa el código de 6 dígitos.
              </p>

              {qrCode && (
                <div className="flex justify-center mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="Código QR para MFA" className="w-44 h-44 border border-gray-100 rounded-lg" />
                </div>
              )}

              <form onSubmit={handleVerify} className="flex gap-2">
                <input
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Código de 6 dígitos"
                  inputMode="numeric"
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none tracking-widest"
                />
                <button
                  type="submit"
                  disabled={mfaBusy}
                  style={{ background: mfaBusy ? '#ccc' : BRAND.blue }}
                  className="text-white font-medium px-5 rounded-lg text-sm border-none cursor-pointer"
                >
                  Confirmar
                </button>
              </form>
              <button
                onClick={handleCancelEnroll}
                className="text-xs text-gray-400 underline bg-transparent border-none cursor-pointer mt-3"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                Agrega una capa extra de seguridad pidiendo un código de tu app de autenticación al iniciar sesión.
              </p>
              <button
                onClick={handleEnrollStart}
                disabled={mfaBusy}
                style={{ background: mfaBusy ? '#ccc' : BRAND.blue }}
                className="text-white font-medium px-5 py-2.5 rounded-lg text-sm border-none cursor-pointer"
              >
                {mfaBusy ? 'Iniciando...' : 'Activar MFA'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
