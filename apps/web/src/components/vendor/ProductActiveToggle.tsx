'use client'
// ============================================================
// MercadoRD — Eliminar (pausar) / reactivar (republicar) producto
// Ruta: src/components/vendor/ProductActiveToggle.tsx
// ============================================================
// No hace DELETE real — order_items tiene NO ACTION en su FK a
// products, así que borrar un producto con historial de ventas
// rompería con un error de Postgres. En vez de eso, cambia status
// entre 'paused' y 'published' (is_active es una columna generada a
// partir de status — nunca se escribe directamente).
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { ProductStatus } from '@/types/database.types'

interface Props {
  productId: string
  status: ProductStatus
}

export function ProductActiveToggle({ productId, status }: Props) {
  const { t } = useTranslation('dashboard')
  const router = useRouter()
  const supabase = createClient()

  // 'draft' no pasa por este control — publicar un borrador vive en el
  // formulario (con la advertencia de calidad de publicación).
  const [active, setActive] = useState(status === 'published')
  const [saving, setSaving] = useState(false)

  if (status === 'draft') return null

  const handleDeactivate = async () => {
    const confirmed = window.confirm(t('deactivateProductConfirm'))
    if (!confirmed) return

    setSaving(true)
    const { error } = await supabase.from('products').update({ status: 'paused' }).eq('id', productId)
    setSaving(false)

    if (error) {
      console.error('[ProductActiveToggle]', error)
      return
    }

    setActive(false)
    router.refresh()
  }

  const handleReactivate = async () => {
    setSaving(true)
    const { error } = await supabase.from('products').update({ status: 'published' }).eq('id', productId)
    setSaving(false)

    if (error) {
      console.error('[ProductActiveToggle]', error)
      return
    }

    setActive(true)
    router.refresh()
  }

  if (active) {
    return (
      <button
        type="button"
        onClick={handleDeactivate}
        disabled={saving}
        style={{
          fontSize: 11, fontWeight: 600, color: BRAND.red,
          background: 'transparent', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.6 : 1, padding: 0,
        }}
      >
        {t('deleteButton')}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleReactivate}
      disabled={saving}
      style={{
        fontSize: 11, fontWeight: 600, color: BRAND.blue,
        background: 'transparent', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
        opacity: saving ? 0.6 : 1, padding: 0,
      }}
    >
      {saving ? '...' : t('reactivateButton')}
    </button>
  )
}
