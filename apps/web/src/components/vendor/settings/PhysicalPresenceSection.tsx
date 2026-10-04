'use client'
// ============================================================
// MercadoRD — Configuración, sección: Presencia física
// Ruta: src/components/vendor/settings/PhysicalPresenceSection.tsx
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SectionCard, SaveSectionButton } from './SectionCard'
import { YesNoToggle } from '@/components/vendor/wizard/sharedUI'

interface Props {
  vendorId: string
  initial: {
    hasPhysicalStore: boolean | null
    hasWarehouse: boolean | null
    hasWorkshop: boolean | null
  }
  onRegisterSave?: (save: (() => Promise<boolean>) | null) => void
  hideOwnButton?: boolean
}

export function PhysicalPresenceSection({ vendorId, initial, onRegisterSave, hideOwnButton }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [hasPhysicalStore, setHasPhysicalStore] = useState(initial.hasPhysicalStore)
  const [hasWarehouse, setHasWarehouse] = useState(initial.hasWarehouse)
  const [hasWorkshop, setHasWorkshop] = useState(initial.hasWorkshop)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = useCallback(async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        has_physical_store: hasPhysicalStore,
        has_warehouse: hasWarehouse,
        has_workshop: hasWorkshop,
      })
      .eq('id', vendorId)
    setSaving(false)

    if (updateError) {
      console.error('[PhysicalPresenceSection]', updateError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return false
    }
    setSuccess(true)
    router.refresh()
    return true
  }, [hasPhysicalStore, hasWarehouse, hasWorkshop, vendorId, supabase, router])

  useEffect(() => {
    onRegisterSave?.(handleSave)
    return () => onRegisterSave?.(null)
  }, [handleSave, onRegisterSave])

  return (
    <SectionCard title="Presencia física">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <YesNoToggle label="¿Tienes tienda física?" value={hasPhysicalStore} onChange={setHasPhysicalStore} accentColor="var(--dashboard-blue)" />
        <YesNoToggle label="¿Tienes almacén?" value={hasWarehouse} onChange={setHasWarehouse} accentColor="var(--dashboard-blue)" />
        <YesNoToggle label="¿Tienes taller?" value={hasWorkshop} onChange={setHasWorkshop} accentColor="var(--dashboard-blue)" />
      </div>
      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} showButton={!hideOwnButton} />
    </SectionCard>
  )
}
