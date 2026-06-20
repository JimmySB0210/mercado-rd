'use client'
// ============================================================
// MercadoRD — Toggle de verificación de vendor (admin)
// Ruta: src/components/admin/VerifyVendorButton.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'

interface Props {
  vendorId: string
  isVerified: boolean
}

export function VerifyVendorButton({ vendorId, isVerified }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleToggle = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('vendors')
      .update({ is_verified: !isVerified })
      .eq('id', vendorId)

    if (!error) {
      router.refresh()
    } else {
      console.error('[VerifyVendorButton]', error)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{
        background: isVerified ? '#fff' : BRAND.blue,
        color: isVerified ? BRAND.red : '#fff',
        border: isVerified ? `1px solid ${BRAND.red}` : 'none',
        padding: '5px 12px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? '...' : isVerified ? 'Quitar verificación' : 'Verificar'}
    </button>
  )
}
