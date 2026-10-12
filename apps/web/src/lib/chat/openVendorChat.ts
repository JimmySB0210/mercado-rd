// ============================================================
// MercadoRD — Abrir el chat con un vendedor
// Ruta: src/lib/chat/openVendorChat.ts
// ============================================================
// Flujo que ya usaba ContactVendorButton (página de producto), extraído
// para que la tarjeta de /proveedores y el perfil de tienda lo
// compartan: send_chat_message crea la conversación con un primer
// mensaje (nunca vacía) y devuelve el id del MENSAJE, así que después
// se lee su conversation_id.
//
// Sin producto de contexto (productId null): conversations tiene
// UNIQUE(buyer_id, vendor_id, product_id) sin NULLS NOT DISTINCT, así
// que con product_id NULL el ON CONFLICT de send_chat_message nunca
// salta y cada llamada crearía otra conversación. Por eso antes se
// busca la conversación comprador-tienda sin producto y, si existe,
// solo se abre. Dos pestañas a la vez todavía podrían duplicarla: eso
// necesita el índice con NULLS NOT DISTINCT en la base.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'

export type OpenVendorChatResult =
  | { status: 'login'; url: string }
  | { status: 'opened'; conversationId: string }
  | { status: 'error' }

export async function openVendorChat(
  supabase: SupabaseClient,
  { vendorId, productId, message, returnTo }: { vendorId: string; productId: string | null; message: string; returnTo: string },
): Promise<OpenVendorChatResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'login', url: '/login?redirect=' + encodeURIComponent(returnTo) }

  if (productId === null) {
    const { data: existing, error: lookupError } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('vendor_id', vendorId)
      .is('product_id', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (lookupError) {
      console.error('[openVendorChat] lookup', lookupError)
      return { status: 'error' }
    }
    if (existing) return { status: 'opened', conversationId: existing.id }
  }

  const { data: messageId, error } = await supabase.rpc('send_chat_message', {
    p_vendor_id: vendorId,
    p_product_id: productId,
    p_message: message,
  })
  if (error || !messageId) {
    console.error('[openVendorChat]', error)
    return { status: 'error' }
  }

  const { data: sentMessage } = await supabase
    .from('chat_messages')
    .select('conversation_id')
    .eq('id', messageId)
    .single()

  return sentMessage?.conversation_id
    ? { status: 'opened', conversationId: sentMessage.conversation_id }
    : { status: 'error' }
}
