-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Revocar EXECUTE solo de anon (requieren sesión real)
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Verificado cuerpo por cuerpo contra la BD viva: las 17 funciones de
-- acá ya validan auth.uid() internamente y actúan sobre datos del
-- propio usuario que llama (su propia cuenta, su propia conversación,
-- su propio carrito abandonado, su propia entrega) -- no hay ningún
-- hueco de "cualquiera puede tocar los datos de cualquiera" en el
-- cuerpo. El problema real es más simple: nunca deberían ser
-- invocables por anon (sin sesión) para empezar, ya que todas asumen
-- un auth.uid() real. Dejan de estar expuestas a un visitante sin
-- cuenta; siguen funcionando exactamente igual para cualquier usuario
-- autenticado, que es como se usan hoy en el frontend.
--
-- mark_conversation_read entra acá DESPUÉS de su fix de código
-- (migración 025) -- ya verifica dueño real, ahora además deja de ser
-- invocable sin sesión.
--
-- apply_coupon_use es un caso distinto a los otros 16: su código ya
-- estaba bien (incrementa uses_count de un cupón ya validado, sin
-- ningún hueco), el permiso de anon quedó desactualizado de una
-- auditoría anterior -- esto es un tidy de consistencia, sin cambio
-- de comportamiento.
-- ═══════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.accept_chat_quote FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_gift_order FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_own_account FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_delivery_otp FROM anon;
REVOKE EXECUTE ON FUNCTION public.request_chat_quote FROM anon;
REVOKE EXECUTE ON FUNCTION public.respond_chat_quote FROM anon;
REVOKE EXECUTE ON FUNCTION public.request_external_verification FROM anon;
REVOKE EXECUTE ON FUNCTION public.send_chat_message FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_order_tracking FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_own_language FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_own_phone FROM anon;
REVOKE EXECUTE ON FUNCTION public.upsert_abandoned_cart FROM anon;
REVOKE EXECUTE ON FUNCTION public.verify_delivery_otp FROM anon;
REVOKE EXECUTE ON FUNCTION public.recover_abandoned_cart FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_featured_product FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_conversation_read FROM anon;
REVOKE EXECUTE ON FUNCTION public.apply_coupon_use FROM anon;
