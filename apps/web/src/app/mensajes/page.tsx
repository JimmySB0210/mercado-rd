'use client'
// ============================================================
// MercadoRD — Mensajes (centro de contacto)
// Ruta: src/app/mensajes/page.tsx
// ============================================================
// No es un chat interno — es un directorio de los vendors con
// los que el usuario ha interactuado (vía pedidos), cada uno
// con acceso directo a WhatsApp. Más simple y honesto que
// simular un chat que no existe.
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { BRAND } from '@/lib/colors'

interface VendorContact {
  vendor_id: string
  business_name: string
  logo_url: string | null
  whatsapp: string | null
  last_order_id: string
  last_order_date: string
  product_names: string[]
}

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [contacts, setContacts] = useState<VendorContact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/mensajes')
        return
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!orders || orders.length === 0) {
        setContacts([])
        setLoading(false)
        return
      }

      const orderIds = orders.map(o => o.id)
      const orderDateMap = new Map(orders.map(o => [o.id, o.created_at]))

      const { data: items } = await supabase
        .from('order_items')
        .select('order_id, vendor_id, product:products(name), vendor:vendors(business_name, logo_url, whatsapp)')
        .in('order_id', orderIds)

      // Agrupar por vendor — quedarnos con la orden más reciente de cada uno
      const vendorMap = new Map<string, VendorContact>()

      for (const item of (items ?? []) as any[]) {
        const vendorId = item.vendor_id
        const orderDate = orderDateMap.get(item.order_id) ?? ''
        const productName = item.product?.name ?? 'Producto'

        const existing = vendorMap.get(vendorId)
        if (!existing) {
          vendorMap.set(vendorId, {
            vendor_id: vendorId,
            business_name: item.vendor?.business_name ?? 'Vendedor',
            logo_url: item.vendor?.logo_url ?? null,
            whatsapp: item.vendor?.whatsapp ?? null,
            last_order_id: item.order_id,
            last_order_date: orderDate,
            product_names: [productName],
          })
        } else if (orderDate > existing.last_order_date) {
          existing.last_order_id = item.order_id
          existing.last_order_date = orderDate
          existing.product_names = [productName]
        } else if (item.order_id === existing.last_order_id && !existing.product_names.includes(productName)) {
          existing.product_names.push(productName)
        }
      }

      const sorted = [...vendorMap.values()].sort(
        (a, b) => b.last_order_date.localeCompare(a.last_order_date)
      )

      setContacts(sorted)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mensajes</h1>
        <p className="text-sm text-gray-400 mb-6">
          Contacta directamente a las tiendas con las que has comprado
        </p>

        {contacts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-gray-500 mb-2">Aún no tienes conversaciones</p>
            <p className="text-sm text-gray-400 mb-4">
              Cuando hagas una compra, podrás contactar al vendedor directamente desde aquí.
            </p>
            <a href="/" className="text-blue-600 underline text-sm">Explorar productos</a>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map(c => {
              const shortId = c.last_order_id.split('-')[0].toUpperCase()
              const date = new Date(c.last_order_date).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })
              const productSummary = c.product_names.length === 1
                ? c.product_names[0]
                : `${c.product_names[0]} +${c.product_names.length - 1} más`

              const whatsappMsg = encodeURIComponent(
                `Hola, te escribo por mi pedido #RD-${shortId} en MercadoRD.`
              )

              return (
                <div key={c.vendor_id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden"
                    style={{ background: BRAND.blue }}
                  >
                    {c.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logo_url} alt={c.business_name} className="w-full h-full object-cover" />
                    ) : (
                      c.business_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{c.business_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {productSummary} · #RD-{shortId} · {date}
                    </p>
                  </div>
                  {c.whatsapp ? (
                    <a
                      href={`https://wa.me/${c.whatsapp}?text=${whatsappMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 border border-green-500 text-green-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-50 transition-colors no-underline"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Chat
                    </a>
                  ) : (
                    <span className="text-xs text-gray-300 flex-shrink-0">Sin WhatsApp</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
