'use client'
// ============================================================
// MercadoRD — Configuración, sección: Presencia física
// Ruta: src/components/vendor/settings/PhysicalPresenceSection.tsx
// ============================================================

import { useState } from 'react'
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
}

export function PhysicalPresenceSection({ vendorId, initial }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [hasPhysicalStore, setHasPhysicalStore] = useState(initial.hasPhysicalStore)
  const [hasWarehouse, setHasWarehouse] = useState(initial.hasWarehouse)
  const [hasWorkshop, setHasWorkshop] = useState(initial.hasWorkshop)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
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
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <SectionCard title="Presencia física">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <YesNoToggle label="¿Tienes tienda física?" value={hasPhysicalStore} onChange={setHasPhysicalStore} />
        <YesNoToggle label="¿Tienes almacén?" value={hasWarehouse} onChange={setHasWarehouse} />
        <YesNoToggle label="¿Tienes taller?" value={hasWorkshop} onChange={setHasWorkshop} />
      </div>
      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} />
    </SectionCard>
  )
}
