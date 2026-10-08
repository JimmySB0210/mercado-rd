'use client'
// ============================================================
// MercadoRD — Panel del cliente dentro del chat
// Ruta: src/components/messages/ChatCustomerPanel.tsx
// ============================================================
// Solo lo monta /mensajes/[id] cuando quien mira es el vendedor. Carga
// por su cuenta los datos de ese comprador (loadCustomerPanelData), sin
// tocar el estado del chat. Escritorio (1024 px o más): columna derecha.
// Móvil: oculto hasta que el botón del encabezado lo abre a pantalla
// completa (mismas clases .inbox-panel que la bandeja).
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { loadCustomerPanelData } from '@/lib/queries/customerPanel'
import { CustomerPanel, type CustomerPanelData } from '@/components/messages/CustomerPanel'

export function ChatCustomerPanel({ conversationId, vendorId, buyerId, open, onClose }: {
  conversationId: string
  vendorId: string
  buyerId: string
  open: boolean
  onClose: () => void
}) {
  const [data, setData] = useState<CustomerPanelData | null>(null)

  useEffect(() => {
    let cancelled = false
    loadCustomerPanelData(createClient(), { conversationId, vendorId, buyerId })
      .then(result => { if (!cancelled) setData(result) })
      .catch(error => console.error('[ChatCustomerPanel]', error))
    return () => { cancelled = true }
  }, [conversationId, vendorId, buyerId])

  return (
    <aside className={`inbox-panel chat-customer-panel${open ? ' open' : ''}`} style={{ minWidth: 0 }}>
      {data && <CustomerPanel row={data} onClose={onClose} inChat />}
    </aside>
  )
}
