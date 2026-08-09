'use client'
// ============================================================
// MercadoRD — Configuración, sección: Servicios
// Ruta: src/components/vendor/settings/ServicesSection.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VENDOR_SERVICE_GROUPS } from '@/lib/vendorWizardOptions'
import type { VendorService } from '@/types/database.types'
import { labelStyle, CheckboxGrid } from '@/components/vendor/wizard/sharedUI'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  initialServices: VendorService[]
}

export function ServicesSection({ vendorId, initialServices }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [services, setServices] = useState<VendorService[]>(initialServices)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const toggle = (value: VendorService) => {
    setServices(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { error: deleteError } = await supabase.from('vendor_services').delete().eq('vendor_id', vendorId)
    if (deleteError) {
      setSaving(false)
      console.error('[ServicesSection]', deleteError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }

    if (services.length > 0) {
      const { error: insertError } = await supabase
        .from('vendor_services')
        .insert(services.map(service => ({ vendor_id: vendorId, service })))
      if (insertError) {
        setSaving(false)
        console.error('[ServicesSection]', insertError)
        setError('Ocurrió un error al guardar. Intenta de nuevo.')
        return
      }
    }

    setSaving(false)
    setSuccess(true)
    router.refresh()
  }

  return (
    <SectionCard title="Servicios que ofreces">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {VENDOR_SERVICE_GROUPS.map(group => (
          <div key={group.title}>
            <label style={labelStyle}>{group.title}</label>
            <CheckboxGrid options={group.options} selected={services} onToggle={toggle} />
          </div>
        ))}
      </div>
      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} />
    </SectionCard>
  )
}
