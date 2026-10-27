'use client'
// ============================================================
// MercadoRD — Barra superior del panel de administración
// Ruta: src/components/admin/AdminTopbar.tsx
// ============================================================
// Idioma, notificaciones y perfil del propio administrador. Las notificaciones
// son las de siempre (NotificationBell: solo lee las del usuario conectado);
// el perfil enlaza a /perfil, sin tocar la autenticación.
//
// La búsqueda administrativa NO está aquí todavía: se añadirá con su propio
// lote (necesita buscar solo registros que el admin puede ver y sanear lo que
// se escribe). Hasta entonces no se muestra un campo que no hace nada.
// ============================================================

import { forwardRef } from 'react'
import Link from 'next/link'
import { Menu, ShieldCheck } from 'lucide-react'
import { NotificationBell } from '@/components/shop/NotificationBell'
import { LanguageSwitcher } from '@/components/shop/LanguageSwitcher'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { initialsOf } from '@/lib/admin/ops'

interface Props {
  adminName: string | null
  menuOpen: boolean
  onMenu: () => void
}

export const AdminTopbar = forwardRef<HTMLButtonElement, Props>(function AdminTopbar({ adminName, menuOpen, onMenu }, menuRef) {
  const { t } = useTranslation('admin')
  const displayName = adminName?.trim() || t('opsNav.roleAdmin')

  return (
    <header className="adm-top">
      <button
        ref={menuRef}
        type="button"
        className="adm-menu-btn"
        onClick={onMenu}
        aria-label={t('openMenuAria')}
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        aria-controls="adm-drawer"
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <Link href="/" className="adm-top-brand">Mercado<b>RD</b></Link>
      <span className="adm-top-label">
        <ShieldCheck size={16} aria-hidden="true" />
        {t('opsNav.panelLabel')}
      </span>

      <div className="adm-top-right">
        <LanguageSwitcher compact />
        <NotificationBell />
        <Link href="/perfil" className="adm-profile" aria-label={t('opsNav.profileAria', { name: displayName })}>
          <span className="adm-avatar" aria-hidden="true">{initialsOf(adminName)}</span>
          <span className="adm-profile-text">
            <strong>{displayName}</strong>
            <small>{t('opsNav.roleAdmin')}</small>
          </span>
        </Link>
      </div>
    </header>
  )
})
