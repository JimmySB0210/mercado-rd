'use client'
// ============================================================
// MercadoRD — Menú lateral del panel de administración (compartido)
// Ruta: src/components/admin/AdminSidebar.tsx
// ============================================================
// Agrupado por tema. Solo enlaza páginas que existen hoy: no hay entradas
// «próximamente» ni páginas vacías. Para añadir una sección nueva, basta una
// línea en ADMIN_NAV_GROUPS cuando exista su ruta.
//
// Este componente solo pinta el contenido del menú; AdminFrame lo coloca como
// columna fija (≥ 860 px) o dentro del cajón (móvil).
// ============================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, LayoutDashboard, LifeBuoy, Megaphone, Scale, ScrollText, ShieldAlert, Store, type LucideIcon } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'

type NavLabelKey = 'navOverview' | 'navPromotions' | 'navProviders' | 'navModeration' | 'navDisputes' | 'navHelpCenter' | 'navAudit'
type NavGroupKey = 'opsNav.groupGeneral' | 'opsNav.groupCommerce' | 'opsNav.groupPeople' | 'opsNav.groupTrust' | 'opsNav.groupSystem'

interface NavItem {
  href: string
  icon: LucideIcon
  labelKey: NavLabelKey
  /** Solo es la página actual si la ruta coincide exactamente (el Resumen es /admin, prefijo de todas las demás). */
  exact?: boolean
}

interface NavGroup {
  titleKey: NavGroupKey
  items: NavItem[]
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  { titleKey: 'opsNav.groupGeneral', items: [{ href: '/admin', icon: LayoutDashboard, labelKey: 'navOverview', exact: true }] },
  { titleKey: 'opsNav.groupCommerce', items: [{ href: '/admin/promociones', icon: Megaphone, labelKey: 'navPromotions' }] },
  { titleKey: 'opsNav.groupPeople', items: [{ href: '/admin/proveedores', icon: Store, labelKey: 'navProviders' }] },
  {
    titleKey: 'opsNav.groupTrust',
    items: [
      { href: '/admin/moderacion', icon: ShieldAlert, labelKey: 'navModeration' },
      { href: '/admin/disputas', icon: Scale, labelKey: 'navDisputes' },
      { href: '/admin/centro-ayuda', icon: LifeBuoy, labelKey: 'navHelpCenter' },
    ],
  },
  { titleKey: 'opsNav.groupSystem', items: [{ href: '/admin/auditoria', icon: ScrollText, labelKey: 'navAudit' }] },
]

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? ''
  const { t } = useTranslation('admin')

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`))

  return (
    <nav className="adm-nav" aria-label={t('opsNav.aria')}>
      <Link href="/" className="adm-brand" onClick={onNavigate}>
        <span>
          <span className="adm-brand-name">Mercado<b>RD</b></span>
          <span className="adm-brand-sub">{t('opsNav.panelLabel')}</span>
        </span>
      </Link>

      {ADMIN_NAV_GROUPS.map(group => (
        <div className="adm-nav-group" key={group.titleKey}>
          <p className="adm-nav-title" id={`adm-nav-${group.titleKey}`}>{t(group.titleKey)}</p>
          <ul className="adm-nav-list" aria-labelledby={`adm-nav-${group.titleKey}`}>
            {group.items.map(item => {
              const Icon = item.icon
              const active = isActive(item)
              return (
                <li key={item.href}>
                  <Link href={item.href} className="adm-nav-link" aria-current={active ? 'page' : undefined} onClick={onNavigate}>
                    <Icon size={18} aria-hidden="true" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      <div className="adm-nav-foot">
        <div className="adm-nav-foot-sep">
          <Link href="/dashboard" className="adm-back" onClick={onNavigate}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{t('opsNav.backToVendor')}</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
