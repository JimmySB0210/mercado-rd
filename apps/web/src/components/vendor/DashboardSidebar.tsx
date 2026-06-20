'use client'
// ============================================================
// MercadoRD — Sidebar del dashboard de vendor (compartido)
// Ruta: src/components/vendor/DashboardSidebar.tsx
// ============================================================

import { usePathname } from 'next/navigation'
import { BRAND } from '@/lib/colors'

const NAV_ITEMS = [
  { icon: '📊', label: 'Resumen', href: '/dashboard' },
  { icon: '📦', label: 'Mis Productos', href: '/dashboard/productos' },
  { icon: '🛒', label: 'Pedidos', href: '/dashboard/pedidos' },
  { icon: '💰', label: 'Ingresos', href: '/dashboard/ingresos' },
  { icon: '⭐', label: 'Reseñas', href: '/dashboard/resenas' },
  { icon: '⚙️', label: 'Configuración', href: '/dashboard/configuracion' },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div style={{ background: '#111', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #222', marginBottom: 16 }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 4 }}>
            Mercado<span style={{ color: BRAND.red }}>RD</span>
          </div>
        </a>
        <div style={{ fontSize: 12, color: '#555' }}>Panel del vendedor</div>
      </div>
      {NAV_ITEMS.map((item, i) => {
        const active = pathname === item.href
        return (
          <a
            key={i}
            href={item.href}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
              cursor: 'pointer',
              background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
              borderLeft: active ? '2px solid #fff' : '2px solid transparent',
              color: active ? '#fff' : '#666',
              fontSize: 14, fontWeight: active ? 600 : 400,
              textDecoration: 'none',
            }}
          >
            <span>{item.icon}</span>{item.label}
          </a>
        )
      })}
    </div>
  )
}
