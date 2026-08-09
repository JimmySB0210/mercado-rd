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
// Los pasos 2+ siempre son UPDATE sobre el vendor ya creado, más
// DELETE+INSERT en la tabla muchos-a-muchos que corresponda (más
// simple que calcular el diff). Si el usuario cierra el navegador,
// retoma en vendor.onboarding_step al volver — la página que
// renderiza este componente ya resuelve eso.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateText, validatePhone } from '@/lib/validation'
import { BRAND } from '@/lib/colors'
import type { Vendor, Category } from '@/types/database.types'
import { WizardProgressBar } from './wizard/WizardProgressBar'
import { Step1BasicInfo, type Step1Errors } from './wizard/Step1BasicInfo'
import { Step2BusinessType } from './wizard/Step2BusinessType'
import { Step3WhatYouSell } from './wizard/Step3WhatYouSell'
import { Step4Services } from './wizard/Step4Services'
import { Step5Customers } from './wizard/Step5Customers'
import { Step6Review } from './wizard/Step6Review'
import { buildInitialWizardData, type VendorWizardFormData, type VendorWizardM2MData } from './wizard/vendorWizardTypes'

interface ProvinceOption { id: number; name: string }

interface Props {
  userId: string
  initialVendor: Vendor | null
  initialStep: number
  initialM2M?: VendorWizardM2MData
  provinces: ProvinceOption[]
  categories: Category[]
}

const TOTAL_STEPS = 6

const MANUFACTURES = (status: VendorWizardFormData['manufacturingStatus']) =>
  status === 'fabricates_own' || status === 'mixed'

export function VendorRegisterWizard({ userId, initialVendor, initialStep, initialM2M, provinces, categories }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), TOTAL_STEPS))
  const [vendorId, setVendorId] = useState<string | null>(initialVendor?.id ?? null)
  const [data, setData] = useState<VendorWizardFormData>(() => buildInitialWizardData(initialVendor, initialM2M))
  const [saving, setSaving] = useState(false)
  // Paso 1 muestra un error por campo (ver Step1BasicInfo); los pasos
  // 2-6 usan un solo mensaje genérico, suficiente para su validación.
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({})
  const [stepError, setStepError] = useState<string | null>(null)

  const updateData = (patch: Partial<VendorWizardFormData>) => setData(d => ({ ...d, ...patch }))

  // DELETE + INSERT sobre una tabla muchos-a-muchos del vendor — mismo
  // patrón para vendor_business_types, vendor_categories, vendor_services
  // y vendor_target_customers.
  const replaceM2M = async (table: string, column: string, values: (string | number)[]) => {
    const { error: deleteError } = await supabase.from(table).delete().eq('vendor_id', vendorId)
    if (deleteError) return deleteError
    if (values.length === 0) return null
    const rows = values.map(v => ({ vendor_id: vendorId, [column]: v }))
    const { error: insertError } = await supabase.from(table).insert(rows)
    return insertError
  }

  const handleSaveStep1 = async () => {
    setStepError(null)

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
        setStepError('Ocurrió un error al guardar. Intenta de nuevo.')
        return
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('vendors')
        .insert({ ...payload, user_id: userId, plan: 'free' })
        .select('id')
        .single()

      setSaving(false)

      if (insertError || !inserted) {
        console.error('[VendorRegisterWizard] insert step 1', insertError)
        setStepError('Ocurrió un error al crear tu perfil. Intenta de nuevo.')
        return
      }
      setVendorId(inserted.id)
    }

    setStep(2)
  }

  const handleSaveStep2 = async () => {
    setStepError(null)
    if (!vendorId) { setStepError('Ocurrió un error inesperado. Vuelve al paso 1.'); return }

    setSaving(true)
    const m2mError = await replaceM2M('vendor_business_types', 'business_type', data.businessTypes)
    if (m2mError) {
      setSaving(false)
      console.error('[VendorRegisterWizard] step 2', m2mError)
      setStepError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }

    const { error: updateError } = await supabase.from('vendors').update({ onboarding_step: 3 }).eq('id', vendorId)
    setSaving(false)
    if (updateError) {
      console.error('[VendorRegisterWizard] step 2 onboarding_step', updateError)
      setStepError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }
    setStep(3)
  }

  const handleSaveStep3 = async () => {
    setStepError(null)
    if (!vendorId) { setStepError('Ocurrió un error inesperado. Vuelve al paso 1.'); return }

    setSaving(true)
    const catError = await replaceM2M('vendor_categories', 'category_id', data.categoryIds)
    if (catError) {
      setSaving(false)
      console.error('[VendorRegisterWizard] step 3 categorías', catError)
      setStepError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }

    const manufactures = MANUFACTURES(data.manufacturingStatus)
    const payload = {
      manufacturing_status: data.manufacturingStatus,
      production_time: manufactures ? data.productionTime : null,
      production_time_custom: manufactures && data.productionTime === 'custom' ? (data.productionTimeCustom.trim() || null) : null,
      accepts_private_label: manufactures ? data.acceptsPrivateLabel : null,
      allows_customization: manufactures ? data.allowsCustomization : null,
      onboarding_step: 4,
    }
    const { error: updateError } = await supabase.from('vendors').update(payload).eq('id', vendorId)
    setSaving(false)
    if (updateError) {
      console.error('[VendorRegisterWizard] step 3', updateError)
      setStepError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }
    setStep(4)
  }

  const handleSaveStep4 = async () => {
    setStepError(null)
    if (!vendorId) { setStepError('Ocurrió un error inesperado. Vuelve al paso 1.'); return }

    setSaving(true)
    const m2mError = await replaceM2M('vendor_services', 'service', data.services)
    if (m2mError) {
      setSaving(false)
      console.error('[VendorRegisterWizard] step 4', m2mError)
      setStepError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }

    const { error: updateError } = await supabase.from('vendors').update({ onboarding_step: 5 }).eq('id', vendorId)
    setSaving(false)
    if (updateError) {
      console.error('[VendorRegisterWizard] step 4 onboarding_step', updateError)
      setStepError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }
    setStep(5)
  }

  const handleSaveStep5 = async () => {
    setStepError(null)
    if (!vendorId) { setStepError('Ocurrió un error inesperado. Vuelve al paso 1.'); return }

    setSaving(true)
    const custError = await replaceM2M('vendor_target_customers', 'customer_type', data.targetCustomers)
    if (custError) {
      setSaving(false)
      console.error('[VendorRegisterWizard] step 5 clientes', custError)
      setStepError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }

    const payload = {
      min_order_quantity: data.minOrderQuantity ? Number(data.minOrderQuantity) : null,
      min_order_unit: data.minOrderQuantity ? (data.minOrderUnit || 'unidades') : null,
      onboarding_step: 6,
    }
    const { error: updateError } = await supabase.from('vendors').update(payload).eq('id', vendorId)
    setSaving(false)
    if (updateError) {
      console.error('[VendorRegisterWizard] step 5', updateError)
      setStepError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }
    setStep(6)
  }

  const handleSubmitStep6 = async () => {
    setStepError(null)
    if (!vendorId) { setStepError('Ocurrió un error inesperado. Vuelve al paso 1.'); return }

    setSaving(true)
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ onboarding_completed: true })
      .eq('id', vendorId)
    setSaving(false)

    if (updateError) {
      console.error('[VendorRegisterWizard] submit', updateError)
      setStepError('Ocurrió un error al finalizar tu registro. Intenta de nuevo.')
      return
    }
    router.push('/dashboard')
  }

  const goToStep = (target: number) => {
    setStepError(null)
    setStep(target)
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
            saveError={stepError}
          />
        )}

        {step === 2 && (
          <Step2BusinessType
            data={data}
            updateData={updateData}
            onNext={handleSaveStep2}
            onBack={() => goToStep(1)}
            saving={saving}
            error={stepError}
          />
        )}

        {step === 3 && (
          <Step3WhatYouSell
            data={data}
            updateData={updateData}
            categories={categories}
            onNext={handleSaveStep3}
            onBack={() => goToStep(2)}
            saving={saving}
            error={stepError}
          />
        )}

        {step === 4 && (
          <Step4Services
            data={data}
            updateData={updateData}
            onNext={handleSaveStep4}
            onBack={() => goToStep(3)}
            saving={saving}
            error={stepError}
          />
        )}

        {step === 5 && (
          <Step5Customers
            data={data}
            updateData={updateData}
            onNext={handleSaveStep5}
            onBack={() => goToStep(4)}
            saving={saving}
            error={stepError}
          />
        )}

        {step === 6 && (
          <Step6Review
            data={data}
            provinces={provinces}
            categories={categories}
            onEditStep={goToStep}
            onSubmit={handleSubmitStep6}
            saving={saving}
            error={stepError}
          />
        )}
      </div>
    </div>
  )
}
