'use client'
// ============================================================
// MercadoRD — Eliminar (desactivar) / reactivar producto
// Ruta: src/components/vendor/ProductActiveToggle.tsx
// ============================================================
// No hace DELETE real — order_items tiene NO ACTION en su FK a
// products, así que borrar un producto con historial de ventas
// rompería con un error de Postgres. En vez de eso, is_active=false
// lo oculta de compradores conservando los datos de ventas.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Props {
  productId: string
  initialActive: boolean
}

export function ProductActiveToggle({ productId, initialActive }: Props) {
  const { t } = useTranslation('dashboard')
  const router = useRouter()
  const supabase = createClient()

  const [active, setActive] = useState(initialActive)
  const [saving, setSaving] = useState(false)

  const handleDeactivate = async () => {
    const confirmed = window.confirm(t('deactivateProductConfirm'))
    if (!confirmed) return

    setSaving(true)
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', productId)
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
    const { error } = await supabase.from('products').update({ is_active: true }).eq('id', productId)
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
