'use client'
// ============================================================
// MercadoRD — Selector de status de orden (vendor dashboard)
// Ruta: src/components/vendor/OrderStatusSelect.tsx
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/lib/colors'
import { notifyOrderShipped, notifyOrderDelivered } from '@/lib/whatsapp/notifications'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { DashboardDict } from '@/lib/i18n/es/dashboard'

const STATUS_OPTION_KEYS: { value: string; labelKey: keyof DashboardDict; bg: string; text: string }[] = [
  { value: 'pending',   labelKey: 'statusPendingLabel',   bg: '#FEF9C3', text: '#713f12' },
  { value: 'confirmed', labelKey: 'statusConfirmedLabel', bg: '#DBEAFE', text: '#1e3a8a' },
  { value: 'preparing', labelKey: 'statusPreparingLabel', bg: '#E0E7FF', text: '#3730a3' },
  { value: 'shipped',   labelKey: 'statusShippedLabel',   bg: '#DBEAFE', text: '#1e3a8a' },
  { value: 'delivered', labelKey: 'selectDeliveredLabel', bg: '#DCFCE7', text: '#166534' },
  { value: 'cancelled', labelKey: 'selectCancelledLabel', bg: '#FEE2E2', text: '#991B1B' },
]

interface Props {
  orderId: string
  currentStatus: string
}

export function OrderStatusSelect({ orderId, currentStatus }: Props) {
  const { t } = useTranslation('dashboard')
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const current = STATUS_OPTION_KEYS.find(s => s.value === status) ?? STATUS_OPTION_KEYS[0]

  const handleChange = async (newStatus: string) => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (!error) {
      setStatus(newStatus)
      router.refresh()

      // Notificar al comprador por WhatsApp — fire and forget: no bloquea la UI
      // ni muestra error si falla (ej. credenciales de Meta sin configurar todavía)
      if (newStatus === 'shipped' || newStatus === 'delivered') {
        supabase
          .from('orders')
          .select('id, total_rdp, delivery_type, tracking_code, user:users(full_name, phone)')
          .eq('id', orderId)
          .single()
          .then(({ data }) => {
            if (!data) return
            if (newStatus === 'shipped') {
              notifyOrderShipped(data as any, data.tracking_code ?? 'Pendiente')
            } else {
              notifyOrderDelivered(data as any)
            }
          }, () => {})
      }
    } else {
      console.error('[OrderStatusSelect]', error)
    }
    setLoading(false)
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      style={{
        background: current.bg,
        color: current.text,
        border: 'none',
        borderRadius: 20,
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 700,
        cursor: loading ? 'wait' : 'pointer',
        appearance: 'none',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {STATUS_OPTION_KEYS.map(opt => (
        <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
      ))}
    </select>
  )
}
