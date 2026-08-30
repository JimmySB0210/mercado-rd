// ============================================================
// MercadoRD — Middleware de autenticación
// Archivo: middleware.ts  (dentro de src/, junto a app/)
// ============================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar sesión — imprescindible para que no expire
  const { data: { user } } = await supabase.auth.getUser()

  // Cuenta eliminada (delete_own_account marca is_deleted = true, pero no
  // borra el usuario de Supabase Auth — SUPABASE_SERVICE_ROLE_KEY sigue
  // siendo un placeholder). Este chequeo a nivel de app es lo que
  // realmente bloquea el acceso: fuerza cierre de sesión en cualquier
  // request posterior a que la cuenta quedó marcada como eliminada.
  if (user) {
    const { data: profileRow } = await supabase
      .from('users')
      .select('is_deleted')
      .eq('id', user.id)
      .single()

    if (profileRow?.is_deleted) {
      await supabase.auth.signOut()
      const redirectResponse = NextResponse.redirect(new URL('/', request.url))
      supabaseResponse.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie)
      })
      return redirectResponse
    }
  }

  // Rutas protegidas — redirigir a login si no hay sesión
  const protectedPaths = ['/dashboard', '/checkout', '/perfil']
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Si ya está logueado, no dejarlo entrar a login/register
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/register'
  )) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
