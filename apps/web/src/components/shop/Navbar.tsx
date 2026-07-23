'use client'
// ============================================================
// MercadoRD — Navbar
// Ruta: src/components/shop/Navbar.tsx
// ============================================================
// Cambios vs versión anterior:
//   - Muestra avatar/nombre del usuario si hay sesión activa
//   - Badge del carrito lee Zustand (no hardcodeado)
//   - style jsx reemplazado por clases Tailwind (breakpoint unificado a md/860px via config)
//   - Breakpoint unificado: md = 860px en tailwind.config.js
// ============================================================

import { Search, ChevronDown, ShoppingCart, User, LogOut, LayoutDashboard, ShieldCheck, Heart, MessageCircle, Lock, HelpCircle } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { useCartStore, useCartItemCount } from '@/lib/store/cart'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, Province } from '@/types/database.types'
import { useLocationStore } from '@/lib/store/location'
import { NotificationBell } from '@/components/shop/NotificationBell'

export function Navbar() {
  const itemCount       = useCartItemCount()
  const { user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [locationOpen, setLocationOpen] = useState(false)
  const { province, setProvince } = useLocationStore()

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('categories')
      .select('id, name, slug, emoji, sort_order')
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
    supabase
      .from('provinces_rd')
      .select('id, name, code')
      .order('name')
      .then(({ data }) => setProvinces(data ?? []))
  }, [])

  const locationLabel = province?.name ?? 'Rep. Dom.'

  const LocationSelector = ({ compact }: { compact?: boolean }) => (
    <div className="relative">
      <div
        onClick={() => setLocationOpen(o => !o)}
        className="flex items-center gap-1.5 cursor-pointer flex-shrink-0"
      >
        {!compact && (
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 11, color: BRAND.gray }}>Enviar a</div>
            <div className="flex items-center gap-0.5">
              <span style={{ fontSize: 13, fontWeight: 600, color: BRAND.dark }}>{locationLabel}</span>
              <ChevronDown size={14} color={BRAND.gray} />
            </div>
          </div>
        )}
        {compact && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: BRAND.gray }}>
            {locationLabel} <ChevronDown size={13} color={BRAND.gray} />
          </div>
        )}
      </div>

      {locationOpen && (
        <div
          className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-y-auto"
          style={{ minWidth: 200, maxHeight: 320 }}
        >
          <button
            onClick={() => { setProvince(null); setLocationOpen(false) }}
            className="flex items-center w-full px-4 py-2 text-sm text-left border-none bg-transparent cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ color: !province ? BRAND.blue : BRAND.dark, fontWeight: !province ? 700 : 400 }}
          >
            Rep. Dom. (todo el país)
          </button>
          <hr className="my-1 border-gray-100" />
          {provinces.map(p => (
            <button
              key={p.id}
              onClick={() => { setProvince(p); setLocationOpen(false) }}
              className="flex items-center w-full px-4 py-2 text-sm text-left border-none bg-transparent cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ color: province?.id === p.id ? BRAND.blue : BRAND.dark, fontWeight: province?.id === p.id ? 700 : 400 }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const displayName = profile?.full_name?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? 'Mi cuenta'

  const CartBadge = ({ size }: { size: number }) => (
    <a href='/cart' className="relative flex text-gray-800">
      <ShoppingCart size={size} />
      {itemCount > 0 && (
        <span
          className="absolute -top-1.5 -right-2 text-white rounded-full flex items-center justify-center"
          style={{ background: BRAND.red, width: 17, height: 17, fontSize: 10, fontWeight: 700 }}
        >
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </a>
  )

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #EAEAEA' }}>

      {/* ─── Desktop row ─────────────────────────────────── */}
      <div
        className="hidden md-860:flex items-center gap-5"
        style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 24px' }}
      >
        <a href='/' className="no-underline flex-shrink-0">
          <span style={{ fontWeight: 700, fontSize: 24, color: BRAND.blue }}>Mercado</span>
          <span style={{ fontWeight: 700, fontSize: 24, color: BRAND.red }}>RD</span>
        </a>

        {/* Búsqueda centrada */}
        <div className="flex-1 flex items-center justify-center gap-6 min-w-0">
          <div className="relative" style={{ flex: '0 1 560px', minWidth: 200 }}>
            <form action="/buscar" method="GET">
              <input
                type='text'
                name='q'
                placeholder='Buscar productos, tiendas...'
                style={{ width: '100%', border: '1px solid #E0E0E0', background: BRAND.bg, borderRadius: 24, padding: '11px 50px 11px 18px', fontSize: 14, outline: 'none', color: BRAND.dark, boxSizing: 'border-box' }}
              />
              <button type='submit' style={{ position: 'absolute', right: 4, top: 4, bottom: 4, width: 38, border: 'none', borderRadius: '50%', background: BRAND.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Search size={16} />
              </button>
            </form>
          </div>

          <LocationSelector />

          <NotificationBell />

          <CartBadge size={22} />
        </div>

        {/* Auth + CTA */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 text-sm font-medium cursor-pointer border-none bg-transparent"
                style={{ color: BRAND.dark }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: BRAND.blue }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </span>
                <ChevronDown size={14} color={BRAND.gray} />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
                  style={{ minWidth: 180 }}
                >
                  <a
                    href='/dashboard'
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm no-underline hover:bg-gray-50 transition-colors"
                    style={{ color: BRAND.dark }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard size={15} color={BRAND.gray} />
                    Mi dashboard
                  </a>
                  <a
                    href='/perfil/favoritos'
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm no-underline hover:bg-gray-50 transition-colors"
                    style={{ color: BRAND.dark }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Heart size={15} color={BRAND.gray} />
                    Mis favoritos ♡
                  </a>
                  <a
                    href='/mensajes'
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm no-underline hover:bg-gray-50 transition-colors"
                    style={{ color: BRAND.dark }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <MessageCircle size={15} color={BRAND.gray} />
                    Mensajes
                  </a>
                  <a
                    href='/perfil'
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm no-underline hover:bg-gray-50 transition-colors"
                    style={{ color: BRAND.dark }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={15} color={BRAND.gray} />
                    Mi perfil
                  </a>
                  {profile?.is_admin && (
                    <a
                      href='/admin'
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm no-underline hover:bg-gray-50 transition-colors"
                      style={{ color: BRAND.dark }}
                      onClick={() => setMenuOpen(false)}
                    >
                      <ShieldCheck size={15} color={BRAND.gray} />
                      Panel admin
                    </a>
                  )}
                  <a
                    href='/perfil/seguridad'
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm no-underline hover:bg-gray-50 transition-colors"
                    style={{ color: BRAND.dark }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Lock size={15} color={BRAND.gray} />
                    Seguridad 🔒
                  </a>
                  <a
                    href='/soporte'
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm no-underline hover:bg-gray-50 transition-colors"
                    style={{ color: BRAND.dark }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <HelpCircle size={15} color={BRAND.gray} />
                    Soporte
                  </a>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => { signOut(); setMenuOpen(false) }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left border-none bg-transparent cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ color: BRAND.red }}
                  >
                    <LogOut size={15} color={BRAND.red} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a href='/login' style={{ color: BRAND.dark, textDecoration: 'none', fontSize: 14, whiteSpace: 'nowrap' }}>
              Iniciar sesión
            </a>
          )}

          <a
            href='/vendor/register'
            style={{ background: BRAND.blue, color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}
          >
            Vender en RD
          </a>
        </div>
      </div>

      {/* ─── Mobile row ──────────────────────────────────── */}
      <div className="block md-860:hidden" style={{ padding: '12px 16px 10px' }}>
        <div className="flex items-center justify-between mb-2.5">
          <a href='/' className="no-underline">
            <span style={{ fontWeight: 700, fontSize: 20, color: BRAND.blue }}>Mercado</span>
            <span style={{ fontWeight: 700, fontSize: 20, color: BRAND.red }}>RD</span>
          </a>
          <div className="flex items-center gap-4">
            {user ? (
              <a href='/dashboard' className="flex items-center gap-1.5 no-underline" style={{ color: BRAND.dark }}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: BRAND.blue }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{displayName}</span>
              </a>
            ) : (
              <LocationSelector compact />
            )}
            <CartBadge size={21} />
          </div>
        </div>
        <div className="relative">
          <form action="/buscar" method="GET">
            <input
              type='text'
              name='q'
              placeholder='Buscar productos, tiendas...'
              style={{ width: '100%', border: '1px solid #E0E0E0', background: BRAND.bg, borderRadius: 24, padding: '10px 44px 10px 16px', fontSize: 13, outline: 'none', color: BRAND.dark, boxSizing: 'border-box' }}
            />
            <button type='submit' style={{ position: 'absolute', right: 3, top: 3, bottom: 3, width: 32, border: 'none', borderRadius: '50%', background: BRAND.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* ─── Category bar ────────────────────────────────── */}
      <div style={{ background: BRAND.blue }}>
        <div
          className="flex items-center overflow-x-auto"
          style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          <a href='/' style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.14)', flexShrink: 0, whiteSpace: 'nowrap' }}>
            ☰ Todas las categorías
          </a>
          {categories.map((cat) => (
            <a key={cat.id} href={`/categoria/${cat.slug}`} style={{ padding: '11px 16px', color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {cat.emoji} {cat.name}
            </a>
          ))}
          <a href='/vendor/register' style={{ padding: '11px 16px', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Vender en RD
          </a>
        </div>
      </div>
    </header>
  )
}
