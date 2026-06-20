'use client'
// ============================================================
// MercadoRD — MobileTabBar
// Ruta: src/components/shop/MobileTabBar.tsx
// ============================================================

import { Home, LayoutGrid, User, MessageCircle, ShoppingCart } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCartStore, useCartItemCount } from '@/lib/store/cart'
import { BRAND } from '@/lib/colors'

const TABS = [
  { href: '/',           label: 'Inicio',     icon: Home          },
  { href: '/#categorias',label: 'Categorías', icon: LayoutGrid    },
  { href: '/login',      label: 'Cuenta',     icon: User          },
  { href: '/mensajes',   label: 'Mensajes',   icon: MessageCircle },
  { href: '/cart',       label: 'Carrito',    icon: ShoppingCart  },
]

export function MobileTabBar() {
  const pathname  = usePathname()
  const itemCount = useCartItemCount()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex md-860:hidden"
    >
      <div className="flex justify-around w-full pt-2 pb-safe">
        {TABS.map((tab) => {
          const Icon   = tab.icon
          const active = pathname === tab.href
          const color  = active ? BRAND.blue : BRAND.gray

          return (
            <a
              key={tab.label}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 px-2 no-underline"
              style={{
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                color,
              }}
            >
              <span className="relative flex">
                <Icon size={22} color={color} />
                {tab.label === 'Carrito' && itemCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1.5 text-white rounded-full
                               flex items-center justify-center"
                    style={{
                      background: BRAND.red,
                      width: 15,
                      height: 15,
                      fontSize: 8,
                      fontWeight: 700,
                    }}
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </span>
              {tab.label}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
