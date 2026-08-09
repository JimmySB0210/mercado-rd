'use client'
// ============================================================
// MercadoRD — Wizard de registro de vendor (6 pasos)
// Ruta: src/components/vendor/VendorRegisterWizard.tsx
// ============================================================
// Estado elevado (mismo patrón que PromoBannerManager.tsx): este
// componente sostiene el progreso del wizard, el id del vendor (una
// vez creado) y el formulario acumulado de los 6 pasos, y cada Step
// recibe solo la porción que necesita + un setter.
//
// Guardado: Paso 1 hace INSERT la primera vez (onboarding_step pasa
// a existir recién ahí) y UPDATE en cualquier reintento posterior.
// Los pasos 2+ siempre son UPDATE sobre el vendor ya creado. Si el
// usuario cierra el navegador, retoma en vendor.onboarding_step al
// volver — la página que renderiza este componente ya resuelve eso.
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validateText, validatePhone } from '@/lib/validation'
import { BRAND } from '@/lib/colors'
import type { Vendor, Category } from '@/types/database.types'
import { WizardProgressBar } from './wizard/WizardProgressBar'
import { Step1BasicInfo } from './wizard/Step1BasicInfo'
import { buildInitialWizardData, type VendorWizardFormData } from './wizard/vendorWizardTypes'
import type { Step1Errors } from './wizard/Step1BasicInfo'

interface ProvinceOption { id: number; name: string }

interface Props {
  userId: string
  initialVendor: Vendor | null
  initialStep: number
  provinces: ProvinceOption[]
  categories: Category[]
}

const TOTAL_STEPS = 6

export function VendorRegisterWizard({ userId, initialVendor, initialStep, provinces }: Props) {
  const supabase = createClient()

  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), TOTAL_STEPS))
  const [vendorId, setVendorId] = useState<string | null>(initialVendor?.id ?? null)
  const [data, setData] = useState<VendorWizardFormData>(() => buildInitialWizardData(initialVendor))
  const [saving, setSaving] = useState(false)
  // Un mensaje por campo — antes era un solo `error` genérico mostrado
  // lejos de los inputs, y el usuario no podía saber cuál campo corregir.
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({})
  const [saveError, setSaveError] = useState<string | null>(null)

  const updateData = (patch: Partial<VendorWizardFormData>) => setData(d => ({ ...d, ...patch }))

  const handleSaveStep1 = async () => {
    setSaveError(null)

    const errors: Step1Errors = {}
    const nameErr = validateText(data.businessName, 'El nombre del negocio', 3, 80)
    if (nameErr) errors.businessName = nameErr
    if (!data.provinceId) errors.provinceId = 'Selecciona una provincia'
    const addressErr = validateText(data.address, 'Dirección', 10, 200)
    if (addressErr) errors.address = addressErr
    if (data.whatsapp.trim().length > 0) {
      const whatsappErr = validatePhone(data.whatsapp)
      if (whatsappErr) errors.whatsapp = whatsappErr
    }

    setStep1Errors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)

    const payload = {
      business_name: data.businessName.trim(),
      legal_name: data.legalName.trim() || null,
      contact_full_name: data.contactFullName.trim() || null,
      whatsapp: data.whatsapp.trim() || null,
      province_id: Number(data.provinceId),
      municipio: data.municipio.trim() || null,
      sector: data.sector.trim() || null,
      address: data.address.trim(),
      has_physical_store: data.hasPhysicalStore,
      has_warehouse: data.hasWarehouse,
      has_workshop: data.hasWorkshop,
      onboarding_step: 2,
    }

    if (vendorId) {
      const { error: updateError } = await supabase.from('vendors').update(payload).eq('id', vendorId)
      setSaving(false)
      if (updateError) {
        console.error('[VendorRegisterWizard] update step 1', updateError)
        setSaveError('Ocurrió un error al guardar. Intenta de nuevo.')
        return
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('vendors')
        .insert({ ...payload, user_id: userId, plan: 'free', is_verified: false })
        .select('id')
        .single()

      setSaving(false)

      if (insertError || !inserted) {
        console.error('[VendorRegisterWizard] insert step 1', insertError)
        setSaveError('Ocurrió un error al crear tu perfil. Intenta de nuevo.')
        return
      }
      setVendorId(inserted.id)
    }

    setStep(2)
  }

  return (
    <div style={{ minHeight: '100vh', background: BRAND.bg, padding: '40px 24px', display: 'flex', justifyContent: 'center' }}>
      <div className="auth-card" style={{ background: '#fff', borderRadius: 12, maxWidth: 560, width: '100%', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', height: 'fit-content' }}>
        <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 8 }}>
          <span style={{ color: BRAND.blue }}>Mercado</span><span style={{ color: BRAND.red }}>RD</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: BRAND.dark }}>Registra tu negocio</h1>
        <p style={{ color: BRAND.gray, marginBottom: 20, fontSize: 14 }}>Únete a miles de vendedores dominicanos</p>

        <WizardProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

        {step === 1 && (
          <Step1BasicInfo
            data={data}
            updateData={updateData}
            provinces={provinces}
            onNext={handleSaveStep1}
            saving={saving}
            errors={step1Errors}
            saveError={saveError}
          />
        )}

        {step > 1 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: BRAND.gray }}>
            <p style={{ marginBottom: 20, fontSize: 14 }}>Paso {step} — próximamente.</p>
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              style={{ background: '#fff', color: BRAND.blue, border: `1px solid ${BRAND.blue}`, padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              ← Atrás
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
