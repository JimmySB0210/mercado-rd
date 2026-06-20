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

const STATUS_OPTIONS = [
  { value: 'pending',   label: '⏳ Pendiente',  bg: '#FEF9C3', text: '#713f12' },
  { value: 'confirmed', label: '✅ Confirmado',  bg: '#DBEAFE', text: '#1e3a8a' },
  { value: 'preparing', label: '📦 Preparando', bg: '#E0E7FF', text: '#3730a3' },
  { value: 'shipped',   label: '🚚 Enviado',    bg: '#DBEAFE', text: '#1e3a8a' },
  { value: 'delivered', label: '✓ Entregado',   bg: '#DCFCE7', text: '#166534' },
  { value: 'cancelled', label: '✗ Cancelado',   bg: '#FEE2E2', text: '#991B1B' },
]

interface Props {
  orderId: string
  currentStatus: string
}

export function OrderStatusSelect({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const current = STATUS_OPTIONS.find(s => s.value === status) ?? STATUS_OPTIONS[0]

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
      {STATUS_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
