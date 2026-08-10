'use client'
// ============================================================
// MercadoRD — Página de perfil del usuario
// Ruta: src/app/perfil/page.tsx
// ============================================================

import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { PushNotificationButton } from '@/components/shop/PushNotificationButton'
import { User, Mail, Phone, MapPin, ShoppingBag, LogOut } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

export default function PerfilPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const { t } = useTranslation('profile')

  const [vendorInfo, setVendorInfo] = useState<{ business_name: string; logo_url: string | null } | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/perfil')
    }
  }, [user, loading, router])

  // Si el usuario también es vendor, su identidad visible es la de la
  // tienda (nombre, logo, badge) — nunca una identidad personal
  // separada. Si no es vendor, se mantiene el comportamiento personal.
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase
      .from('vendors')
      .select('business_name, logo_url')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setVendorInfo(data ?? null))
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">{t('loading')}</div>
      </div>
    )
  }

  if (!user) return null

  const displayName = vendorInfo?.business_name || profile?.full_name || user.email?.split('@')[0] || t('defaultUserName')
  const initial = displayName.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Avatar y nombre */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden"
            style={{ background: vendorInfo?.logo_url ? 'transparent' : BRAND.blue }}
          >
            {vendorInfo?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vendorInfo.logo_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
            <span
              className="inline-block mt-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full text-white"
              style={{ background: BRAND.blue }}
            >
              {vendorInfo ? t('roleVendor') : t('roleBuyer')}
            </span>
            <div className="mt-2">
              <PushNotificationButton />
            </div>
          </div>
        </div>

        {/* Info del perfil */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">{t('infoSectionTitle')}</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User size={16} color={BRAND.gray} />
              <div>
                <p className="text-xs text-gray-400">{t('nameLabel')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} color={BRAND.gray} />
              <div>
                <p className="text-xs text-gray-400">{t('emailLabel')}</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} color={BRAND.gray} />
              <div>
                <p className="text-xs text-gray-400">{t('phoneLabel')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile?.phone || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={16} color={BRAND.gray} />
              <div>
                <p className="text-xs text-gray-400">{t('provinceLabel')}</p>
                <p className="text-sm font-medium text-gray-900">{t('dominicanRepublic')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 mb-4">
          <a
            href="/perfil/pedidos"
            className="flex items-center justify-between px-6 py-4 no-underline hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={18} color={BRAND.blue} />
              <span className="text-sm font-medium text-gray-900">{t('myOrdersLink')}</span>
            </div>
            <span className="text-gray-300 text-lg">›</span>
          </a>
          <a
            href="/vendor/register"
            className="flex items-center justify-between px-6 py-4 no-underline hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded flex items-center justify-center text-white"
                style={{ background: BRAND.blue, fontSize: 10, fontWeight: 700 }}
              >
                V
              </div>
              <span className="text-sm font-medium text-gray-900">{t('sellOnMercadoRD')}</span>
            </div>
            <span className="text-gray-300 text-lg">›</span>
          </a>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-medium transition-colors hover:bg-red-50"
          style={{ borderColor: BRAND.red, color: BRAND.red }}
        >
          <LogOut size={16} />
          {t('signOutButton')}
        </button>

      </main>
    </div>
  )
}
