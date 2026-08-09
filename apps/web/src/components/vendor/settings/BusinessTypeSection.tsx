'use client'
// ============================================================
// MercadoRD — Configuración, sección: Tipo de negocio
// Ruta: src/components/vendor/settings/BusinessTypeSection.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BUSINESS_TYPE_OPTIONS } from '@/lib/vendorWizardOptions'
import type { BusinessType } from '@/types/database.types'
import { CheckboxGrid } from '@/components/vendor/wizard/sharedUI'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  initialBusinessTypes: BusinessType[]
}

export function BusinessTypeSection({ vendorId, initialBusinessTypes }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>(initialBusinessTypes)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const toggle = (value: BusinessType) => {
    setBusinessTypes(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { error: deleteError } = await supabase.from('vendor_business_types').delete().eq('vendor_id', vendorId)
    if (deleteError) {
      setSaving(false)
      console.error('[BusinessTypeSection]', deleteError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }

    if (businessTypes.length > 0) {
      const { error: insertError } = await supabase
        .from('vendor_business_types')
        .insert(businessTypes.map(business_type => ({ vendor_id: vendorId, business_type })))
      if (insertError) {
        setSaving(false)
        console.error('[BusinessTypeSection]', insertError)
        setError('Ocurrió un error al guardar. Intenta de nuevo.')
        return
      }
    }

    setSaving(false)
    setSuccess(true)
    router.refresh()
  }

  return (
    <SectionCard title="Tipo de negocio" subtitle="Selecciona todas las que apliquen.">
      <CheckboxGrid options={BUSINESS_TYPE_OPTIONS} selected={businessTypes} onToggle={toggle} />
      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} />
    </SectionCard>
  )
}
