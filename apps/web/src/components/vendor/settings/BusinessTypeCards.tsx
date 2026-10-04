'use client'
// ============================================================
// MercadoRD — Configuración, tarjetas de selección de "Tipo de negocio"
// Ruta: src/components/vendor/settings/BusinessTypeCards.tsx
// ============================================================
// Reemplazo visual de CheckboxGrid SOLO para BusinessTypeSection --
// mismas options/selected/onToggle, tratamiento más grande tipo
// tarjeta de rol (ícono + label centrado) en vez de filas compactas.
// CheckboxGrid sigue intacto para Servicios/Clientes/Presencia/
// Fabricación, que no lo piden.
//
// Íconos: lucide-react (ya es dependencia del proyecto -- mismo set que
// usan DashboardSidebar/Navbar) en vez de emoji, para que el lenguaje
// visual coincida con el resto del dashboard. "service_provider" NO
// vive acá -- BusinessTypeSection lo saca de esta grilla y lo muestra
// como pregunta aparte, igual que la referencia.
// ============================================================

import { Factory, Package, Store, Ship, Truck, Handshake, Tag, Palette } from 'lucide-react'
import type { BusinessType } from '@/types/database.types'

const ICON_BY_TYPE: Partial<Record<BusinessType, typeof Factory>> = {
  manufacturer: Factory,
  wholesaler: Package,
  retailer: Store,
  importer: Ship,
  distributor: Truck,
  supplier: Handshake,
  private_label: Tag,
  artisan: Palette,
}

interface Props {
  options: { value: BusinessType; label: string }[]
  selected: BusinessType[]
  onToggle: (value: BusinessType) => void
}

export function BusinessTypeCards({ options, selected, onToggle }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {options.map(opt => {
        const checked = selected.includes(opt.value)
        const Icon = ICON_BY_TYPE[opt.value]
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            style={{
              position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: '16px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
              border: checked ? '1.5px solid var(--dashboard-blue)' : '1px solid #E0E0E0',
              background: checked ? 'color-mix(in srgb, var(--dashboard-blue) 6%, white)' : '#fff',
            }}
          >
            {checked && (
              <span style={{
                position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: '50%',
                background: 'var(--dashboard-blue)', color: '#fff', fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                ✓
              </span>
            )}
            {Icon && <Icon size={24} color={checked ? 'var(--dashboard-blue)' : '#818F98'} strokeWidth={1.75} />}
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#131A18', lineHeight: 1.3 }}>{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
