'use client'
// ============================================================
// MercadoRD — Configuración, sección: Cuenta para recibir pagos
// Ruta: src/components/vendor/settings/PaymentSection.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  initial: { bankName: string; bankAccount: string }
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }

export function PaymentSection({ vendorId, initial }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [bankName, setBankName] = useState(initial.bankName)
  const [bankAccount, setBankAccount] = useState(initial.bankAccount)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { error: updateError } = await supabase
      .from('vendors')
      .update({ bank_name: bankName.trim() || null, bank_account: bankAccount.trim() || null })
      .eq('id', vendorId)
    setSaving(false)

    if (updateError) {
      console.error('[PaymentSection]', updateError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <SectionCard title="Cuenta para recibir pagos" subtitle="Solo tú puedes ver esta información">
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Banco</label>
        <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Banco Popular, BHD, etc." style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Número de cuenta</label>
        <input value={bankAccount} onChange={e => setBankAccount(e.target.value)} style={inputStyle} />
      </div>

      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} />
    </SectionCard>
  )
}
