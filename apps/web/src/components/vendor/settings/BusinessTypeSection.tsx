'use client'
// ============================================================
// MercadoRD — Configuración, sección: Tipo de negocio
// Ruta: src/components/vendor/settings/BusinessTypeSection.tsx
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BUSINESS_TYPE_OPTIONS } from '@/lib/vendorWizardOptions'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { BusinessType } from '@/types/database.types'
import { YesNoToggle } from '@/components/vendor/wizard/sharedUI'
import { BusinessTypeCards } from './BusinessTypeCards'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  initialBusinessTypes: BusinessType[]
  onRegisterSave?: (save: (() => Promise<boolean>) | null) => void
  hideOwnButton?: boolean
}

// "Prestador de servicios" no es un rol excluyente como los otros 8 --
// una tienda minorista normal también puede prestar servicios, por
// eso la referencia lo separa como pregunta propia en vez de una
// tarjeta más dentro de la grilla de roles.
const CARD_TYPES = BUSINESS_TYPE_OPTIONS.filter(v => v !== 'service_provider')

export function BusinessTypeSection({ vendorId, initialBusinessTypes, onRegisterSave, hideOwnButton }: Props) {
  const { t } = useTranslation('vendorOptions')
  const options = CARD_TYPES.map(value => ({ value, label: t(`businessType.${value}`) }))
  const router = useRouter()
  const supabase = createClient()

  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>(initialBusinessTypes)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const toggle = (value: BusinessType) => {
    setBusinessTypes(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  const handleSave = useCallback(async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { error: deleteError } = await supabase.from('vendor_business_types').delete().eq('vendor_id', vendorId)
    if (deleteError) {
      setSaving(false)
      console.error('[BusinessTypeSection]', deleteError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return false
    }

    if (businessTypes.length > 0) {
      const { error: insertError } = await supabase
        .from('vendor_business_types')
        .insert(businessTypes.map(business_type => ({ vendor_id: vendorId, business_type })))
      if (insertError) {
        setSaving(false)
        console.error('[BusinessTypeSection]', insertError)
        setError('Ocurrió un error al guardar. Intenta de nuevo.')
        return false
      }
    }

    setSaving(false)
    setSuccess(true)
    router.refresh()
    return true
  }, [businessTypes, vendorId, supabase, router])

  useEffect(() => {
    onRegisterSave?.(handleSave)
    return () => onRegisterSave?.(null)
  }, [handleSave, onRegisterSave])

  const isServiceProvider = businessTypes.includes('service_provider')

  return (
    <SectionCard title="Tipo de negocio" subtitle="Selecciona todas las que apliquen.">
      <p style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: '#131A18', marginBottom: 10 }}>¿Qué tipo de negocio eres? *</p>
      <BusinessTypeCards options={options} selected={businessTypes} onToggle={toggle} />

      <div style={{ marginTop: 20 }}>
        <YesNoToggle
          label="Prestador de servicios"
          value={isServiceProvider ? true : null}
          onChange={(v) => setBusinessTypes(prev => {
            const withoutServiceProvider = prev.filter(t => t !== 'service_provider')
            return v ? [...withoutServiceProvider, 'service_provider'] : withoutServiceProvider
          })}
          accentColor="var(--dashboard-blue)"
        />
        <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#3D5361', background: '#F3F7FC', borderRadius: 8, padding: '10px 12px', marginTop: 10 }}>
          <span>ℹ️</span>
          <span>Tu tienda puede vender tanto a clientes minoristas como a compradores por volumen.</span>
        </p>
      </div>

      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} showButton={!hideOwnButton} />
    </SectionCard>
  )
}
