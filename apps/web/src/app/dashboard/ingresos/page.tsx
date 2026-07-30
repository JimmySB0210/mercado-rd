'use client'
// ============================================================
// MercadoRD — Ingresos (vendor dashboard)
// Ruta: src/app/dashboard/ingresos/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { formatPrice } from '@/types/database.types'
import { BRAND } from '@/lib/colors'

interface IncomeItem {
  id: string
  created_at: string
  price_rdp: number
  quantity: number
  product_name: string
  status: string
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function VendorIncomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [items, setItems] = useState<IncomeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard/ingresos')
        return
      }

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!vendor) {
        router.push('/vendor/register')
        return
      }

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id, created_at, price_rdp, quantity, product:products(name), order:orders(status)')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })

      const mapped: IncomeItem[] = (orderItems ?? []).map((i: any) => ({
        id: i.id,
        created_at: i.created_at,
        price_rdp: i.price_rdp,
        quantity: i.quantity,
        product_name: i.product?.name ?? 'Producto',
        status: i.order?.status ?? 'pending',
      }))

      setItems(mapped)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  // Excluir cancelados de los ingresos reales
  const validItems = items.filter(i => i.status !== 'cancelled')
  const cancelledItems = items.filter(i => i.status === 'cancelled')

  const totalIncome = validItems.reduce((acc, i) => acc + i.price_rdp * i.quantity, 0)
  const totalUnits = validItems.reduce((acc, i) => acc + i.quantity, 0)
  const lostToCancellations = cancelledItems.reduce((acc, i) => acc + i.price_rdp * i.quantity, 0)

  // Agrupar por mes
  const byMonth = new Map<string, number>()
  validItems.forEach(i => {
    const date = new Date(i.created_at)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    byMonth.set(key, (byMonth.get(key) ?? 0) + i.price_rdp * i.quantity)
  })
  const monthRows = [...byMonth.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, total]) => {
      const [year, month] = key.split('-').map(Number)
      return { label: `${MONTH_NAMES[month]} ${year}`, total }
    })

  // Agrupar por producto
  const byProduct = new Map<string, { revenue: number; units: number }>()
  validItems.forEach(i => {
    const current = byProduct.get(i.product_name) ?? { revenue: 0, units: 0 }
    byProduct.set(i.product_name, {
      revenue: current.revenue + i.price_rdp * i.quantity,
      units: current.units + i.quantity,
    })
  })
  const productRows = [...byProduct.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <DashboardSidebar />

      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Ingresos</h1>
          <p style={{ color: '#666', fontSize: 14 }}>Desglose financiero de tu tienda</p>
        </div>

        {/* KPIs principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Ingresos totales</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: BRAND.green }}>{formatPrice(totalIncome)}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Unidades vendidas</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: '#111' }}>{totalUnits}</div>
          </div>
          {lostToCancellations > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Perdido en cancelaciones</div>
              <div style={{ fontWeight: 900, fontSize: 22, color: BRAND.red }}>{formatPrice(lostToCancellations)}</div>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
            <p style={{ color: '#999', fontSize: 14 }}>Aún no tienes ingresos registrados.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="income-grid">

            {/* Por mes */}
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
                Por mes
              </div>
              <div>
                {monthRows.map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 18px', borderBottom: i < monthRows.length - 1 ? '1px solid #f8f8f8' : 'none' }}>
                    <span style={{ fontSize: 13, color: '#666' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{formatPrice(row.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Por producto */}
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
                Por producto
              </div>
              <div>
                {productRows.map(([name, data], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: i < productRows.length - 1 ? '1px solid #f8f8f8' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#333', fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{data.units} vendidos</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{formatPrice(data.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        <style jsx global>{`
          @media (max-width: 768px) {
            .income-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
