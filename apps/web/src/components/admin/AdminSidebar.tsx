'use client'
// ============================================================
// MercadoRD — Sidebar del panel de administración (compartido)
// Ruta: src/components/admin/AdminSidebar.tsx
// ============================================================
// Mismo tratamiento responsive que components/vendor/DashboardSidebar.tsx:
// columna fija en desktop (≥860px), barra compacta + drawer en mobile.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { LanguageSwitcher } from '@/components/shop/LanguageSwitcher'
const NAV_ITEM_KEYS: { icon: string; labelKey: 'navOverview' | 'navProviders' | 'navPromotions' | 'navAudit'; href: string }[] = [
  { icon: '📊', labelKey: 'navOverview', href: '/admin' },
  { icon: '🏪', labelKey: 'navProviders', href: '/admin/proveedores' },
  { icon: '🖼️', labelKey: 'navPromotions', href: '/admin/promociones' },
  { icon: '📋', labelKey: 'navAudit', href: '/admin/auditoria' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const isMobile = useIsMobile(860)
  const { t } = useTranslation('admin')
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const navLink = (item: typeof NAV_ITEM_KEYS[number], i: number, onClick?: () => void) => {
    const active = pathname === item.href
    return (
      <a key={i} href={item.href} onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        borderLeft: active ? '2px solid #fff' : '2px solid transparent',
        color: active ? '#fff' : '#666', fontSize: 14, fontWeight: active ? 600 : 400,
        textDecoration: 'none',
      }}>
        <span>{item.icon}</span>{t(item.labelKey)}
      </a>
    )
  }

  const backLink = (onClick?: () => void) => (
    <a href="/dashboard" onClick={onClick} style={{ padding: '10px 20px', color: '#666', fontSize: 14, textDecoration: 'none' }}>
      {t('backToVendorPanelLink')}
    </a>
  )

  if (!isMobile) {
    return (
      <div style={{ background: '#0a0a0a', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #222', marginBottom: 16 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 4 }}>
              Mercado<span style={{ color: BRAND.red }}>RD</span>
            </div>
          </a>
          <div style={{ fontSize: 12, color: '#888' }}>{t('adminPanelLabel')}</div>
        </div>
        {NAV_ITEM_KEYS.map((item, i) => navLink(item, i))}
        {backLink()}
        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid #222' }}>
          <LanguageSwitcher />
        </div>
      </div>
    )
  }

  // Mobile — barra compacta + drawer con overlay
  return (
    <>
      <div style={{ background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#fff' }}>
            Mercado<span style={{ color: BRAND.red }}>RD</span>
          </div>
        </a>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('openMenuAria')}
          style={{ background: 'transparent', border: 'none', color: '#fff', display: 'flex', padding: 4, cursor: 'pointer' }}
        >
          <Menu size={22} />
        </button>
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }}>
          <div
            ref={drawerRef}
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, maxWidth: '80vw',
              background: '#0a0a0a', padding: '20px 0', display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 20px', borderBottom: '1px solid #222', marginBottom: 16 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>
                Mercado<span style={{ color: BRAND.red }}>RD</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('closeMenuAria')}
                style={{ background: 'transparent', border: 'none', color: '#888', display: 'flex', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            {NAV_ITEM_KEYS.map((item, i) => navLink(item, i, () => setOpen(false)))}
            {backLink(() => setOpen(false))}
            <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid #222' }}>
              <LanguageSwitcher compact />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
