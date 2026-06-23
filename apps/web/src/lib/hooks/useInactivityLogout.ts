'use client'
// ============================================================
// MercadoRD — Logout automático por inactividad
// Archivo: lib/hooks/useInactivityLogout.ts
// ============================================================
// Pensado para montarse UNA sola vez (en InactivityWarning, dentro
// del layout raíz). useAuth() no usa Context — cada componente que lo
// llama tiene su propio estado — así que el timer vive aquí, aislado,
// y no en useAuth, para evitar timers/avisos duplicados y
// desincronizados por cada componente que use useAuth().
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const INACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const
const WARNING_AFTER_MS = 28 * 60 * 1000
const LOGOUT_AFTER_MS = 30 * 60 * 1000

export function useInactivityLogout() {
  const router = useRouter()
  const supabase = createClient()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current)
    if (logoutTimer.current) clearTimeout(logoutTimer.current)
  }, [])

  const handleLogout = useCallback(async () => {
    clearTimers()
    await supabase.auth.signOut()
    router.push('/login?reason=inactivity')
  }, [clearTimers, router, supabase])

  const resetTimers = useCallback(() => {
    clearTimers()
    setShowWarning(false)
    warningTimer.current = setTimeout(() => setShowWarning(true), WARNING_AFTER_MS)
    logoutTimer.current = setTimeout(handleLogout, LOGOUT_AFTER_MS)
  }, [clearTimers, handleLogout])

  // Sesión activa — solo corre el timer si hay un usuario autenticado
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers()
      setShowWarning(false)
      return
    }

    resetTimers()
    INACTIVITY_EVENTS.forEach(event => window.addEventListener(event, resetTimers))

    return () => {
      clearTimers()
      INACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, resetTimers))
    }
  }, [isAuthenticated, resetTimers, clearTimers])

  return { showWarning, dismissWarning: resetTimers }
}
