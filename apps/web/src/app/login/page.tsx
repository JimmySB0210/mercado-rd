'use client'
// ============================================================
// MercadoRD — Página de Login
// Archivo: app/login/page.tsx
// ============================================================

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { BRAND } from '@/lib/colors'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const reason = searchParams.get('reason')
  const { signInWithEmail, signInWithGoogle, signInWithFacebook } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signInWithEmail(email, password)

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : (typeof error.message === 'string' ? error.message : 'Error al iniciar sesión')
      )
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setError(null)
    setOauthLoading(provider)
    try {
      await (provider === 'google' ? signInWithGoogle() : signInWithFacebook())
    } catch {
      setError('No se pudo iniciar sesión. Intenta de nuevo.')
      setOauthLoading(null)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
      style={{ '--brand-blue': BRAND.blue, '--brand-red': BRAND.red } as React.CSSProperties}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold">
              <span className="text-white bg-[var(--brand-blue)] px-2 py-1 rounded">Mercado</span>
              <span className="text-[var(--brand-red)]">R</span>
              <span className="text-[var(--brand-blue)]">D</span>
            </span>
          </Link>
          <p className="mt-2 text-gray-500 text-sm">Inicia sesión en tu cuenta</p>
        </div>

        {reason === 'inactivity' && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-4 py-3">
            Tu sesión cerró automáticamente por inactividad. Inicia sesión de nuevo para continuar.
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Login social */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={oauthLoading !== null}
              className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-300 text-gray-800 font-medium py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {oauthLoading === 'google' ? 'Conectando...' : 'Continuar con Google'}
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('facebook')}
              disabled={oauthLoading !== null}
              className="w-full flex items-center justify-center gap-2.5 text-white font-medium py-2.5 rounded-lg hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: '#1877F2' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
              </svg>
              {oauthLoading === 'facebook' ? 'Conectando...' : 'Continuar con Facebook'}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <hr className="flex-1 border-gray-200" />
            <span className="text-xs text-gray-400 whitespace-nowrap">o continúa con</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand-red)] hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-[var(--brand-blue)] font-medium hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
          <strong>Cuentas de prueba:</strong><br />
          carlos@demo.mercadord.com / Demo1234!<br />
          maria@demo.mercadord.com / Demo1234!
        </div>
      </div>
    </main>
  )
}
