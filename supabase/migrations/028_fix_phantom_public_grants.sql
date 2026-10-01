-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Corregir REVOKE inefectivos por el grant a PUBLIC
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Los REVOKE de 022/026/027 (REVOKE EXECUTE ... FROM authenticated,
-- anon / FROM anon) no tuvieron ningún efecto real: pg_proc.proacl
-- mostraba PUBLIC con EXECUTE otorgado en las 25 funciones tocadas
-- hoy (el default de Postgres al crear una función, salvo que se
-- revoque explícito) -- y como PUBLIC aplica a TODO rol sin importar
-- lo que se le revoque a ese rol en particular, anon/authenticated
-- seguían pudiendo llamarlas igual que antes.
--
-- Confirmado en vivo (consulta directa a pg_proc.proacl) por el
-- usuario, quien ya aplicó este mismo fix directo en la base real
-- antes de que este archivo existiera -- se agrega acá solo para que
-- el repo quede como registro fiel de lo que de verdad corrió, mismo
-- motivo que 003/009/013/014/015 (cambios aplicados primero en
-- Supabase, documentados después). No se reescriben 022/026/027 --
-- quedan como constancia del error, esta migración es la que
-- realmente cierra el hueco.
--
-- LECCIÓN para cualquier REVOKE futuro (el resto de la tabla de las
-- 62 funciones, todavía pendiente): SIEMPRE incluir PUBLIC de forma
-- explícita, nunca alcanza con nombrar authenticated/anon solos.
--
-- Dos grupos, mismos 25 nombres que 022+026 (8) y 027 (17):
--
--   Grupo A -- 100% interno, SIN grant de vuelta a ningún rol de
--   aplicación (solo queda alcanzable por el dueño de la función /
--   service_role, que ignora ACL): record_payment, activate_pro_plan,
--   reduce_variant_stock, create_notification (venían de 022) +
--   check_content_flags, log_audit_event, is_vendor_order,
--   save_product_translation (venían de 026). = 8.
--
--   Grupo B -- deben seguir siendo llamables con sesión real: se les
--   revoca PUBLIC (así anon de verdad queda afuera) y se les otorga
--   EXECUTE a authenticated explícito, para que sigan funcionando
--   exactamente igual para cualquier usuario logueado. Mismos 17 de
--   027. = 17.
--
-- Total 25, coincide con "REVOKE ... FROM PUBLIC en las 25 funciones
-- de esta ronda" confirmado por el usuario.
-- ═══════════════════════════════════════════════════════════

-- ─── Grupo A: 100% interno, sin GRANT de vuelta ──────────────────────
REVOKE EXECUTE ON FUNCTION public.record_payment FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.activate_pro_plan FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reduce_variant_stock FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_notification FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_content_flags FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_audit_event FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_vendor_order FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_product_translation FROM PUBLIC;

-- ─── Grupo B: revocar PUBLIC, re-otorgar a authenticated ─────────────
REVOKE EXECUTE ON FUNCTION public.accept_chat_quote FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_chat_quote TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_gift_order FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_gift_order TO authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_own_account FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_own_account TO authenticated;

REVOKE EXECUTE ON FUNCTION public.generate_delivery_otp FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_delivery_otp TO authenticated;

REVOKE EXECUTE ON FUNCTION public.request_chat_quote FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_chat_quote TO authenticated;

REVOKE EXECUTE ON FUNCTION public.respond_chat_quote FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_chat_quote TO authenticated;

REVOKE EXECUTE ON FUNCTION public.request_external_verification FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_external_verification TO authenticated;

REVOKE EXECUTE ON FUNCTION public.send_chat_message FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_chat_message TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_order_tracking FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_tracking TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_own_language FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_own_language TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_own_phone FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_own_phone TO authenticated;

REVOKE EXECUTE ON FUNCTION public.upsert_abandoned_cart FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_abandoned_cart TO authenticated;

REVOKE EXECUTE ON FUNCTION public.verify_delivery_otp FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_delivery_otp TO authenticated;

REVOKE EXECUTE ON FUNCTION public.recover_abandoned_cart FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recover_abandoned_cart TO authenticated;

REVOKE EXECUTE ON FUNCTION public.toggle_featured_product FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_featured_product TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_conversation_read FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read TO authenticated;

REVOKE EXECUTE ON FUNCTION public.apply_coupon_use FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_coupon_use TO authenticated;
