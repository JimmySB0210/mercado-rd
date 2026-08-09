'use client'
// ============================================================
// MercadoRD — Wizard vendor, Paso 6: Revisión final
// Ruta: src/components/vendor/wizard/Step6Review.tsx
// ============================================================

import { BRAND } from '@/lib/colors'
import {
  BUSINESS_TYPE_OPTIONS, MANUFACTURING_STATUS_OPTIONS, PRODUCTION_TIME_OPTIONS,
  CUSTOMIZATION_OPTION_LABELS, VENDOR_SERVICE_GROUPS, CUSTOMER_TYPE_OPTIONS,
} from '@/lib/vendorWizardOptions'
import type { Category } from '@/types/database.types'
import type { VendorWizardFormData } from './vendorWizardTypes'
import { SaveErrorBox } from './sharedUI'

interface ProvinceOption { id: number; name: string }

interface Props {
  data: VendorWizardFormData
  provinces: ProvinceOption[]
  categories: Category[]
  onEditStep: (step: number) => void
  onSubmit: () => void
  saving: boolean
  error: string | null
}

const yesNoLabel = (v: boolean | null) => v === null ? '—' : (v ? 'Sí' : 'No')

function SectionHeader({ title, step, onEditStep }: { title: string; step: number; onEditStep: (step: number) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: BRAND.dark, margin: 0 }}>{title}</h3>
      <button
        type="button"
        onClick={() => onEditStep(step)}
        style={{ background: 'transparent', border: 'none', color: BRAND.blue, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
      >
        Editar
      </button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, padding: '5px 0' }}>
      <span style={{ color: BRAND.gray, flexShrink: 0 }}>{label}</span>
      <span style={{ color: BRAND.dark, fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

const sectionStyle: React.CSSProperties = {
  border: '1px solid #EEE', borderRadius: 10, padding: '14px 16px',
}

export function Step6Review({ data, provinces, categories, onEditStep, onSubmit, saving, error }: Props) {
  const provinceName = provinces.find(p => String(p.id) === data.provinceId)?.name ?? '—'

  const businessTypeLabels = data.businessTypes
    .map(v => BUSINESS_TYPE_OPTIONS.find(o => o.value === v)?.label ?? v)
    .join(', ') || '—'

  const categoryNames = data.categoryIds
    .map(id => categories.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(', ') || '—'

  const manufacturingLabel = MANUFACTURING_STATUS_OPTIONS.find(o => o.value === data.manufacturingStatus)?.label ?? '—'
  const productionTimeLabel = data.productionTime === 'custom'
    ? (data.productionTimeCustom || '—')
    : (PRODUCTION_TIME_OPTIONS.find(o => o.value === data.productionTime)?.label ?? '—')

  const allServiceOptions = VENDOR_SERVICE_GROUPS.flatMap(g => g.options)
  const serviceLabels = data.services
    .map(v => allServiceOptions.find(o => o.value === v)?.label ?? v)
    .join(', ') || '—'

  const customerLabels = data.targetCustomers
    .map(v => CUSTOMER_TYPE_OPTIONS.find(o => o.value === v)?.label ?? v)
    .join(', ') || '—'

  const minOrderLabel = data.minOrderQuantity
    ? `${data.minOrderQuantity} ${data.minOrderUnit || 'unidades'}`
    : 'Sin mínimo'

  const showManufacturingDetails = data.manufacturingStatus === 'fabricates_own' || data.manufacturingStatus === 'mixed'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 13, color: BRAND.gray, margin: 0 }}>
        Revisa todo antes de crear tu perfil. Puedes editar cualquier sección.
      </p>

      <div style={sectionStyle}>
        <SectionHeader title="Información básica" step={1} onEditStep={onEditStep} />
        <Row label="Nombre del negocio" value={data.businessName || '—'} />
        <Row label="Razón social" value={data.legalName || '—'} />
        <Row label="Contacto" value={data.contactFullName || '—'} />
        <Row label="WhatsApp" value={data.whatsapp || '—'} />
        <Row label="Ubicación" value={[provinceName, data.municipio, data.sector].filter(Boolean).join(', ') || '—'} />
        <Row label="Dirección" value={data.address || '—'} />
        <Row label="Tienda física" value={yesNoLabel(data.hasPhysicalStore)} />
        <Row label="Almacén" value={yesNoLabel(data.hasWarehouse)} />
        <Row label="Taller" value={yesNoLabel(data.hasWorkshop)} />
      </div>

      <div style={sectionStyle}>
        <SectionHeader title="Tipo de negocio" step={2} onEditStep={onEditStep} />
        <Row label="Tipos" value={businessTypeLabels} />
      </div>

      <div style={sectionStyle}>
        <SectionHeader title="Qué vendes" step={3} onEditStep={onEditStep} />
        <Row label="Categorías" value={categoryNames} />
        <Row label="Fabricación" value={manufacturingLabel} />
        {showManufacturingDetails && (
          <>
            <Row label="Tiempo de producción" value={productionTimeLabel} />
            <Row label="Marca privada" value={yesNoLabel(data.acceptsPrivateLabel)} />
            <Row label="Personalización" value={data.allowsCustomization ? CUSTOMIZATION_OPTION_LABELS[data.allowsCustomization] : '—'} />
          </>
        )}
      </div>

      <div style={sectionStyle}>
        <SectionHeader title="Servicios" step={4} onEditStep={onEditStep} />
        <Row label="Ofreces" value={serviceLabels} />
      </div>

      <div style={sectionStyle}>
        <SectionHeader title="A quién vendes" step={5} onEditStep={onEditStep} />
        <Row label="Clientes" value={customerLabels} />
        <Row label="Compra mínima" value={minOrderLabel} />
      </div>

      <SaveErrorBox error={error} />

      <button
        type="button"
        onClick={onSubmit}
        disabled={saving}
        style={{
          background: BRAND.blue, color: '#fff', border: 'none', padding: 15, borderRadius: 8,
          fontWeight: 700, fontSize: 15, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Creando tu perfil...' : 'Crear mi perfil de proveedor'}
      </button>
    </div>
  )
}
