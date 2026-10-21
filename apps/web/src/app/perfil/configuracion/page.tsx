'use client'
// ============================================================
// MercadoRD — Configuración de la cuenta
// Ruta: src/app/perfil/configuracion/page.tsx
// ============================================================
// Reúne en un solo lugar lo que hoy se puede configurar de verdad:
// Seguridad (enlace a /perfil/seguridad), Preferencias (idioma),
// Notificaciones (avisos del navegador) y Privacidad (documentos legales
// y eliminación de la cuenta). No guarda nada propio y no existen ajustes
// por tipo de notificación ni de visibilidad, así que no se dibujan
// controles de adorno.
// OJO: /dashboard/configuracion es otra cosa (ajustes de la tienda del
// vendedor); esta es la configuración de la cuenta de cualquier usuario.
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, ChevronRight, Eye, FileText, Scale, ShieldCheck, SlidersHorizontal, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useLanguageStore, type Language } from '@/lib/store/language'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { PushNotificationButton } from '@/components/shop/PushNotificationButton'
import { ProfileCard, FOCUS_RING } from '@/components/profile/ProfileCard'

const ROW_BORDER = 'border-b border-[color:var(--color-divider)] last:border-b-0'

// Cada idioma se nombra en su propio idioma: estos textos no se traducen.
const LANGUAGE_OPTIONS: { code: Language; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
]

export default function ConfiguracionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')
  const language = useLanguageStore(s => s.language)
  const setLanguage = useLanguageStore(s => s.setLanguage)

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/perfil/configuracion')
  }, [user, loading, router])

  // Mismo guardado que LanguageSwitcher: el idioma cambia al instante en este
  // navegador y se sincroniza con la cuenta sin bloquear (RPC update_own_language).
  const handleLanguageChange = (code: Language) => {
    setLanguage(code)
    createClient().rpc('update_own_language', { p_language: code }).then(({ error }) => {
      if (error) console.error('[ConfiguracionPage] update_own_language falló:', error.message)
    })
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-bg-main)' }}>
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-ui" style={{ color: 'var(--color-text-secondary)' }}>{t('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-main)' }}>
      <Navbar />

      <main className="max-w-[1100px] mx-auto px-4 py-6 md-860:py-8">
        <header className="mb-5">
          <h1 className="text-h1 font-bold" style={{ color: 'var(--color-text-primary)', letterSpacing: 'var(--tracking-heading)' }}>{tc('settings')}</h1>
          <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>{t('settingsPageSubtitle')}</p>
        </header>

        <div className="grid gap-4 md-860:grid-cols-2">

          {/* Seguridad: todo lo editable vive en /perfil/seguridad */}
          <ProfileCard title={t('securitySectionTitle')} icon={ShieldCheck} action={{ label: t('manageLink'), href: '/perfil/seguridad' }}>
            <p className="text-ui" style={{ color: 'var(--color-text-secondary)' }}>{t('settingsSecurityText')}</p>
          </ProfileCard>

          {/* Preferencias: hoy la única preferencia guardada es el idioma */}
          <ProfileCard title={t('settingsPreferencesTitle')} icon={SlidersHorizontal}>
            <fieldset>
              <legend className="text-ui font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('settingsLanguageLabel')}</legend>
              <p className="text-small mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{t('settingsLanguageHint')}</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {LANGUAGE_OPTIONS.map(({ code, label }) => {
                  const selected = language === code
                  return (
                    <label key={code} className="block cursor-pointer">
                      <input
                        type="radio"
                        name="language"
                        value={code}
                        checked={selected}
                        onChange={() => handleLanguageChange(code)}
                        className="peer sr-only"
                      />
                      <span
                        className="flex items-center justify-center gap-2 min-h-[44px] px-3 text-ui whitespace-nowrap transition-colors border border-[color:var(--color-border)] bg-[color:var(--color-card-bg)] text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-primary-subtle)] peer-checked:border-[color:var(--color-primary)] peer-checked:bg-[color:var(--color-primary-subtle)] peer-checked:text-[color:var(--color-primary)] peer-checked:font-semibold peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--color-primary)] peer-focus-visible:ring-offset-2"
                        style={{ borderRadius: 'var(--radius-control)' }}
                      >
                        {selected && <Check size={16} aria-hidden />}
                        {label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </ProfileCard>

          <NotificationsCard />

          {/* Privacidad: documentos legales y dónde se elimina la cuenta */}
          <ProfileCard title={t('settingsPrivacyTitle')} icon={Eye}>
            <ul className="-mx-2">
              <SettingsLinkRow href="/privacidad" icon={FileText} label={tc('privacyPolicy')} />
              <SettingsLinkRow href="/terminos" icon={Scale} label={tc('terms')} />
              <SettingsLinkRow href="/perfil/seguridad" icon={Trash2} label={t('deleteAccountTitle')} hint={t('settingsDeleteAccountHint')} />
            </ul>
          </ProfileCard>
        </div>
      </main>
    </div>
  )
}

// Avisos del navegador (web push). El botón existente devuelve null si el
// navegador no los admite o si el permiso está bloqueado; en ese caso se
// muestra el aviso de abajo (hermano con peer-empty, sin duplicar la
// detección). `mounted` evita que ese aviso parpadee antes de que el botón
// compruebe el navegador.
function NotificationsCard() {
  const { t } = useTranslation('profile')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <ProfileCard title={t('settingsNotificationsTitle')} icon={Bell}>
      <p className="text-ui" style={{ color: 'var(--color-text-secondary)' }}>{t('settingsNotificationsText')}</p>
      <div className="peer mt-3 empty:hidden"><PushNotificationButton /></div>
      {mounted && (
        <p className="hidden peer-empty:block mt-3 text-small" style={{ color: 'var(--color-text-secondary)' }}>
          {t('settingsNotificationsUnavailable')}
        </p>
      )}
    </ProfileCard>
  )
}

function SettingsLinkRow({ href, icon: Icon, label, hint }: { href: string; icon: LucideIcon; label: string; hint?: string }) {
  return (
    <li className={ROW_BORDER}>
      <a
        href={href}
        className={`flex items-center gap-3 min-h-[52px] px-2 py-1.5 no-underline transition-colors hover:bg-[color:var(--color-primary-subtle)] ${FOCUS_RING}`}
        style={{ borderRadius: 'var(--radius-control)' }}
      >
        <Icon size={18} aria-hidden style={{ color: 'var(--color-primary)' }} />
        <span className="flex-1 min-w-0">
          <span className="block text-ui font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
          {hint && <span className="block text-small" style={{ color: 'var(--color-text-secondary)' }}>{hint}</span>}
        </span>
        <ChevronRight size={16} aria-hidden style={{ color: 'var(--color-text-tertiary)' }} />
      </a>
    </li>
  )
}
