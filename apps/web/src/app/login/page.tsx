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
  const { signInWithEmail } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
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
