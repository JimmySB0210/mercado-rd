'use client'
// ============================================================
// MercadoRD — Filtros de /admin/proveedores
// Ruta: src/components/admin/VendorVerificationFilters.tsx
// ============================================================
// Selects nativos que escriben en la URL (?level=&businessType=)
// para que la vista filtrada sea compartible/recargable.
// ============================================================

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { BUSINESS_TYPE_OPTIONS } from '@/lib/vendorWizardOptions'
import { useTranslation } from '@/lib/hooks/useTranslation'

const selectStyle: React.CSSProperties = {
  border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff', minWidth: 200,
}

export function VendorVerificationFilters() {
  const { t } = useTranslation('vendorOptions')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const level = searchParams.get('level') ?? ''
  const businessType = searchParams.get('businessType') ?? ''

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('vendor') // cambiar filtros cierra el detalle abierto
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <select value={level} onChange={e => updateParam('level', e.target.value)} style={selectStyle}>
        <option value="">Todos los niveles</option>
        {[1, 2, 3, 4].map(l => (
          <option key={l} value={l}>Nivel {l} — {t(`verificationLevel.${l}` as Parameters<typeof t>[0])}</option>
        ))}
      </select>

      <select value={businessType} onChange={e => updateParam('businessType', e.target.value)} style={selectStyle}>
        <option value="">Todos los tipos de negocio</option>
        {BUSINESS_TYPE_OPTIONS.map(value => (
          <option key={value} value={value}>{t(`businessType.${value}`)}</option>
        ))}
      </select>
    </div>
  )
}
