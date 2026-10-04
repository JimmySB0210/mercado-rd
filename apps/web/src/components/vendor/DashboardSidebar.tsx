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
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { LanguageSwitcher } from '@/components/shop/LanguageSwitcher'
import { Logo } from '@/components/shop/Logo'
import type { DashboardDict } from '@/lib/i18n/es/dashboard'

// Mismos estados "sin despachar" que usa dashboard/page.tsx para
// "Necesita tu atención" -- el badge de Pedidos debe coincidir con esa
// misma definición, no con el total de pedidos.
const UNSHIPPED_STATUSES = ['pending', 'confirmed', 'preparing']

// Agrupado visualmente en 3 bloques (separador fino entre grupos,
// mismas rutas y permisos de siempre, cero cambios funcionales) --
// pedido explícito del brief: que se sienta como centro de negocio,
// no una lista plana de 9 links.
type NavItem = { icon: string; labelKey: keyof DashboardDict; href: string }
type NavGroup = { groupLabelKey: keyof DashboardDict | null; items: NavItem[] }

// Grupos según el panel de referencia: Resumen solo, después VENDER,
// CRECER y CUENTA con etiqueta. Mismas rutas y permisos de siempre.
const NAV_GROUPS: NavGroup[] = [
  {
    groupLabelKey: null,
    items: [{ icon: '📊', labelKey: 'navSummary', href: '/dashboard' }],
  },
  {
    groupLabelKey: 'navGroupSell',
    items: [
      { icon: '📦', labelKey: 'navMyProducts', href: '/dashboard/productos' },
      { icon: '🛒', labelKey: 'navOrders', href: '/dashboard/pedidos' },
      { icon: '💬', labelKey: 'navMessages', href: '/dashboard/mensajes' },
    ],
  },
  {
    groupLabelKey: 'navGroupGrow',
    items: [
      { icon: '💰', labelKey: 'navIncome', href: '/dashboard/ingresos' },
      { icon: '🎟️', labelKey: 'navCoupons', href: '/dashboard/cupones' },
      { icon: '⭐', labelKey: 'navReviews', href: '/dashboard/resenas' },
    ],
  },
  {
    groupLabelKey: 'navGroupAccount',
    items: [
      { icon: '👑', labelKey: 'navMyPlan', href: '/dashboard/plan' },
      { icon: '⚙️', labelKey: 'navSettings', href: '/dashboard/configuracion' },
    ],
  },
]
const NAV_ITEM_KEYS = NAV_GROUPS.flatMap(g => g.items)

export function DashboardSidebar() {
  const { t } = useTranslation('dashboard')
  const pathname = usePathname()
  const isMobile = useIsMobile(860)
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const [badges, setBadges] = useState({ pedidos: 0, mensajes: 0 })
  const [plan, setPlan] = useState<string | null>(null)

  // Sidebar sin layout compartido -- se monta solo en cada page.tsx de
  // /dashboard/*, así que trae sus propios datos (conteos reales de
  // pedidos sin despachar + mensajes sin responder, y el plan actual
  // para la tarjeta de upgrade) en vez de recibirlos por props.
  useEffect(() => {
    if (!user) return
    const supabase = createClient()

    supabase
      .from('vendors')
      .select('id, plan')
      .eq('user_id', user.id)
      .single()
      .then(async ({ data: vendor }) => {
        if (!vendor) return
        setPlan(vendor.plan)

        const [{ data: items }, { data: conversations }] = await Promise.all([
          supabase.from('order_items').select('order_id').eq('vendor_id', vendor.id),
          supabase.from('conversations').select('vendor_unread').eq('vendor_id', vendor.id).gt('vendor_unread', 0),
        ])

        const mensajes = (conversations ?? []).reduce((acc, c) => acc + (c.vendor_unread ?? 0), 0)

        const orderIds = [...new Set((items ?? []).map(i => i.order_id))]
        let pedidos = 0
        if (orderIds.length > 0) {
          const { data: orders } = await supabase
            .from('orders')
            .select('id')
            .in('id', orderIds)
            .in('status', UNSHIPPED_STATUSES)
          pedidos = orders?.length ?? 0
        }

        setBadges({ pedidos, mensajes })
      })
  }, [user])

  const badgeByHref: Record<string, number> = {
    '/dashboard/pedidos': badges.pedidos,
    '/dashboard/mensajes': badges.mensajes,
  }

  // Solo vendors en plan gratuito -- a alguien ya en Pro no tiene
  // sentido invitarlo a actualizar a algo que ya tiene.
  const showProCard = plan === 'free'

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
    const badgeCount = badgeByHref[item.href] ?? 0
    return (
      <a key={i} href={item.href} onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer',
        background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        borderLeft: active ? '2px solid #fff' : '2px solid transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: active ? 600 : 400,
        fontFamily: 'var(--font-body)', textDecoration: 'none', transition: 'background-color var(--transition-fast), color var(--transition-fast)',
      }}>
        <span>{item.icon}</span>
        <span style={{ flex: 1 }}>{t(item.labelKey)}</span>
        {badgeCount > 0 && (
          <span style={{
            background: 'var(--dashboard-yellow)', color: '#131A18', fontSize: 10.5, fontWeight: 800,
            padding: '1px 6px', borderRadius: 999, flexShrink: 0,
          }}>
            {badgeCount}
          </span>
        )}
      </a>
    )
  }

  const proCard = showProCard && (
    <div style={{
      margin: '0 16px 14px', padding: '14px', borderRadius: 12,
      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
        ✨ {t('sidebarProCardTitle')}
      </div>
      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', margin: '0 0 10px', lineHeight: 1.4 }}>
        {t('sidebarProCardBody')}
      </p>
      <a href="/dashboard/plan" style={{
        display: 'block', textAlign: 'center', background: 'var(--dashboard-yellow)', color: '#131A18',
        fontSize: 12, fontWeight: 800, padding: '7px 10px', borderRadius: 8, textDecoration: 'none',
      }}>
        {t('sidebarProCardCta')}
      </a>
    </div>
  )

  let globalIndex = 0
  const navGroups = (onClick?: () => void) => NAV_GROUPS.map((group, gi) => (
    <div key={gi} style={gi > 0 ? { marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.12)' } : undefined}>
      {group.groupLabelKey && (
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: 'rgba(255,255,255,0.55)', padding: '6px 20px 4px' }}>
          {t(group.groupLabelKey)}
        </div>
      )}
      {group.items.map(item => navLink(item, globalIndex++, onClick))}
    </div>
  ))

  if (!isMobile) {
    return (
      <div style={{ background: 'var(--dashboard-blue)', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.12)', marginBottom: 16 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <Logo variant="white" fontSize={18} />
          </a>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', marginTop: 6 }}>{t('vendorPanelLabel')}</div>
        </div>
        {navGroups()}
        <div style={{ marginTop: 'auto' }}>
          {proCard}
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    )
  }

  // Mobile — barra compacta + drawer con overlay
  return (
    <>
      <div style={{ background: 'var(--dashboard-blue)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <Logo variant="white" fontSize={16} />
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
              background: 'var(--dashboard-blue)', padding: '20px 0', display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.12)', marginBottom: 16 }}>
              <Logo variant="white" fontSize={18} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('closePanelMenuAria')}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', display: 'flex', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            {navGroups(() => setOpen(false))}
            <div style={{ marginTop: 'auto' }}>
              {proCard}
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <LanguageSwitcher compact />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
