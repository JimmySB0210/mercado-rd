'use client'
// ============================================================
// MercadoRD — Panel de filtros del directorio de proveedores
// Ruta: src/components/providers/ProviderFilters.tsx
// ============================================================

import { BUSINESS_TYPE_OPTIONS, VENDOR_SERVICE_GROUPS } from '@/lib/vendorWizardOptions'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { CheckboxGrid, labelStyle, inputStyle } from '@/components/vendor/wizard/sharedUI'
import { CategoryMultiSelect } from '@/components/vendor/wizard/CategoryMultiSelect'
import type { BusinessType, VendorService, Category } from '@/types/database.types'
import type { ProviderFiltersState } from './types'

interface ProvinceOption { id: number; name: string }

interface Props {
  filters: ProviderFiltersState
  onChange: (patch: Partial<ProviderFiltersState>) => void
  provinces: ProvinceOption[]
  categories: Category[]
}

export function ProviderFilters({ filters, onChange, provinces, categories }: Props) {
  const { t } = useTranslation('vendorOptions')
  const { t: td } = useTranslation('directory')
  const businessTypeOptions = BUSINESS_TYPE_OPTIONS.map(value => ({ value, label: t(`businessType.${value}`) }))

  const toggleBusinessType = (value: BusinessType) => {
    onChange({
      businessTypes: filters.businessTypes.includes(value)
        ? filters.businessTypes.filter(v => v !== value)
        : [...filters.businessTypes, value],
    })
  }

  const toggleService = (value: VendorService) => {
    onChange({
      services: filters.services.includes(value)
        ? filters.services.filter(v => v !== value)
        : [...filters.services, value],
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={labelStyle}>{td('businessTypeFilterLabel')}</label>
        <CheckboxGrid options={businessTypeOptions} selected={filters.businessTypes} onToggle={toggleBusinessType} columns={1} />
      </div>

      <div>
        <label style={labelStyle}>{td('categoryFilterLabel')}</label>
        <CategoryMultiSelect
          categories={categories}
          selectedIds={filters.categoryIds}
          onChange={ids => onChange({ categoryIds: ids })}
        />
      </div>

      <div>
        <label style={labelStyle}>{td('provinceFilterLabel')}</label>
        <select
          style={{ ...inputStyle, background: '#fff' }}
          value={filters.provinceId}
          onChange={e => onChange({ provinceId: e.target.value })}
        >
          <option value="">{td('allProvincesOption')}</option>
          {provinces.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>{td('maxMoqFilterLabel')}</label>
        <input
          type="number"
          min="1"
          style={inputStyle}
          value={filters.maxMoq}
          onChange={e => onChange({ maxMoq: e.target.value })}
          placeholder={td('maxMoqPlaceholder')}
        />
      </div>

      <div>
        <label style={labelStyle}>{td('servicesFilterLabel')}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {VENDOR_SERVICE_GROUPS.map(group => (
            <div key={group.titleKey}>
              <p style={{ fontSize: 11, color: '#999', fontWeight: 600, marginBottom: 6 }}>{t(`serviceGroupTitles.${group.titleKey}`)}</p>
              <CheckboxGrid
                options={group.options.map(value => ({ value, label: t(`service.${value}`) }))}
                selected={filters.services}
                onToggle={toggleService}
                columns={1}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>{td('minVerificationFilterLabel')}</label>
        <select
          style={{ ...inputStyle, background: '#fff' }}
          value={filters.minVerificationLevel}
          onChange={e => onChange({ minVerificationLevel: e.target.value })}
        >
          <option value="">{td('anyVerificationOption')}</option>
          <option value="2">{td('verifiedOrMoreOption')}</option>
          <option value="3">{td('manufacturerVerifiedOrMoreOption')}</option>
          <option value="4">{td('featuredOnlyOption')}</option>
        </select>
      </div>
    </div>
  )
}
