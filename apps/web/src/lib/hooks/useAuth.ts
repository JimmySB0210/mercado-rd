'use client'
// ============================================================
// MercadoRD — Hook de autenticación
// Archivo: lib/hooks/useAuth.ts
// ============================================================
// USO:
//   const { user, profile, loading, signOut } = useAuth()
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types/database.types'

interface AuthState {
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  })

  const supabase = createClient()

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    return data as User | null
  }, [supabase])

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const profile = user ? await loadProfile(user.id) : null
      setState({ user, profile, loading: false })
    })

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null
        const profile = user ? await loadProfile(user.id) : null
        setState({ user, profile, loading: false })
      }
    )

    return () => subscription.unsubscribe()
  }, [loadProfile, supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
    setState({ user: null, profile: null, loading: false })
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    // Alerta de seguridad — fire and forget, no bloquea el login
    if (data.user && !error) {
      supabase.rpc('create_notification', {
        p_user_id: data.user.id,
        p_type: 'security_alert',
        p_title: 'Nuevo inicio de sesión 🔐',
        p_body: 'Iniciaste sesión en MercadoRD. Si no fuiste tú, cambia tu contraseña inmediatamente.',
        p_link: '/perfil/seguridad',
      }).then(({ error: notifyError }) => {
        if (notifyError) console.error('[useAuth] No se pudo crear la alerta de seguridad:', notifyError)
      })
    }

    return { data, error }
  }

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone ?? null,
        },
      },
    })
    return { data, error }
  }

  return {
    ...state,
    signOut,
    signInWithEmail,
    signUpWithEmail,
  }
}
