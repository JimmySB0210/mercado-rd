-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Limpieza de permisos: funciones de trigger
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Confirmado contra la BD viva: las 25 funciones ligadas a un trigger
-- (pg_trigger) devuelven trigger sin excepción -- ninguna es también
-- invocable vía PERFORM/RPC directo con otro tipo de retorno. Postgres
-- rechaza de entrada cualquier intento de llamar una función
-- RETURNS trigger fuera del mecanismo de CREATE TRIGGER ("trigger
-- functions can only be called as triggers"), sin importar su ACL --
-- a diferencia de las 25 funciones de las migraciones 022/026/027/028,
-- estas NO representan un vector de ataque directo vía
-- /rest/v1/rpc. Este REVOKE es limpieza de mínimo privilegio, no el
-- cierre de un hueco explotable.
--
-- Sin GRANT de vuelta a ningún rol: un trigger se ejecuta con los
-- privilegios de su dueño al dispararse por INSERT/UPDATE/DELETE en la
-- tabla -- no necesita que anon/authenticated/PUBLIC tengan EXECUTE
-- para seguir disparándose con cada operación real de la aplicación.
--
--   Función                              | Tabla                 | Evento
--   enforce_minimum_product_photos       | products              | BEFORE INSERT
--   enforce_otp_before_delivered         | orders                | BEFORE UPDATE
--   enforce_product_limit                | products              | BEFORE INSERT
--   generate_member_id                   | users                 | BEFORE INSERT
--   handle_new_user                      | users                 | AFTER INSERT
--   invalidate_product_translations      | products              | AFTER UPDATE
--   log_dispute_evidence_upload          | dispute_messages      | AFTER INSERT
--   notify_low_stock                     | products              | AFTER UPDATE
--   notify_on_new_dispute                | disputes              | AFTER INSERT
--   notify_on_new_review                 | reviews               | AFTER INSERT
--   notify_on_order_status_change        | orders                | AFTER INSERT
--   notify_on_verification_change        | vendors               | AFTER UPDATE
--   notify_wishlist_price_drop           | products              | AFTER UPDATE
--   protect_vendor_verification_level    | vendors               | BEFORE UPDATE
--   recalculate_product_rating           | reviews               | AFTER INSERT
--   record_order_status_change           | orders                | AFTER INSERT
--   restore_stock_on_cancellation        | orders                | AFTER UPDATE
--   set_published_at                     | products              | BEFORE UPDATE
--   trigger_check_message_flags          | chat_messages         | AFTER INSERT
--   trigger_check_product_flags          | products              | AFTER INSERT
--   update_dispute_timestamp             | dispute_messages      | AFTER INSERT
--   validate_daily_deal_price            | daily_deals           | BEFORE INSERT
--   validate_pricing_tier_overlap        | product_pricing_tiers | BEFORE INSERT
--   validate_real_review                 | reviews               | BEFORE INSERT
--   validate_refund_eligibility          | disputes              | BEFORE INSERT
-- ═══════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.enforce_minimum_product_photos FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_otp_before_delivered FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_product_limit FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_member_id FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.invalidate_product_translations FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_dispute_evidence_upload FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_low_stock FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_dispute FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_review FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_order_status_change FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_verification_change FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_wishlist_price_drop FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_vendor_verification_level FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_product_rating FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_order_status_change FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_stock_on_cancellation FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_published_at FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_check_message_flags FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_check_product_flags FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_dispute_timestamp FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_daily_deal_price FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_pricing_tier_overlap FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_real_review FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_refund_eligibility FROM PUBLIC;
