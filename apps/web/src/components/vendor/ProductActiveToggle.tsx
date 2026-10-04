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
  const [error, setError] = useState<string | null>(null)

  if (status === 'draft') return null

  const handleDeactivate = async () => {
    const confirmed = window.confirm(t('deactivateProductConfirm'))
    if (!confirmed) return

    setSaving(true)
    setError(null)
    const { error: updateError } = await supabase.from('products').update({ status: 'paused' }).eq('id', productId)
    setSaving(false)

    if (updateError) {
      console.error('[ProductActiveToggle]', updateError)
      setError(updateError.message || t('productStatusUpdateFailed'))
      return
    }

    setActive(false)
    router.refresh()
  }

  const handleReactivate = async () => {
    setSaving(true)
    setError(null)
    const { error: updateError } = await supabase.from('products').update({ status: 'published' }).eq('id', productId)
    setSaving(false)

    if (updateError) {
      console.error('[ProductActiveToggle]', updateError)
      // Mensaje real de la base (p.ej. el trigger de mínimo de fotos), no genérico.
      setError(updateError.message || t('productStatusUpdateFailed'))
      return
    }

    setActive(true)
    router.refresh()
  }

  const errorLine = error && (
    <span style={{ display: 'block', fontSize: 11, color: BRAND.red, marginTop: 4, lineHeight: 1.35 }}>{error}</span>
  )

  if (active) {
    return (
      <div>
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
        {t('pauseProductButton')}
      </button>
      {errorLine}
      </div>
    )
  }

  return (
    <div>
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
    {errorLine}
    </div>
  )
}
