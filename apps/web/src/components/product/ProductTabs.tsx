'use client'
// ============================================================
// MercadoRD — Pestañas de la página de producto
// Ruta: src/components/product/ProductTabs.tsx
// ============================================================
// Envuelve contenido ya resuelto (texto traducido en el propio
// ProductPageContent, o Server Components como ProductReviews /
// ProductFaqSection pasados desde page.tsx) — este componente NO hace
// fetch de nada. Cambiar de pestaña solo alterna qué panel se muestra
// (conditional render); los Server Components ya llegan renderizados
// dentro del árbol, así que cambiar de pestaña no vuelve a pedirlos.
//
// El llamador arma `tabs` ya filtrado — un tab sin contenido real
// (ej. sin especificaciones) simplemente no se incluye acá, nunca se
// muestra vacío.
// ============================================================

import { useState } from 'react'

export interface ProductTabDef {
  key: string
  label: string
  content: React.ReactNode
}

interface Props {
  tabs: ProductTabDef[]
}

export function ProductTabs({ tabs }: Props) {
  const [active, setActive] = useState(tabs[0]?.key ?? '')
  const activeTab = tabs.find(t => t.key === active) ?? tabs[0]

  if (tabs.length === 0) return null

  return (
    <div
      className="bg-[var(--color-card-bg)] mt-8"
      style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <div role="tablist" className="flex gap-1 overflow-x-auto px-2 sm:px-4 border-b border-gray-100">
        {tabs.map(tab => {
          const isActive = tab.key === activeTab?.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.key)}
              className="flex-shrink-0 px-3 sm:px-4 py-3.5 text-sm font-semibold whitespace-nowrap bg-transparent border-none cursor-pointer"
              style={{
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="p-5 sm:p-6">
        {activeTab?.content}
      </div>
    </div>
  )
}
