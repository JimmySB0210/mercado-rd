-- ═══════════════════════════════════════════════════════════
-- MercadoRD — notify_self: wrapper seguro para auto-notificarse
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Ya aplicada en vivo. Se agrega acá como registro fiel, mismo
-- criterio que 003/009/013/014/015/028.
--
-- Reemplaza el GRANT de create_notification a authenticated que se
-- había propuesto en la 031 y que, a propósito, nunca se aplicó --
-- create_notification acepta un p_user_id arbitrario, así que
-- devolverle EXECUTE a cualquier usuario autenticado habría permitido
-- crear notificaciones a nombre de OTRO usuario (mismo patrón de hueco
-- que record_payment/activate_pro_plan). notify_self no recibe
-- p_user_id como parámetro en absoluto -- usa auth.uid() internamente
-- siempre, imposible de usar mal por construcción. create_notification
-- se queda exactamente como en 022/026/028: sin EXECUTE para
-- authenticated/anon, uso 100% interno (vía PERFORM desde otras
-- funciones SECURITY DEFINER, como create_order_from_cart).
--
-- useAuth.ts (alerta de "nuevo inicio de sesión") y
-- perfil/seguridad/page.tsx (alerta de "contraseña cambiada") ya
-- migrados a notify_self en el frontend.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_self(p_type text, p_title text, p_body text, p_link text DEFAULT NULL, p_data jsonb DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;
  RETURN create_notification(auth.uid(), p_type, p_title, p_body, p_link, p_data);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.notify_self FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_self TO authenticated;
