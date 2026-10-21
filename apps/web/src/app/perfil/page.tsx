'use client'
// ============================================================
// MercadoRD — Página de perfil del usuario ("Mi cuenta")
// Ruta: src/app/perfil/page.tsx
// ============================================================
// Solo lectura: muestra identidad, estado del perfil, contadores,
// datos personales, seguridad y accesos. Todo lo editable vive en
// /perfil/seguridad (teléfono, correo, contraseña, dos pasos); nombre,
// provincia y foto no se pueden editar hoy desde el navegador.
// Contadores: consultas pequeñas en paralelo, una vez por usuario, sin
// realtime. Si una falla se muestra "—".
// ============================================================

import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { PushNotificationButton } from '@/components/shop/PushNotificationButton'
import { ProfileCard, FOCUS_RING } from '@/components/profile/ProfileCard'
import { ProfileStatCard } from '@/components/profile/ProfileStatCard'
import {
  User, Mail, Phone, MapPin, ShoppingBag, Truck, Heart, MessageCircle, ShieldCheck, KeyRound,
  Gift, History, AlertTriangle, LifeBuoy, LayoutDashboard, Store, LogOut, ChevronRight,
  CheckCircle2, Info, Pencil, LayoutGrid, Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useLanguageStore } from '@/lib/store/language'
import { formatPhone } from '@/lib/phone'
import { formatDate } from '@/lib/utils'

// Pedidos "en curso": aún no entregados ni cancelados.
const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'shipped']

const ROW_BORDER = 'border-b border-[color:var(--color-divider)] last:border-b-0'

type Count = number | null // null = la consulta falló
interface Stats { orders: Count; active: Count; favorites: Count; unread: Count }
interface VendorInfo { id: string; business_name: string; logo_url: string | null }

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

function Skeleton({ className }: { className: string }) {
  return <span className={`block animate-pulse ${className}`} style={{ background: 'var(--color-divider)', borderRadius: 'var(--radius-control)' }} />
}

export default function PerfilPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')
  const language = useLanguageStore(s => s.language)

  // undefined = cargando; null = no es vendedor.
  const [vendor, setVendor] = useState<VendorInfo | null | undefined>(undefined)
  const [stats, setStats] = useState<Stats | null>(null)
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null | undefined>(undefined)
  const [provinceName, setProvinceName] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/perfil')
    }
  }, [user, loading, router])

  const userId = user?.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const supabase = createClient()
    const headCount = (res: { count: number | null; error: unknown }): Count => (res.error ? null : res.count ?? 0)

    const load = async () => {
      const [vendorRes, ordersRes, activeRes, favoritesRes, buyerConvsRes, factorsRes] = await Promise.all([
        // maybeSingle: un comprador no tiene fila en vendors (con .single()
        // eso era un 406 en la consola).
        supabase.from('vendors').select('id, business_name, logo_url').eq('user_id', userId).maybeSingle(),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ACTIVE_ORDER_STATUSES),
        supabase.from('wishlists').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('conversations').select('buyer_unread').eq('buyer_id', userId),
        supabase.auth.mfa.listFactors(),
      ])
      if (vendorRes.error) console.error('[PerfilPage] vendors', vendorRes.error)
      const vendorRow = (vendorRes.data as VendorInfo | null) ?? null

      // Mensajes sin leer: como las dos pestañas de /mensajes.
      let unread: Count = buyerConvsRes.error
        ? null
        : (buyerConvsRes.data ?? []).reduce((acc, c) => acc + (c.buyer_unread ?? 0), 0)
      if (vendorRow && unread !== null) {
        const { data, error } = await supabase.from('conversations').select('vendor_unread').eq('vendor_id', vendorRow.id)
        unread = error ? null : unread + (data ?? []).reduce((acc, c) => acc + (c.vendor_unread ?? 0), 0)
      }

      if (cancelled) return
      setVendor(vendorRow)
      setStats({ orders: headCount(ordersRes), active: headCount(activeRes), favorites: headCount(favoritesRes), unread })
      // Misma regla que /perfil/seguridad: factor TOTP verificado.
      setMfaEnabled(factorsRes.error ? null : !!factorsRes.data.totp.find(f => f.status === 'verified'))
    }

    load().catch(err => {
      console.error('[PerfilPage] load', err)
      if (cancelled) return
      setVendor(v => (v === undefined ? null : v))
      setStats({ orders: null, active: null, favorites: null, unread: null })
      setMfaEnabled(null)
    })
    return () => { cancelled = true }
  }, [userId])

  // Provincia: solo si el usuario la tiene (hoy nadie puede fijarla).
  const provinceId = profile?.province_id ?? null
  useEffect(() => {
    if (!provinceId) { setProvinceName(null); return }
    createClient().from('provinces_rd').select('name').eq('id', provinceId).maybeSingle()
      .then(({ data }) => setProvinceName(data?.name ?? null))
  }, [provinceId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-main)' }}>
        <div className="text-ui" style={{ color: 'var(--color-text-tertiary)' }}>{t('loading')}</div>
      </div>
    )
  }

  if (!user) return null

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const fullName = profile?.full_name || user.email?.split('@')[0] || t('defaultUserName')
  // Si el usuario es vendedor, su identidad visible es la de la tienda
  // (nombre y logo), nunca una identidad personal separada.
  const displayName = vendor?.business_name || fullName
  const avatarUrl = vendor ? vendor.logo_url : profile?.avatar_url ?? null
  const avatarFallback = vendor ? vendor.business_name.charAt(0).toUpperCase() : initialsOf(fullName)
  const emailVerified = !!user.email_confirmed_at
  const phone = formatPhone(profile?.phone)
  const memberSince = profile?.created_at
    ? formatDate(profile.created_at, language, { month: 'long', year: 'numeric', timeZone: 'America/Santo_Domingo' })
    : null
  const isVendorKnown = vendor !== undefined
  const phoneMissing = !!profile && !phone

  const shortcuts: { href: string; label: string; icon: LucideIcon }[] = [
    { href: '/perfil/lista-regalos', label: t('giftListsPageTitle'), icon: Gift },
    { href: '/perfil/historial', label: t('historyPageTitle'), icon: History },
    { href: '/perfil/disputas', label: t('disputesPageTitle'), icon: AlertTriangle },
    { href: '/perfil/configuracion', label: tc('settings'), icon: Settings },
    { href: '/soporte', label: tc('support'), icon: LifeBuoy },
  ]
  if (isVendorKnown) {
    shortcuts.push(vendor
      ? { href: '/dashboard', label: tc('myDashboard'), icon: LayoutDashboard }
      : { href: '/vendor/register', label: t('sellOnMercadoRD'), icon: Store })
  }

  const chipStyle = { borderRadius: 'var(--radius-pill)' }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-main)' }}>
      <Navbar />

      <main className="max-w-[1100px] mx-auto px-4 py-6 md-860:py-8">

        {/* A. Encabezado */}
        <header className="mb-5">
          <h1 className="text-h1 font-bold" style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-heading)' }}>{t('accountPageTitle')}</h1>
          <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>{t('accountPageSubtitle')}</p>
        </header>

        {/* B. Identidad */}
        <section
          className="p-5 md-860:p-6 flex flex-col md-860:flex-row md-860:items-center gap-4 md-860:gap-6"
          style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div
              className="w-16 h-16 md-860:w-20 md-860:h-20 flex items-center justify-center flex-shrink-0 overflow-hidden text-h2 font-bold"
              style={{
                borderRadius: 'var(--radius-pill)',
                background: avatarUrl ? 'var(--color-card-bg)' : 'var(--color-primary)',
                border: avatarUrl ? '1px solid var(--color-divider)' : 'none',
                color: 'var(--color-card-bg)',
              }}
              aria-hidden
            >
              {!isVendorKnown ? null : avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                avatarFallback
              )}
            </div>
            <div className="min-w-0 flex-1">
              {isVendorKnown ? (
                <p className="text-h3 font-bold break-words" style={{ color: 'var(--color-text-primary)' }}>{displayName}</p>
              ) : (
                <Skeleton className="h-6 w-48 max-w-full" />
              )}
              <p className="text-ui mt-0.5 break-all" style={{ color: 'var(--color-text-secondary)' }}>{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {isVendorKnown && (
                  <span className="inline-flex items-center px-2.5 py-1 text-caption font-semibold" style={{ ...chipStyle, background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
                    {vendor ? t('roleVendor') : t('roleBuyer')}
                  </span>
                )}
                {emailVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-caption font-semibold" style={{ ...chipStyle, background: 'var(--color-green-subtle)', color: 'var(--color-text-primary)' }}>
                    <CheckCircle2 size={14} aria-hidden style={{ color: 'var(--color-green)' }} />
                    {t('emailVerifiedChip')}
                  </span>
                )}
                {memberSince && (
                  <span className="inline-flex items-center px-2.5 py-1 text-caption font-medium" style={{ ...chipStyle, border: '1px solid var(--color-divider)', color: 'var(--color-text-secondary)' }}>
                    {t('memberSince', { date: memberSince })}
                  </span>
                )}
              </div>
              {profile?.member_id && (
                <p className="text-caption mt-2" style={{ color: 'var(--color-text-tertiary)' }}>{t('memberIdLabel', { id: profile.member_id })}</p>
              )}
              <div className="mt-2 empty:hidden">
                <PushNotificationButton />
              </div>
            </div>
          </div>
          <a
            href="/perfil/seguridad"
            className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-5 text-ui font-semibold no-underline transition-colors hover:bg-[color:var(--color-primary-hover)] md-860:self-center ${FOCUS_RING}`}
            style={{ background: 'var(--color-primary)', color: 'var(--color-card-bg)', borderRadius: 'var(--radius-control)' }}
          >
            <Pencil size={16} aria-hidden />
            {t('editMyDataButton')}
          </a>
        </section>

        {/* C. Estado del perfil */}
        {profile && (
          <div className="mt-4 flex flex-col gap-3">
            {phoneMissing && (
              <div
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4"
                style={{ background: 'var(--color-primary-subtle)', borderRadius: 'var(--radius-card)' }}
              >
                <span className="flex items-center justify-center flex-shrink-0 w-10 h-10" style={{ background: 'var(--color-card-bg)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }} aria-hidden>
                  <Phone size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ui font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('phoneMissingTitle')}</p>
                  <p className="text-small" style={{ color: 'var(--color-text-secondary)' }}>{t('phoneMissingBody')}</p>
                </div>
                <a
                  href="/perfil/seguridad"
                  className={`inline-flex items-center justify-center gap-1 min-h-[44px] px-4 text-ui font-semibold no-underline transition-colors hover:bg-[color:var(--color-primary-hover)] ${FOCUS_RING}`}
                  style={{ background: 'var(--color-primary)', color: 'var(--color-card-bg)', borderRadius: 'var(--radius-control)' }}
                >
                  {t('addPhoneButton')}
                  <ChevronRight size={16} aria-hidden />
                </a>
              </div>
            )}
            {!emailVerified && (
              <div className="flex items-start gap-3 p-4" style={{ border: '1px solid var(--color-divider)', background: 'var(--color-card-bg)', borderRadius: 'var(--radius-card)' }}>
                <Info size={18} aria-hidden className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-secondary)' }} />
                <p className="text-small" style={{ color: 'var(--color-text-secondary)' }}>{t('emailUnverifiedNotice')}</p>
              </div>
            )}
            {!phoneMissing && emailVerified && (
              <p className="flex items-center gap-2 text-small font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                <CheckCircle2 size={16} aria-hidden style={{ color: 'var(--color-green)' }} />
                {t('profileCompleteLine')}
              </p>
            )}
          </div>
        )}

        {/* D. Resumen */}
        <section aria-label={t('summaryTitle')} className="mt-4 grid grid-cols-2 md-860:grid-cols-4 gap-3 md-860:gap-4">
          <ProfileStatCard label={t('myOrdersLink')} value={stats?.orders} href="/perfil/pedidos" icon={ShoppingBag} />
          <ProfileStatCard label={t('statActiveOrders')} value={stats?.active} href="/perfil/pedidos" icon={Truck} />
          <ProfileStatCard label={t('statFavorites')} value={stats?.favorites} href="/perfil/favoritos" icon={Heart} />
          <ProfileStatCard label={t('statUnreadMessages')} value={stats?.unread} href="/mensajes" icon={MessageCircle} />
        </section>

        <div className="mt-4 grid gap-4 md-860:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">

          {/* G. Accesos */}
          <ProfileCard title={t('shortcutsTitle')} icon={LayoutGrid}>
            <ul className="-mx-2">
              {shortcuts.map(({ href, label, icon: Icon }) => (
                <li key={href} className={ROW_BORDER}>
                  <a
                    href={href}
                    className={`flex items-center gap-3 min-h-[52px] px-2 no-underline transition-colors hover:bg-[color:var(--color-primary-subtle)] ${FOCUS_RING}`}
                    style={{ borderRadius: 'var(--radius-control)' }}
                  >
                    <Icon size={18} aria-hidden style={{ color: 'var(--color-primary)' }} />
                    <span className="flex-1 min-w-0 truncate text-ui font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
                    <ChevronRight size={16} aria-hidden style={{ color: 'var(--color-text-tertiary)' }} />
                  </a>
                </li>
              ))}
              {!isVendorKnown && (
                <li className={`flex items-center min-h-[52px] px-2 ${ROW_BORDER}`}>
                  <Skeleton className="h-4 w-40" />
                </li>
              )}
            </ul>
            <button
              type="button"
              onClick={handleSignOut}
              className={`mt-4 w-full inline-flex items-center justify-center gap-2 min-h-[44px] text-ui font-semibold transition-colors hover:bg-[color:var(--color-bg-main)] ${FOCUS_RING}`}
              style={{ border: '1px solid var(--brand-red)', color: 'var(--brand-red)', borderRadius: 'var(--radius-control)', background: 'var(--color-card-bg)' }}
            >
              <LogOut size={16} aria-hidden />
              {t('signOutButton')}
            </button>
          </ProfileCard>

          <div className="flex flex-col gap-4 min-w-0">
            {/* E. Información personal */}
            <ProfileCard title={t('infoSectionTitle')} icon={User} action={{ label: t('editLink'), href: '/perfil/seguridad' }}>
              <div className="flex flex-col">
                <InfoRow icon={User} label={t('nameLabel')}>
                  <span className="break-words">{profile?.full_name || '—'}</span>
                </InfoRow>
                <InfoRow icon={Mail} label={t('emailLabel')} badge={emailVerified ? t('verifiedBadge') : undefined}>
                  <span className="[overflow-wrap:anywhere]">{user.email}</span>
                </InfoRow>
                <InfoRow icon={Phone} label={t('phoneLabel')}>
                  {phone ? phone : (
                    <span className="flex flex-wrap items-center gap-x-2">
                      <span style={{ color: 'var(--color-text-tertiary)' }}>{t('notAddedLabel')}</span>
                      <a href="/perfil/seguridad" className={`text-small font-semibold hover:underline ${FOCUS_RING}`} style={{ color: 'var(--color-primary)' }}>{t('addLink')}</a>
                    </span>
                  )}
                </InfoRow>
                {provinceName && (
                  <InfoRow icon={MapPin} label={t('provinceLabel')}>{provinceName}</InfoRow>
                )}
              </div>
            </ProfileCard>

            {/* F. Seguridad */}
            <ProfileCard title={t('securitySectionTitle')} icon={ShieldCheck} action={{ label: t('manageLink'), href: '/perfil/seguridad' }}>
              <div className="flex flex-col">
                <StatusRow icon={Mail} label={t('emailLabel')} ok={emailVerified} okText={t('verifiedBadge')} offText={t('notVerifiedLabel')} />
                <StatusRow
                  icon={KeyRound}
                  label={t('twoFactorLabel')}
                  ok={mfaEnabled}
                  okText={t('twoFactorOn')}
                  offText={t('twoFactorOff')}
                />
              </div>
            </ProfileCard>
          </div>
        </div>
      </main>
    </div>
  )
}

function InfoRow({ icon: Icon, label, badge, children }: { icon: LucideIcon; label: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className={`flex items-start gap-3 py-3 ${ROW_BORDER}`}>
      <Icon size={18} aria-hidden className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-tertiary)' }} />
      <div className="min-w-0 flex-1">
        {/* El badge va junto a la etiqueta para que el valor (ej. un
            correo largo) use todo el ancho en móvil. */}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
          {label}
          {badge && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-caption font-semibold" style={{ background: 'var(--color-green-subtle)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-pill)' }}>
              <CheckCircle2 size={12} aria-hidden style={{ color: 'var(--color-green)' }} />
              {badge}
            </span>
          )}
        </p>
        <div className="text-ui font-medium" style={{ color: 'var(--color-text-primary)' }}>{children}</div>
      </div>
    </div>
  )
}

// ok: true / false; null = no se pudo leer ("—"); undefined = cargando.
function StatusRow({ icon: Icon, label, ok, okText, offText }: { icon: LucideIcon; label: string; ok: boolean | null | undefined; okText: string; offText: string }) {
  return (
    <div className={`flex items-center gap-3 min-h-[48px] py-2 ${ROW_BORDER}`}>
      <Icon size={18} aria-hidden className="flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
      <p className="flex-1 min-w-0 text-ui" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
      <div className="flex-shrink-0">
        {ok === undefined ? (
          <Skeleton className="h-4 w-20" />
        ) : ok === null ? (
          <span className="text-small" style={{ color: 'var(--color-text-tertiary)' }}>—</span>
        ) : ok ? (
          <span className="inline-flex items-center gap-1 text-small font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            <CheckCircle2 size={14} aria-hidden style={{ color: 'var(--color-green)' }} />
            {okText}
          </span>
        ) : (
          <span className="text-small font-medium" style={{ color: 'var(--color-text-secondary)' }}>{offText}</span>
        )}
      </div>
    </div>
  )
}
