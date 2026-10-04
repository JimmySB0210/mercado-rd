'use client'
// ============================================================
// MercadoRD — Configuración, sección: Servicios
// Ruta: src/components/vendor/settings/ServicesSection.tsx
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VENDOR_SERVICE_GROUPS } from '@/lib/vendorWizardOptions'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { VendorService } from '@/types/database.types'
import { labelStyle, PlainCheckboxList } from '@/components/vendor/wizard/sharedUI'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  initialServices: VendorService[]
  onRegisterSave?: (save: (() => Promise<boolean>) | null) => void
  hideOwnButton?: boolean
}

export function ServicesSection({ vendorId, initialServices, onRegisterSave, hideOwnButton }: Props) {
  const { t } = useTranslation('vendorOptions')
  const router = useRouter()
  const supabase = createClient()

  const [services, setServices] = useState<VendorService[]>(initialServices)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const toggle = (value: VendorService) => {
    setServices(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  const handleSave = useCallback(async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { error: deleteError } = await supabase.from('vendor_services').delete().eq('vendor_id', vendorId)
    if (deleteError) {
      setSaving(false)
      console.error('[ServicesSection]', deleteError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return false
    }

    if (services.length > 0) {
      const { error: insertError } = await supabase
        .from('vendor_services')
        .insert(services.map(service => ({ vendor_id: vendorId, service })))
      if (insertError) {
        setSaving(false)
        console.error('[ServicesSection]', insertError)
        setError('Ocurrió un error al guardar. Intenta de nuevo.')
        return false
      }
    }

    setSaving(false)
    setSuccess(true)
    router.refresh()
    return true
  }, [services, vendorId, supabase, router])

  useEffect(() => {
    onRegisterSave?.(handleSave)
    return () => onRegisterSave?.(null)
  }, [handleSave, onRegisterSave])

  return (
    <SectionCard title="Servicios que ofreces">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {VENDOR_SERVICE_GROUPS.map(group => (
          <div key={group.titleKey}>
            <label style={labelStyle}>{t(`serviceGroupTitles.${group.titleKey}`)}</label>
            <PlainCheckboxList
              options={group.options.map(value => ({ value, label: t(`service.${value}`) }))}
              selected={services}
              onToggle={toggle}
              accentColor="var(--dashboard-blue)"
            />
          </div>
        ))}
      </div>
      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} showButton={!hideOwnButton} />
    </SectionCard>
  )
}
