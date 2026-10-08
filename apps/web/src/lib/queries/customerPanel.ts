// ============================================================
// MercadoRD — Datos del panel del cliente
// Ruta: src/lib/queries/customerPanel.ts
// ============================================================
// La bandeja (/dashboard/mensajes) carga los pedidos de todos sus
// compradores a la vez. El chat (/mensajes/[id]) carga solo los de un
// comprador con loadCustomerPanelData: cuatro consultas en paralelo,
// solo lectura. Ambos usan el mismo select y el mismo mapeo a
// VendorOrderLine, así que las cifras salen con las mismas definiciones
// (lib/inboxClassification.ts).
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { buildBuyerSummaries, type VendorOrderLine } from '@/lib/inboxClassification'
import type { CustomerPanelData } from '@/components/messages/CustomerPanel'

export const VENDOR_ORDER_ITEMS_SELECT =
  'order_id, price_rdp, quantity, created_at, product:products(name), order:orders(id, status, user_id, created_at)'

export function toVendorOrderLine(item: any): VendorOrderLine {
  return {
    orderId: item.order?.id ?? item.order_id,
    buyerId: item.order?.user_id ?? '',
    status: item.order?.status ?? 'pending',
    amount: (item.price_rdp ?? 0) * (item.quantity ?? 0),
    productName: item.product?.name ?? 'Producto',
    createdAt: item.order?.created_at ?? item.created_at,
  }
}

export async function loadCustomerPanelData(
  supabase: SupabaseClient,
  { conversationId, vendorId, buyerId }: { conversationId: string; vendorId: string; buyerId: string },
): Promise<CustomerPanelData> {
  const [buyerRes, orderItemsRes, quoteMessageRes, quoteRes] = await Promise.all([
    supabase.from('users').select('full_name, avatar_url').eq('id', buyerId).maybeSingle(),
    supabase
      .from('order_items')
      // Mismas columnas que VENDOR_ORDER_ITEMS_SELECT; !inner para filtrar por comprador en la base.
      .select('order_id, price_rdp, quantity, created_at, product:products(name), order:orders!inner(id, status, user_id, created_at)')
      .eq('vendor_id', vendorId)
      .eq('order.user_id', buyerId),
    supabase
      .from('chat_messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .not('chat_quote_id', 'is', null)
      .limit(1),
    supabase
      .from('chat_quotes')
      .select('id, quantity, status, product:products(name)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (orderItemsRes.error) console.error('[loadCustomerPanelData]', orderItemsRes.error)

  const lines = (orderItemsRes.data ?? []).map(toVendorOrderLine).filter(l => l.buyerId === buyerId)
  const quote = quoteRes.data as any

  return {
    id: conversationId,
    buyerId,
    buyerName: buyerRes.data?.full_name ?? null,
    buyerAvatar: buyerRes.data?.avatar_url ?? null,
    hasQuote: (quoteMessageRes.data ?? []).length > 0,
    quote: quote
      ? { id: quote.id, quantity: quote.quantity, status: quote.status, productName: quote.product?.name ?? 'Producto' }
      : null,
    summary: buildBuyerSummaries(lines)[buyerId] ?? null,
  }
}
