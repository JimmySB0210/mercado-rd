'use client'
// ============================================================
// MercadoRD — Wizard de "Configuración de tu tienda"
// Ruta: src/components/vendor/settings/VendorSettingsWizard.tsx
// ============================================================
// Cáscara del wizard de 9 pasos: stepper horizontal + contenido del
// paso + panel derecho contextual. Reutiliza los 12 componentes de
// sección existentes tal cual están (su guardado real no se toca) —
// esto solo controla qué paso está activo, dispara su guardado desde
// un único botón "Guardar cambios", y deriva el estado ✓/●/○ de cada
// paso a partir de datos reales ya cargados (mismos booleanos que
// alimentan computeStoreCompleteness, ver lib/vendorCompleteness.ts).
//
// Rediseño 2026-10-02 contra comparación directa con la imagen de
// referencia (ver diagnóstico): stepper pasó de columna vertical
// lateral a fila horizontal integrada arriba del contenido (layout de
// 2 columnas reales, no 4); "Siguiente" ahora es la acción primaria
// (sólido), "Guardar cambios" secundaria (outline); el panel derecho
// cambia de contenido según el paso activo en vez de ser una vista
// previa estática.
// ============================================================

import { Fragment, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { computeStoreCompleteness } from '@/lib/vendorCompleteness'
import type { Vendor, Category, BusinessType, VendorService, CustomerType } from '@/types/database.types'

import { LogoSection } from './LogoSection'
import { BasicInfoSection } from './BasicInfoSection'
import { PhysicalPresenceSection } from './PhysicalPresenceSection'
import { ContactSection } from './ContactSection'
import { BusinessTypeSection } from './BusinessTypeSection'
import { CategoriesSection } from './CategoriesSection'
import { ManufacturingSection } from './ManufacturingSection'
import { ServicesSection } from './ServicesSection'
import { CustomersSection } from './CustomersSection'
import { PaymentSection } from './PaymentSection'
import { FaqSection } from './FaqSection'
import { IdentityVerificationSection } from './IdentityVerificationSection'
import { VendorStorePreviewStep } from './VendorStorePreviewStep'

interface Province { id: number; name: string }

type StepId = 'profile' | 'presence' | 'businessType' | 'categories' | 'manufacturing' | 'customers' | 'payments' | 'verification' | 'preview'

const STEPS: { id: StepId; label: string }[] = [
  { id: 'profile', label: 'Perfil de la tienda' },
  { id: 'presence', label: 'Presencia y contacto' },
  { id: 'businessType', label: 'Tipo de negocio' },
  { id: 'categories', label: 'Categorías' },
  { id: 'manufacturing', label: 'Fabricación' },
  { id: 'customers', label: 'Clientes y condiciones' },
  { id: 'payments', label: 'Pagos y preguntas frecuentes' },
  { id: 'verification', label: 'Verificación' },
  { id: 'preview', label: 'Vista previa' },
]

// Panel derecho con contenido dependiente del paso -- cuáles usan la
// vista previa genérica de tienda (+ tip) vs. un panel propio.
const GENERIC_PREVIEW_STEPS = new Set<StepId>(['profile', 'presence', 'payments', 'verification'])

interface Props {
  vendor: Vendor
  userId: string
  provinces: Province[]
  categories: Category[]
  businessTypes: BusinessType[]
  categoryIds: number[]
  services: VendorService[]
  targetCustomers: CustomerType[]
  hasIdentitySubmitted: boolean
}

type SaveFn = (() => Promise<boolean>) | null

export function VendorSettingsWizard({
  vendor: initialVendor, userId, provinces, categories,
  businessTypes: initialBusinessTypes, categoryIds: initialCategoryIds,
  services: initialServices, targetCustomers: initialTargetCustomers,
  hasIdentitySubmitted: initialHasIdentitySubmitted,
}: Props) {
  const router = useRouter()

  // Copias locales -- se refrescan tras cada guardado y en cada
  // navegación de paso, para que la barra de progreso y el estado
  // ✓/●/○ del stepper reflejen datos reales, no el snapshot inicial.
  const [vendor, setVendor] = useState(initialVendor)
  const [businessTypes, setBusinessTypes] = useState(initialBusinessTypes)
  const [categoryIds, setCategoryIds] = useState(initialCategoryIds)
  const [services, setServices] = useState(initialServices)
  const [targetCustomers, setTargetCustomers] = useState(initialTargetCustomers)
  const [hasIdentitySubmitted, setHasIdentitySubmitted] = useState(initialHasIdentitySubmitted)

  const refreshVendorData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: vendorData }, { data: btRes }, { data: catRes }, { data: svcRes }, { data: tcRes }, { data: idRes }] = await Promise.all([
      supabase.from('vendors').select('*').eq('id', initialVendor.id).single(),
      supabase.from('vendor_business_types').select('business_type').eq('vendor_id', initialVendor.id),
      supabase.from('vendor_categories').select('category_id').eq('vendor_id', initialVendor.id),
      supabase.from('vendor_services').select('service').eq('vendor_id', initialVendor.id),
      supabase.from('vendor_target_customers').select('customer_type').eq('vendor_id', initialVendor.id),
      supabase.from('external_verifications').select('id').eq('verification_type', 'identity_kyc').eq('target_type', 'user').eq('target_id', userId).limit(1).maybeSingle(),
    ])
    if (vendorData) setVendor(vendorData)
    setBusinessTypes((btRes ?? []).map(r => r.business_type))
    setCategoryIds((catRes ?? []).map(r => r.category_id))
    setServices((svcRes ?? []).map(r => r.service))
    setTargetCustomers((tcRes ?? []).map(r => r.customer_type))
    setHasIdentitySubmitted(!!idRes)
  }, [initialVendor.id, userId])

  const [activeStep, setActiveStep] = useState<StepId>('profile')
  const activeStepIndex = STEPS.findIndex(s => s.id === activeStep)

  const goToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length) return
    setActiveStep(STEPS[index].id)
    refreshVendorData()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Slots de guardado registrados por los componentes de sección del
  // paso activo -- ver cada *Section.tsx (prop onRegisterSave). React
  // garantiza que los setState son estables por identidad, así que
  // pasarlos directo evita el loop de re-render que arriesgaría una
  // fábrica curried por key.
  const [logoSave, setLogoSave] = useState<SaveFn>(null)
  const [basicInfoSave, setBasicInfoSave] = useState<SaveFn>(null)
  const [presenceSave, setPresenceSave] = useState<SaveFn>(null)
  const [contactSave, setContactSave] = useState<SaveFn>(null)
  const [businessTypeSave, setBusinessTypeSave] = useState<SaveFn>(null)
  const [categoriesSave, setCategoriesSave] = useState<SaveFn>(null)
  const [manufacturingSave, setManufacturingSave] = useState<SaveFn>(null)
  const [servicesSave, setServicesSave] = useState<SaveFn>(null)
  const [customersSave, setCustomersSave] = useState<SaveFn>(null)
  const [paymentSave, setPaymentSave] = useState<SaveFn>(null)

  const activeStepSaveFns: (() => Promise<boolean>)[] = (() => {
    switch (activeStep) {
      case 'profile': return [logoSave, basicInfoSave].filter((f): f is () => Promise<boolean> => !!f)
      case 'presence': return [presenceSave, contactSave].filter((f): f is () => Promise<boolean> => !!f)
      case 'businessType': return [businessTypeSave].filter((f): f is () => Promise<boolean> => !!f)
      case 'categories': return [categoriesSave].filter((f): f is () => Promise<boolean> => !!f)
      case 'manufacturing': return [manufacturingSave, servicesSave].filter((f): f is () => Promise<boolean> => !!f)
      case 'customers': return [customersSave].filter((f): f is () => Promise<boolean> => !!f)
      case 'payments': return [paymentSave].filter((f): f is () => Promise<boolean> => !!f)
      default: return []
    }
  })()

  const [stepSaving, setStepSaving] = useState(false)
  const handleStepSave = async () => {
    setStepSaving(true)
    await Promise.all(activeStepSaveFns.map(fn => fn()))
    await refreshVendorData()
    setStepSaving(false)
  }

  // Estado completado por paso -- reusa los mismos booleanos que
  // alimentan computeStoreCompleteness donde se solapan, para no tener
  // 2 definiciones distintas de "completo".
  const hasLogo = !!vendor.logo_url
  const hasDescription = !!(vendor.description && vendor.description.trim())
  const hasContactChannel = !!(vendor.whatsapp || vendor.instagram)
  const hasCategories = categoryIds.length > 0
  const hasBusinessType = businessTypes.length > 0
  const hasServices = services.length > 0
  const hasBankInfo = !!(vendor.bank_name && vendor.bank_account)

  const completeness = computeStoreCompleteness({
    hasLogo, hasDescription, hasContactChannel, hasCategories,
    hasBusinessType, hasServices, hasBankInfo, hasIdentitySubmitted,
  })

  const stepDone: Record<StepId, boolean> = {
    profile: hasLogo && hasDescription,
    presence: hasContactChannel || [vendor.has_physical_store, vendor.has_warehouse, vendor.has_workshop].some(v => v !== null),
    businessType: hasBusinessType,
    categories: hasCategories,
    manufacturing: hasServices || vendor.manufacturing_status !== null,
    customers: targetCustomers.length > 0,
    payments: hasBankInfo,
    verification: hasIdentitySubmitted,
    preview: false,
  }

  const showSaveButton = activeStepSaveFns.length > 0
  const hasAside = activeStep !== 'manufacturing' && activeStep !== 'preview'

  // Stepper horizontal -- solo círculos numerados, sin label al lado
  // (el nombre/subtítulo del paso vive una sola vez, en el encabezado
  // del contenido, no repetido 9 veces en la barra).
  // Círculos conectados por una línea que se rellena de azul a medida
  // que cada paso se completa (no una línea estática) -- los círculos
  // mismos no se estiran (flexShrink:0), la línea (flex:1) es la que
  // absorbe el espacio entre ellos, así no queda vacío.
  // Círculos compactos sobre una barra de progreso de fondo. El relleno
  // azul avanza hasta el último paso completado (datos reales, mismo
  // stepDone de siempre), así la barra atraviesa todos los puntos en vez
  // de ser una línea estática entre ellos.
  const STEP_SIZE = 30
  const STEP_GAP = 18
  const lastDoneIndex = STEPS.reduce((acc, step, i) => (stepDone[step.id] ? i : acc), -1)
  const progressFraction = lastDoneIndex < 0 ? 0 : lastDoneIndex / (STEPS.length - 1)
  const stepperRow = (
    <div className="hidden lg:flex relative items-center" style={{ marginBottom: 24, width: STEPS.length * STEP_SIZE + (STEPS.length - 1) * STEP_GAP }}>
      <div style={{ position: 'absolute', left: STEP_SIZE / 2, right: STEP_SIZE / 2, top: '50%', height: 3, marginTop: -1.5, background: '#E0E4E9', borderRadius: 2 }} />
      <div style={{ position: 'absolute', left: STEP_SIZE / 2, top: '50%', height: 3, marginTop: -1.5, width: `calc((100% - ${STEP_SIZE}px) * ${progressFraction})`, background: 'var(--dashboard-blue)', borderRadius: 2, transition: 'width 200ms ease' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
        {STEPS.map((step, i) => {
          const isActive = step.id === activeStep
          const filled = isActive || stepDone[step.id]
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => goToStep(i)}
              aria-label={step.label}
              style={{
                width: STEP_SIZE, height: STEP_SIZE, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                border: filled ? 'none' : '1.5px solid #D1D4D7',
                background: filled ? 'var(--dashboard-blue)' : '#fff',
                color: filled ? '#fff' : BRAND.gray,
                fontSize: 'var(--text-caption)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )

  const mobileSelect = (
    <select
      value={activeStep}
      onChange={e => goToStep(STEPS.findIndex(s => s.id === e.target.value))}
      className="lg:hidden w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold outline-none bg-white"
    >
      {STEPS.map((step, i) => (
        <option key={step.id} value={step.id}>
          {stepDone[step.id] ? '✓ ' : ''}{i + 1}. {step.label}
        </option>
      ))}
    </select>
  )

  const renderAside = () => {
    if (GENERIC_PREVIEW_STEPS.has(activeStep)) {
      return (
        <>
          <StorePreviewAside vendor={vendor} provinces={provinces} categories={categories} categoryIds={categoryIds} businessTypes={businessTypes} />
          <TipCard />
        </>
      )
    }
    if (activeStep === 'businessType') return <BusinessTypeAside businessTypes={businessTypes} />
    if (activeStep === 'categories') return <CategoriesAside categories={categories} categoryIds={categoryIds} />
    if (activeStep === 'customers') return <HelpAside text="Esta información ayuda a los compradores a saber qué tipo de pedidos aceptas." />
    return null
  }

  return (
    <div style={{ maxWidth: 1180 }}>
      {/* Cabecera */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 'var(--text-dash-title)', fontWeight: 700, lineHeight: 'var(--leading-h1)', marginBottom: 4, color: BRAND.dark }}>Configuración de tu tienda</h1>
        <p style={{ color: BRAND.gray, fontSize: 'var(--text-small)', marginBottom: 14 }}>
          Completa la información de tu negocio para que los compradores puedan conocerte mejor.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-caption)', fontWeight: 700, color: BRAND.dark, marginBottom: 6 }}>
          <span>Perfil {completeness.percent}% completo</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: '#EEF2F6', overflow: 'hidden', maxWidth: 360 }}>
          <div style={{
            height: '100%', width: `${completeness.percent}%`, borderRadius: 3,
            background: completeness.percent >= 100 ? BRAND.green : 'var(--dashboard-yellow)',
          }} />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>{mobileSelect}</div>

      <div className={hasAside ? 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start' : 'grid grid-cols-1 gap-5 items-start'}>
        <div style={{ minWidth: 0 }}>
          {stepperRow}

          {activeStep === 'profile' && (
            <div>
              <StepHeading title="Perfil de la tienda" subtitle="Información básica de tu negocio." />
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                <LogoSection vendorId={vendor.id} userId={userId} initialLogoUrl={vendor.logo_url} onRegisterSave={f => setLogoSave(() => f)} hideOwnButton bare />
                <div style={{ marginTop: 20 }}>
                  <BasicInfoSection
                    vendorId={vendor.id}
                    provinces={provinces}
                    initial={{
                      businessName: vendor.business_name ?? '',
                      description: vendor.description ?? '',
                      provinceId: vendor.province_id ? String(vendor.province_id) : '',
                      address: vendor.address ?? '',
                      legalName: vendor.legal_name ?? '',
                      contactFullName: vendor.contact_full_name ?? '',
                      municipio: vendor.municipio ?? '',
                      sector: vendor.sector ?? '',
                    }}
                    onRegisterSave={f => setBasicInfoSave(() => f)}
                    hideOwnButton
                    bare
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 'presence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <PhysicalPresenceSection
                vendorId={vendor.id}
                initial={{ hasPhysicalStore: vendor.has_physical_store, hasWarehouse: vendor.has_warehouse, hasWorkshop: vendor.has_workshop }}
                onRegisterSave={f => setPresenceSave(() => f)}
                hideOwnButton
              />
              <ContactSection
                vendorId={vendor.id}
                initial={{ whatsapp: vendor.whatsapp ?? '', instagram: vendor.instagram ?? '' }}
                onRegisterSave={f => setContactSave(() => f)}
                hideOwnButton
              />
            </div>
          )}

          {activeStep === 'businessType' && (
            <BusinessTypeSection vendorId={vendor.id} initialBusinessTypes={businessTypes} onRegisterSave={f => setBusinessTypeSave(() => f)} hideOwnButton />
          )}

          {activeStep === 'categories' && (
            <CategoriesSection vendorId={vendor.id} categories={categories} initialCategoryIds={categoryIds} onRegisterSave={f => setCategoriesSave(() => f)} hideOwnButton />
          )}

          {activeStep === 'manufacturing' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ManufacturingSection
                vendorId={vendor.id}
                initial={{
                  manufacturingStatus: vendor.manufacturing_status,
                  productionTime: vendor.production_time,
                  productionTimeCustom: vendor.production_time_custom ?? '',
                  acceptsPrivateLabel: vendor.accepts_private_label,
                  allowsCustomization: vendor.allows_customization,
                }}
                onRegisterSave={f => setManufacturingSave(() => f)}
                hideOwnButton
              />
              <ServicesSection vendorId={vendor.id} initialServices={services} onRegisterSave={f => setServicesSave(() => f)} hideOwnButton />
            </div>
          )}

          {activeStep === 'customers' && (
            <CustomersSection
              vendorId={vendor.id}
              initialTargetCustomers={targetCustomers}
              initial={{
                minOrderQuantity: vendor.min_order_quantity ? String(vendor.min_order_quantity) : '',
                minOrderUnit: vendor.min_order_unit ?? 'unidades',
              }}
              onRegisterSave={f => setCustomersSave(() => f)}
              hideOwnButton
            />
          )}

          {activeStep === 'payments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <PaymentSection
                vendorId={vendor.id}
                initial={{ bankName: vendor.bank_name ?? '', bankAccount: vendor.bank_account ?? '' }}
                onRegisterSave={f => setPaymentSave(() => f)}
                hideOwnButton
              />
              <FaqSection vendorId={vendor.id} categoryIds={categoryIds} />
            </div>
          )}

          {activeStep === 'verification' && (
            <IdentityVerificationSection userId={userId} />
          )}

          {activeStep === 'preview' && (
            <VendorStorePreviewStep vendorId={vendor.id} completenessPercent={completeness.percent} />
          )}

          {/* Navegación del paso */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => goToStep(activeStepIndex - 1)}
              disabled={activeStepIndex === 0}
              style={{
                fontSize: 'var(--text-small)', fontWeight: 700, background: 'transparent', border: 'none', cursor: activeStepIndex === 0 ? 'default' : 'pointer',
                color: BRAND.gray, opacity: activeStepIndex === 0 ? 0 : 1, padding: '10px 4px',
              }}
            >
              ← Atrás
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              {showSaveButton && (
                <button
                  type="button"
                  onClick={handleStepSave}
                  disabled={stepSaving}
                  style={{
                    background: '#fff', color: 'var(--dashboard-blue)', border: '1px solid var(--dashboard-blue)', padding: '10px 20px',
                    borderRadius: 8, fontWeight: 700, fontSize: 'var(--text-small)', cursor: stepSaving ? 'not-allowed' : 'pointer', opacity: stepSaving ? 0.6 : 1,
                  }}
                >
                  {stepSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              )}

              {activeStepIndex < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep(activeStepIndex + 1)}
                  style={{
                    background: 'var(--dashboard-blue)', color: '#fff', border: 'none', padding: '10px 20px',
                    borderRadius: 8, fontWeight: 700, fontSize: 'var(--text-small)', cursor: 'pointer',
                  }}
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  style={{
                    background: BRAND.green, color: '#fff', border: 'none', padding: '10px 20px',
                    borderRadius: 8, fontWeight: 700, fontSize: 'var(--text-small)', cursor: 'pointer',
                  }}
                >
                  Finalizar
                </button>
              )}
            </div>
          </div>
        </div>

        {hasAside && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{renderAside()}</div>}
      </div>
    </div>
  )
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 'var(--text-form-section)', fontWeight: 700, color: BRAND.dark, marginBottom: 3 }}>{title}</h2>
      <p style={{ fontSize: 'var(--text-small)', color: BRAND.gray, margin: 0 }}>{subtitle}</p>
    </div>
  )
}

function asideCardStyle(): React.CSSProperties {
  return { background: '#fff', borderRadius: 16, border: '1px solid #EEF0F2', padding: 18 }
}

function TipCard() {
  return (
    <div style={{ ...asideCardStyle(), display: 'flex', gap: 10 }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
      <p style={{ fontSize: 'var(--text-caption)', color: BRAND.gray, margin: 0, lineHeight: 1.5 }}>
        Un buen perfil genera más confianza y aumenta tus ventas.
      </p>
    </div>
  )
}

// ── Panel derecho, pasos 1-2 / 7-8: resumen chico y persistente de la
// tienda, con acceso directo al perfil público real ──
function StorePreviewAside({ vendor, provinces, categories, categoryIds, businessTypes }: {
  vendor: Vendor
  provinces: Province[]
  categories: Category[]
  categoryIds: number[]
  businessTypes: BusinessType[]
}) {
  const { t } = useTranslation('vendorOptions')
  const [realRatingAvg, setRealRatingAvg] = useState<number | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('vendor_real_stats')
      .select('real_rating_avg')
      .eq('vendor_id', vendor.id)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setRealRatingAvg(data?.real_rating_avg ?? null) })
    return () => { cancelled = true }
  }, [vendor.id])

  const provinceName = provinces.find(p => p.id === vendor.province_id)?.name
  const categoryNames = categories.filter(c => categoryIds.includes(c.id)).slice(0, 4).map(c => c.name)

  return (
    <aside style={asideCardStyle()}>
      <p style={{ fontSize: 'var(--text-caption)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.gray, marginBottom: 12 }}>
        Vista previa de la tienda
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: '#F3F5F7', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 20,
        }}>
          {vendor.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.logo_url} alt={vendor.business_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : '🏪'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: BRAND.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {vendor.business_name}
          </div>
          {provinceName && <div style={{ fontSize: 'var(--text-caption)', color: BRAND.gray }}>📍 {provinceName}</div>}
        </div>
      </div>

      <div style={{ fontSize: 'var(--text-caption)', color: BRAND.gray, marginBottom: 12 }}>
        {realRatingAvg === undefined ? null : realRatingAvg != null ? `⭐ ${realRatingAvg.toFixed(1)}` : 'Sin calificación todavía'}
      </div>

      {businessTypes.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {businessTypes.slice(0, 3).map(bt => (
              <span key={bt} style={{ fontSize: 'var(--text-badge)', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#F3F5F7', color: BRAND.dark }}>{t(`businessType.${bt}`)}</span>
            ))}
          </div>
        </div>
      )}

      {categoryNames.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {categoryNames.map(name => (
              <span key={name} style={{ fontSize: 'var(--text-badge)', fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#F3F5F7', color: BRAND.dark }}>{name}</span>
            ))}
          </div>
        </div>
      )}

      <a
        href={`/tienda/${vendor.id}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block', textAlign: 'center', background: 'var(--dashboard-blue)', color: '#fff',
          textDecoration: 'none', padding: '9px 10px', borderRadius: 8, fontSize: 'var(--text-small)', fontWeight: 700,
        }}
      >
        Ver tienda →
      </a>
    </aside>
  )
}

// ── Panel derecho, paso 3 (Tipo de negocio): lo ya seleccionado en
// este mismo paso, no la tienda completa ──
function BusinessTypeAside({ businessTypes }: { businessTypes: BusinessType[] }) {
  const { t } = useTranslation('vendorOptions')
  return (
    <aside style={asideCardStyle()}>
      <p style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: BRAND.dark, marginBottom: 12 }}>Tu negocio</p>
      {businessTypes.length === 0 ? (
        <p style={{ fontSize: 'var(--text-caption)', color: BRAND.gray }}>Aún no has seleccionado un tipo de negocio.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {businessTypes.map(bt => (
            <div key={bt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-small)', color: BRAND.dark }}>
              <span style={{ color: BRAND.green, fontWeight: 700 }}>✓</span>{t(`businessType.${bt}`)}
            </div>
          ))}
        </div>
      )}
      <p style={{ display: 'flex', gap: 8, fontSize: 'var(--text-caption)', color: BRAND.gray, background: '#F3F7FC', borderRadius: 8, padding: '9px 11px', margin: 0 }}>
        <span>ℹ️</span>
        <span>Esto te permitirá participar en las secciones correspondientes de MercadoRD.</span>
      </p>
    </aside>
  )
}

// ── Panel derecho, paso 4 (Categorías): chips de lo ya elegido ──
function CategoriesAside({ categories, categoryIds }: { categories: Category[]; categoryIds: number[] }) {
  const selected = categories.filter(c => categoryIds.includes(c.id))
  return (
    <aside style={asideCardStyle()}>
      <p style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: BRAND.dark, marginBottom: 12 }}>Categorías seleccionadas</p>
      {selected.length === 0 ? (
        <p style={{ fontSize: 'var(--text-caption)', color: BRAND.gray }}>Aún no has seleccionado categorías.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {selected.map(c => (
            <span key={c.id} style={{ fontSize: 'var(--text-small)', fontWeight: 600, padding: '7px 10px', borderRadius: 8, background: '#F3F7FC', color: 'var(--dashboard-blue)' }}>
              {c.emoji} {c.name}
            </span>
          ))}
        </div>
      )}
    </aside>
  )
}

// ── Panel derecho genérico de ayuda (paso 6: Clientes y condiciones) ──
function HelpAside({ text }: { text: string }) {
  return (
    <aside style={{ ...asideCardStyle(), textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>🤝</div>
      <p style={{ fontSize: 'var(--text-small)', color: BRAND.gray, lineHeight: 1.6, margin: 0 }}>{text}</p>
    </aside>
  )
}
