'use client'
// ============================================================
// MercadoRD — Mis Disputas (comprador)
// Ruta: src/app/perfil/disputas/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { BRAND } from '@/lib/colors'

interface DisputeRow {
  id: string
  order_id: string
  reason: string
  status: string
  created_at: string
}

const REASON_LABELS: Record<string, string> = {
  not_received: 'No recibí el pedido',
  not_as_described: 'No es como se describe',
  damaged: 'Llegó dañado',
  wrong_item: 'Producto equivocado',
  refund_request: 'Solicito reembolso',
  other: 'Otro',
}

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  open:      { label: 'Abierta',    bg: '#FEF9C3', text: '#713f12' },
  reviewing: { label: 'En revisión', bg: '#DBEAFE', text: '#1e3a8a' },
  resolved:  { label: 'Resuelta',   bg: '#DCFCE7', text: '#166534' },
  closed:    { label: 'Cerrada',    bg: '#F3F4F6', text: '#666' },
}

export default function MyDisputesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [disputes, setDisputes] = useState<DisputeRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/perfil/disputas')
        return
      }

      const { data, error } = await supabase
        .from('disputes')
        .select('id, order_id, reason, status, created_at')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) console.error('[MyDisputesPage]', error)
      setDisputes(data ?? [])
      setLoading(false)
    }
    load()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">Cargando tus disputas...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mis disputas</h1>
        <p className="text-sm text-gray-400 mb-6">
          {disputes.length} {disputes.length === 1 ? 'disputa' : 'disputas'}
        </p>

        {disputes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">🤝</div>
            <p className="text-gray-500 mb-2">No tienes disputas abiertas.</p>
            <p className="text-sm text-gray-400">
              Si tienes un problema con un pedido, puedes abrir una disputa desde "Mis pedidos".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map(d => {
              const shortId = d.order_id.split('-')[0].toUpperCase()
              const status = STATUS_LABELS[d.status] ?? STATUS_LABELS.open
              const date = new Date(d.created_at).toLocaleDateString('es-DO', {
                day: 'numeric', month: 'long', year: 'numeric',
              })

              return (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between flex-wrap gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: BRAND.blue }} className="font-bold text-sm">#RD-{shortId}</span>
                      <span
                        style={{ background: status.bg, color: status.text }}
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{REASON_LABELS[d.reason] ?? d.reason}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{date}</p>
                  </div>
                  <a
                    href={`/perfil/disputas/${d.id}`}
                    className="text-sm font-semibold no-underline flex-shrink-0"
                    style={{ color: BRAND.blue }}
                  >
                    Ver detalle →
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
