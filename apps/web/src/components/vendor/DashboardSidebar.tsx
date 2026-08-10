'use client'
// ============================================================
// MercadoRD — Sidebar del dashboard de vendor (compartido)
// Ruta: src/components/vendor/DashboardSidebar.tsx
// ============================================================
// Desktop (≥860px): columna fija de 220px, sin cambios respecto a la
// versión original. Mobile (<860px): se colapsa a una barra compacta
// con botón de menú, que abre el nav completo como drawer + overlay.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { LanguageSwitcher } from '@/components/shop/LanguageSwitcher'
import type { DashboardDict } from '@/lib/i18n/es/dashboard'

const NAV_ITEM_KEYS: { icon: string; labelKey: keyof DashboardDict; href: string }[] = [
  { icon: '📊', labelKey: 'navSummary', href: '/dashboard' },
  { icon: '📦', labelKey: 'navMyProducts', href: '/dashboard/productos' },
  { icon: '🛒', labelKey: 'navOrders', href: '/dashboard/pedidos' },
  { icon: '💬', labelKey: 'navMessages', href: '/dashboard/mensajes' },
  { icon: '💰', labelKey: 'navIncome', href: '/dashboard/ingresos' },
  { icon: '🎟️', labelKey: 'navCoupons', href: '/dashboard/cupones' },
  { icon: '⭐', labelKey: 'navReviews', href: '/dashboard/resenas' },
  { icon: '👑', labelKey: 'navMyPlan', href: '/dashboard/plan' },
  { icon: '⚙️', labelKey: 'navSettings', href: '/dashboard/configuracion' },
]

export function DashboardSidebar() {
  const { t } = useTranslation('dashboard')
  const pathname = usePathname()
  const isMobile = useIsMobile(860)
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Cerrar el drawer al navegar
  useEffect(() => { setOpen(false) }, [pathname])

  // Cerrar al tocar/clickear afuera — mismo patrón que Navbar
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

  if (!isMobile) {
    return (
      <div style={{ background: '#111', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #222', marginBottom: 16 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 4 }}>
              Mercado<span style={{ color: BRAND.red }}>RD</span>
            </div>
          </a>
          <div style={{ fontSize: 12, color: '#555' }}>{t('vendorPanelLabel')}</div>
        </div>
        {NAV_ITEM_KEYS.map((item, i) => navLink(item, i))}
        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid #222' }}>
          <LanguageSwitcher />
        </div>
      </div>
    )
  }

  // Mobile — barra compacta + drawer con overlay
  return (
    <>
      <div style={{ background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#fff' }}>
            Mercado<span style={{ color: BRAND.red }}>RD</span>
          </div>
        </a>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('openPanelMenuAria')}
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
              background: '#111', padding: '20px 0', display: 'flex', flexDirection: 'column',
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
                aria-label={t('closePanelMenuAria')}
                style={{ background: 'transparent', border: 'none', color: '#888', display: 'flex', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            {NAV_ITEM_KEYS.map((item, i) => navLink(item, i, () => setOpen(false)))}
            <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid #222' }}>
              <LanguageSwitcher compact />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
