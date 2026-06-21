// ============================================================
// MercadoRD — Confirmación de pedido
// Ruta: src/app/confirm/page.tsx
// ============================================================
// Server Component — lee la orden real de Supabase usando
// el ?order=ID que viene del checkout
// ============================================================

import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/shop/Navbar'
import { DownloadInvoiceButton } from '@/components/order/DownloadInvoiceButton'
import { formatPrice } from '@/types/database.types'
import type { InvoiceData } from '@/lib/invoice/generateInvoice'

export default async function ConfirmPage(
  { searchParams }: { searchParams: Promise<{ order?: string }> }
) {
  const { order: orderId } = await searchParams

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">No se encontró el número de pedido.</p>
          <a href="/" className="text-blue-600 underline mt-4 inline-block">Volver al inicio</a>
        </div>
      </div>
    )
  }

  const supabase = await createServerClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      province:provinces_rd(name),
      items:order_items(
        *,
        product:products(name, images),
        vendor:vendors(business_name, whatsapp)
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) notFound()

  const shortId = order.id.split('-')[0].toUpperCase()

  // Nombre del comprador — consulta aparte (no embebida) para evitar que
  // RLS sobre la tabla users vacíe la fila completa de orders cuando
  // quien ve esta página no es ni el comprador ni un admin.
  const { data: buyer } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', order.user_id)
    .maybeSingle()

  // Email del usuario actualmente logueado (la tabla pública users no
  // tiene email — vive solo en auth.users). Asume que quien ve esta
  // página es el comprador, igual que el resto de la página no verifica
  // dueño de la orden todavía.
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const invoiceData: InvoiceData = {
    orderId: order.id,
    createdAt: order.created_at,
    buyerName: buyer?.full_name ?? 'Cliente',
    buyerEmail: authUser?.email ?? '',
    deliveryAddress: order.delivery_address,
    provinceName: (order.province as { name: string } | null)?.name ?? '',
    paymentMethod: order.payment_method,
    items: (order.items as any[]).map(item => ({
      productName: item.product?.name ?? 'Producto',
      vendorName: item.vendor?.business_name ?? 'Vendedor',
      quantity: item.quantity,
      priceRdp: item.price_rdp,
      size: item.size,
      color: item.color,
    })),
    subtotalRdp: order.subtotal_rdp,
    itbisRdp: order.itbis_rdp,
    deliveryRdp: order.delivery_rdp,
    totalRdp: order.total_rdp,
  }

  // Vendors únicos con WhatsApp en esta orden (puede haber más de uno)
  const vendorsWithWhatsapp = Array.from(
    new Map(
      (order.items as any[])
        .filter(item => item.vendor?.whatsapp)
        .map(item => [item.vendor.business_name, item.vendor as { business_name: string; whatsapp: string }])
    ).values()
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Confirmación */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido confirmado!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Gracias por comprar en MercadoRD 🇩🇴<br />
            Recibirás confirmación por WhatsApp en los próximos minutos.
          </p>
          <div className="inline-block bg-gray-50 rounded-xl px-6 py-3 font-mono font-bold text-gray-900">
            # RD-{shortId}
          </div>
        </div>

        {/* Entrega */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            📍 ENTREGA
          </h2>
          <p className="text-sm text-gray-900">{order.delivery_address}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {(order.province as { name: string } | null)?.name}
          </p>
          {order.notes && (
            <p className="text-xs text-gray-400 mt-2">📝 {order.notes}</p>
          )}
        </div>

        {/* Productos */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
          <h2 className="text-sm font-semibold text-gray-700 px-6 pt-6 pb-3 flex items-center gap-2">
            📦 PRODUCTOS
          </h2>
          <div className="divide-y divide-gray-50">
            {(order.items as any[]).map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-6 py-4">
                <div className="w-12 h-12 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
                  {item.product?.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.product?.name}</p>
                  <p className="text-xs text-gray-400">
                    {[item.size, item.color].filter(Boolean).join(' · ')}
                    {(item.size || item.color) && ' · '}
                    x{item.quantity} · {item.vendor?.business_name}
                  </p>
                </div>
                <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                  {formatPrice(item.price_rdp * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="border-t border-gray-100 px-6 py-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal_rdp)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Envío</span>
              <span>{formatPrice(order.delivery_rdp)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>ITBIS (18%)</span>
              <span>{formatPrice(order.itbis_rdp)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-100">
              <span>Total pagado</span>
              <span>{formatPrice(order.total_rdp)}</span>
            </div>
          </div>
        </div>

        {/* Contactar vendedor(es) */}
        {vendorsWithWhatsapp.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              📲 CONTACTAR VENDEDOR{vendorsWithWhatsapp.length > 1 ? 'ES' : ''}
            </h2>
            <div className="flex flex-col gap-2">
              {vendorsWithWhatsapp.map(vendor => (
                <a
                  key={vendor.business_name}
                  href={`https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(`Hola, tengo una pregunta sobre mi pedido #RD-${shortId}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full border border-green-500 text-green-600 text-sm font-medium py-2.5 rounded-lg hover:bg-green-50 transition-colors no-underline"
                >
                  Contactar a {vendor.business_name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <a
            href="/"
            className="block text-center bg-gray-900 text-white py-3 rounded-xl font-medium no-underline hover:bg-gray-800 transition-colors"
          >
            Seguir comprando →
          </a>
          <a
            href="/perfil/pedidos"
            className="block text-center bg-white border border-gray-200 text-gray-900 py-3 rounded-xl font-medium no-underline hover:bg-gray-50 transition-colors"
          >
            Ver mis pedidos
          </a>
          <DownloadInvoiceButton data={invoiceData} />
        </div>

        {/* Garantía */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="font-semibold text-green-800 text-sm mb-1">
            🛡️ Compra protegida por MercadoRD
          </p>
          <p className="text-xs text-green-700">
            Si el producto no llega o no es como se describe, te devolvemos tu dinero completo.
          </p>
        </div>

      </main>
    </div>
  )
}
