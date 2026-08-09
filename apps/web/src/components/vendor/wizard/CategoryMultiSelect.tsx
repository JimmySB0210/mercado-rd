'use client'
// ============================================================
// MercadoRD — Selector jerárquico múltiple de categorías
// Ruta: src/components/vendor/wizard/CategoryMultiSelect.tsx
// ============================================================
// Extraído de Step3WhatYouSell.tsx para que dashboard/configuracion
// también pueda reutilizarlo — misma fuente de verdad para el
// comportamiento (categoría principal + subcategorías anidadas).
// ============================================================

import { useMemo } from 'react'
import { BRAND } from '@/lib/colors'
import type { Category } from '@/types/database.types'

interface Props {
  categories: Category[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

export function CategoryMultiSelect({ categories, selectedIds, onChange }: Props) {
  const topCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories])
  const subcategoriesByParent = useMemo(() => {
    const map = new Map<number, Category[]>()
    for (const c of categories) {
      if (!c.parent_id) continue
      const list = map.get(c.parent_id) ?? []
      list.push(c)
      map.set(c.parent_id, list)
    }
    return map
  }, [categories])

  const toggle = (id: number) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(v => v !== id)
        : [...selectedIds, id]
    )
  }

  return (
    <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #E0E0E0', borderRadius: 8, padding: 12 }}>
      {topCategories.map(cat => (
        <div key={cat.id} style={{ marginBottom: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: BRAND.dark }}>
            <input type="checkbox" checked={selectedIds.includes(cat.id)} onChange={() => toggle(cat.id)} />
            {cat.emoji} {cat.name}
          </label>
          {(subcategoriesByParent.get(cat.id) ?? []).length > 0 && (
            <div style={{ marginLeft: 24, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {subcategoriesByParent.get(cat.id)!.map(sub => (
                <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: BRAND.gray, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedIds.includes(sub.id)} onChange={() => toggle(sub.id)} />
                  {sub.name}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
