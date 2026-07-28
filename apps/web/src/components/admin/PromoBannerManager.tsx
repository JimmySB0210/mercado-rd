'use client'
// ============================================================
// MercadoRD — Estado compartido: lista + formulario de banners
// Ruta: src/components/admin/PromoBannerManager.tsx
// ============================================================
// Vive en app/admin/promociones/page.tsx. Coordina PromoBannerList
// y PromoBannerForm: al pulsar "Editar" en una fila, el formulario
// cambia a modo 'editar' precargado con esos datos.
// ============================================================

import { useState } from 'react'
import { PromoBannerList } from './PromoBannerList'
import { PromoBannerForm } from './PromoBannerForm'
import type { PromoBanner } from '@/types/database.types'

interface Props {
  initialBanners: PromoBanner[]
}

export function PromoBannerManager({ initialBanners }: Props) {
  const [banners, setBanners] = useState(initialBanners)
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null)

  const nextSortOrder = banners.length > 0
    ? Math.max(...banners.map(b => b.sort_order)) + 1
    : 0

  const handleSaved = (saved: PromoBanner) => {
    setBanners(prev => {
      const exists = prev.some(b => b.id === saved.id)
      const next = exists ? prev.map(b => (b.id === saved.id ? saved : b)) : [...prev, saved]
      return next.sort((a, b) => a.sort_order - b.sort_order)
    })
    setEditingBanner(null)
  }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
          Banners actuales ({banners.length})
        </div>
        <PromoBannerList banners={banners} setBanners={setBanners} onEdit={setEditingBanner} />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
          {editingBanner ? 'Editar banner' : 'Crear banner nuevo'}
        </div>
        {/* key fuerza remount al cambiar de banner editado (o volver a "crear"),
            así el formulario siempre arranca con el estado inicial correcto */}
        <PromoBannerForm
          key={editingBanner?.id ?? 'new'}
          mode={editingBanner ? 'editar' : 'crear'}
          nextSortOrder={nextSortOrder}
          initialData={editingBanner ?? undefined}
          onSaved={handleSaved}
          onCancel={() => setEditingBanner(null)}
        />
      </div>
    </>
  )
}
