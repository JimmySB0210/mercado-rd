'use client'
// ============================================================
// MercadoRD — Filtros de /admin/auditoria
// Ruta: src/components/admin/AuditLogFilters.tsx
// ============================================================
// Mismo patrón que VendorVerificationFilters.tsx: selects/inputs
// nativos que escriben en la URL (?eventType=&dateFrom=&dateTo=)
// para que la vista filtrada sea compartible/recargable.
// ============================================================

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/hooks/useTranslation'

const inputStyle: React.CSSProperties = {
  border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 13, background: '#fff',
}

interface Props {
  eventTypes: string[]
}

export function AuditLogFilters({ eventTypes }: Props) {
  const { t } = useTranslation('admin')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const eventType = searchParams.get('eventType') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <select value={eventType} onChange={e => updateParam('eventType', e.target.value)} style={{ ...inputStyle, minWidth: 220 }}>
        <option value="">{t('allEventTypesOption')}</option>
        {eventTypes.map(value => (
          <option key={value} value={value}>{value}</option>
        ))}
      </select>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
        {t('dateFromLabel')}
        <input
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={e => updateParam('dateFrom', e.target.value)}
          style={inputStyle}
        />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
        {t('dateToLabel')}
        <input
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={e => updateParam('dateTo', e.target.value)}
          style={inputStyle}
        />
      </label>
    </div>
  )
}
