-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Revocar EXECUTE de anon Y authenticated (uso 100% interno)
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Verificado cuerpo por cuerpo contra la BD viva antes de escribir
-- esto (no se aplicó a ciegas la categorización inicial):
--
--   check_content_flags — solo se usa desde adentro de otros
--   triggers/funciones para revisar contenido contra
--   content_flag_terms; el navegador nunca la necesita directo.
--
--   log_audit_event — igual: se llama vía PERFORM desde otras
--   funciones SECURITY DEFINER (create_order_from_cart,
--   accept_chat_quote, etc.), nunca directo desde el cliente.
--
--   is_vendor_order — helper interno (¿esta orden pertenece a este
--   vendor?), usado desde otras funciones/policies, no una operación
--   que el frontend dispare por su cuenta.
--
--   save_product_translation — su único llamador real
--   (api/ai/translate-product/route.ts) ahora usa
--   createServiceRoleClient() en vez del cliente atado a la sesión
--   del visitante (ver ese archivo) -- la traducción cacheada es la
--   misma para cualquiera que pida ese producto+idioma, no depende de
--   auth.uid() de quien la disparó. Revocar de authenticated Y anon
--   por igual: ninguno de los dos debe poder llamarla directo, ni
--   siquiera un usuario logueado normal -- solo service_role (que
--   ignora estos GRANT/REVOKE) desde esa ruta.
--
-- Todas SECURITY DEFINER llamadas internamente vía PERFORM/SELECT
-- desde OTRAS funciones siguen funcionando igual sin este permiso: una
-- función SECURITY DEFINER corre con los privilegios de su DUEÑO, no
-- del rol que la invocó, así que revocarle EXECUTE a anon/authenticated
-- no rompe llamadas internas función-a-función, solo cierra la puerta
-- a invocarlas directo vía /rest/v1/rpc.
-- ═══════════════════════════════════════════════════════════

REVOKE EXECUTE ON FUNCTION public.check_content_flags FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.log_audit_event FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.is_vendor_order FROM authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.save_product_translation FROM authenticated, anon;
