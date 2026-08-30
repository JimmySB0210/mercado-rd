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
import { ConfirmPageContent, OrderNotFoundNotice } from './ConfirmPageContent'
import type { InvoiceData } from '@/lib/invoice/generateInvoice'

export default async function ConfirmPage(
  { searchParams }: { searchParams: Promise<{ order?: string }> }
) {
  const { order: orderId } = await searchParams

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <OrderNotFoundNotice />
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

  // Marcar el carrito abandonado como recuperado — fire-and-forget,
  // pero awaited para que no se corte a medias en un entorno serverless
  const { error: recoverError } = await supabase.rpc('recover_abandoned_cart')
  if (recoverError) console.error('[ConfirmPage] No se pudo marcar el carrito como recuperado:', recoverError)

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
    recipientName: order.recipient_name,
    recipientPhone: order.recipient_phone,
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
      <ConfirmPageContent
        shortId={shortId}
        deliveryAddress={order.delivery_address}
        provinceName={(order.province as { name: string } | null)?.name ?? ''}
        notes={order.notes}
        items={order.items as any}
        subtotalRdp={order.subtotal_rdp}
        deliveryRdp={order.delivery_rdp}
        itbisRdp={order.itbis_rdp}
        totalRdp={order.total_rdp}
        vendorsWithWhatsapp={vendorsWithWhatsapp as any}
        invoiceData={invoiceData}
      />
    </div>
  )
}
