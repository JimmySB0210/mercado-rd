// ============================================================
// MercadoRD — Chip de estado (Activado / Desactivado / No disponible)
// Ruta: src/components/profile/StatusChip.tsx
// ============================================================
// Solo "on" usa verde (icono verde + texto oscuro sobre fondo verde
// suave); "off" y "unavailable" son neutros. El texto nunca va en verde
// ni en gris terciario: con ese contraste no llegaría a 4.5:1.
// ============================================================

import { AlertCircle, CheckCircle2, MinusCircle } from 'lucide-react'

export type StatusChipState = 'on' | 'off' | 'unavailable'

interface Props {
  status: StatusChipState
  label: string
}

export function StatusChip({ status, label }: Props) {
  const Icon = status === 'on' ? CheckCircle2 : status === 'off' ? MinusCircle : AlertCircle
  return (
    <span
      className="inline-flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 text-caption font-semibold"
      style={{
        background: status === 'on' ? 'var(--color-green-subtle)' : 'var(--color-divider)',
        color: status === 'on' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        borderRadius: 'var(--radius-pill)',
      }}
    >
      <Icon size={14} aria-hidden="true" style={{ color: status === 'on' ? 'var(--color-green)' : 'var(--color-text-secondary)' }} />
      {label}
    </span>
  )
}
