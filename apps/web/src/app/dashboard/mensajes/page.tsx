// ============================================================
// MercadoRD — Mensajes (vendor dashboard)
// Ruta: src/app/dashboard/mensajes/page.tsx
// ============================================================
// Server Component. Carga en lote (sin N+1) lo necesario para la bandeja:
//   - conversations del vendedor (misma consulta de siempre)
//   - nombres y avatares de los compradores con conversación
//   - pedidos del vendedor (order_items → orders) de esos compradores
//   - mensajes con cotización y la última cotización de cada conversación
//   - tipos de negocio del vendedor, para el contexto proveedor/minorista
// Solo lectura: abrir la lista no marca nada como leído. Eso lo hace
// /mensajes/[id] al abrir el chat, como siempre.
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentVendor } from '@/lib/queries/vendor-dashboard'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { isSupplierContext } from '@/lib/vendorContext'
import { buildBuyerSummaries, type VendorOrderLine } from '@/lib/inboxClassification'
import { VENDOR_ORDER_ITEMS_SELECT, toVendorOrderLine } from '@/lib/queries/customerPanel'
import { MensajesContent, type InboxRow } from './MensajesContent'

export default async function VendorMessagesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/mensajes')

  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/vendor/register')

  const [conversationsRes, typesRes] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, buyer_id, last_message, last_message_at, vendor_unread')
      .eq('vendor_id', vendor.id)
      .order('last_message_at', { ascending: false }),
    supabase
      .from('vendor_business_types')
      .select('business_type')
      .eq('vendor_id', vendor.id),
  ])

  if (conversationsRes.error) console.error('[VendorMessagesPage]', conversationsRes.error)
  const conversations = conversationsRes.data ?? []
  const convIds = conversations.map(c => c.id)
  const buyerIds = [...new Set(conversations.map(c => c.buyer_id))]

  const emptyIn = <T,>(rows: T[]) => Promise.resolve({ data: rows, error: null })

  const [buyersRes, orderItemsRes, quoteMessagesRes, quotesRes] = await Promise.all([
    buyerIds.length > 0
      ? supabase.from('users').select('id, full_name, avatar_url').in('id', buyerIds)
      : emptyIn([] as { id: string; full_name: string | null; avatar_url: string | null }[]),
    supabase
      .from('order_items')
      .select(VENDOR_ORDER_ITEMS_SELECT)
      .eq('vendor_id', vendor.id),
    convIds.length > 0
      ? supabase.from('chat_messages').select('conversation_id').in('conversation_id', convIds).not('chat_quote_id', 'is', null)
      : emptyIn([] as { conversation_id: string }[]),
    convIds.length > 0
      ? supabase
          .from('chat_quotes')
          .select('id, conversation_id, quantity, status, created_at, product:products(name)')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false })
      : emptyIn([] as any[]),
  ])

  const buyerMap = new Map((buyersRes.data ?? []).map(b => [b.id, b]))
  const buyerSet = new Set(buyerIds)

  const lines: VendorOrderLine[] = (orderItemsRes.data ?? [])
    .map(toVendorOrderLine)
    .filter(l => buyerSet.has(l.buyerId))
  const summaries = buildBuyerSummaries(lines)

  const quoteConvIds = new Set((quoteMessagesRes.data ?? []).map((m: any) => m.conversation_id as string))
  const latestQuote = new Map<string, any>()
  ;(quotesRes.data ?? []).forEach((q: any) => {
    if (!latestQuote.has(q.conversation_id)) latestQuote.set(q.conversation_id, q)
  })

  const rows: InboxRow[] = conversations.map(c => {
    const buyer = buyerMap.get(c.buyer_id)
    const quote = latestQuote.get(c.id)
    return {
      id: c.id,
      last_message: c.last_message,
      last_message_at: c.last_message_at,
      vendor_unread: c.vendor_unread,
      buyerId: c.buyer_id,
      buyerName: buyer?.full_name ?? null,
      buyerAvatar: buyer?.avatar_url ?? null,
      hasQuote: quoteConvIds.has(c.id),
      quote: quote
        ? {
            id: quote.id,
            quantity: quote.quantity,
            status: quote.status,
            productName: quote.product?.name ?? 'Producto',
          }
        : null,
      summary: summaries[c.buyer_id] ?? null,
    }
  })

  const supplierContext = isSupplierContext((typesRes.data ?? []).map((r: any) => r.business_type))

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>
      <DashboardSidebar />
      <MensajesContent rows={rows} supplierContext={supplierContext} />
    </div>
  )
}
