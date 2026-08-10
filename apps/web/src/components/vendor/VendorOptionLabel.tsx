'use client'
// ============================================================
// MercadoRD — Label traducido de una opción del vendor (businessType,
// service, etc.)
// Ruta: src/components/vendor/VendorOptionLabel.tsx
// ============================================================
// Puente para usar useTranslation('vendorOptions') dentro de Server
// Components (tienda/[id], admin/proveedores) que solo necesitan
// mostrar UN label suelto — no justifica extraer toda la página a un
// Client Component aparte. `value` es un valor dinámico (viene de la
// BD), así que el path exacto no se puede tipar en el call site; se
// castea una sola vez aquí, no en cada lugar que lo usa.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'

type Category = 'businessType' | 'manufacturingStatus' | 'productionTime' | 'customerType' | 'customizationOption' | 'service'

interface Props {
  category: Category
  value: string
}

export function VendorOptionLabel({ category, value }: Props) {
  const { t } = useTranslation('vendorOptions')
  const path = `${category}.${value}` as Parameters<typeof t>[0]
  return <>{t(path)}</>
}
