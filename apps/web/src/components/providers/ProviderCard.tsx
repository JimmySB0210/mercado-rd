'use client'
// ============================================================
// MercadoRD — Tarjeta de resultado en el directorio de proveedores
// Ruta: src/components/providers/ProviderCard.tsx
// ============================================================

import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { VerificationBadge } from '@/components/vendor/VerificationBadge'
import type { Vendor, BusinessType, VendorService } from '@/types/database.types'

interface Props {
  vendor: Vendor
  provinceName: string | null
  businessTypes: BusinessType[]
  services: VendorService[]
}

export function ProviderCard({ vendor, provinceName, businessTypes, services }: Props) {
  const { t } = useTranslation('vendorOptions')
  const { t: td } = useTranslation('directory')
  const businessTypeLabels = businessTypes.map(v => t(`businessType.${v}`))
  const serviceLabels = services.slice(0, 3).map(v => t(`service.${v}`))

  return (
    <a
      href={`/tienda/${vendor.id}`}
      className="block bg-white rounded-2xl border border-gray-100 p-4 no-underline hover:border-gray-200 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-14 h-14 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center text-xl font-bold text-gray-300">
          {vendor.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
          ) : (
            vendor.business_name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{vendor.business_name}</p>
          {provinceName && <p className="text-xs text-gray-400 mt-0.5">📍 {provinceName}</p>}
          <div className="mt-1.5">
            <VerificationBadge level={vendor.verification_level ?? 1} />
          </div>
        </div>
      </div>

      {businessTypeLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {businessTypeLabels.map(label => (
            <span key={label} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {label}
            </span>
          ))}
        </div>
      )}

      {serviceLabels.length > 0 && (
        <p className="text-xs text-gray-500 mb-2">
          {serviceLabels.map((label, i) => (
            <span key={label}>
              <span className="text-green-600 font-bold">✓</span> {label}{i < serviceLabels.length - 1 ? '  ' : ''}
            </span>
          ))}
        </p>
      )}

      {!!vendor.min_order_quantity && (
        <p className="text-xs font-medium" style={{ color: BRAND.blue }}>
          MOQ: {vendor.min_order_quantity} {vendor.min_order_unit ?? td('unitsFallback')}
        </p>
      )}
    </a>
  )
}
