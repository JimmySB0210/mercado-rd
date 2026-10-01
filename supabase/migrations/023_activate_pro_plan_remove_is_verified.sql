-- ═══════════════════════════════════════════════════════════
-- MercadoRD — activate_pro_plan: quitar is_verified del UPDATE
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- CORRECCIÓN sobre el intento anterior de esta misma migración: ese
-- intento cambiaba RETURNS uuid a RETURNS void (Postgres lo rechazó —
-- CREATE OR REPLACE no permite cambiar el tipo de retorno, hace falta
-- DROP FUNCTION primero) y además se había perdido por completo el
-- INSERT INTO vendor_subscriptions del cuerpo real -- el registro
-- real de la suscripción (azul_order_id, auth_code, starts_at,
-- expires_at). Ese era exactamente el riesgo de reconstruir sin el
-- pg_get_functiondef() literal, y esta vez se confirmó en la práctica.
--
-- Este archivo restaura esa parte y deja TODO lo demás igual al
-- intento anterior -- el ÚNICO cambio de comportamiento real sigue
-- siendo is_verified = true, que ya no se toca.
--
-- OJO — sigue sin ser un dump literal de pg_get_functiondef(). Lo que
-- tengo confirmado de fuentes reales:
--   - Firma de entrada (p_vendor_id, p_amount_rdp, p_azul_order_id,
--     p_auth_code): confirmada por su único llamador real
--     (dashboard/plan/page.tsx, llamada nombrada -- PostgREST exige
--     que coincida exacto).
--   - RETURNS uuid + INSERT INTO vendor_subscriptions ...
--     RETURNING id INTO v_subscription_id + RETURN v_subscription_id
--     al final: como lo describiste ahora, tomado literal.
--   - auth.uid() IS NULL / dueño del vendor / monto == 49900 /
--     UPDATE vendors SET plan = 'pro': como en el intento anterior,
--     que no señalaste como incorrecto.
--
-- Lo que NO tengo confirmado y estoy asumiendo para que el INSERT
-- compile -- REVISAR ESTO ESPECÍFICAMENTE contra
-- pg_get_functiondef('activate_pro_plan'::regproc) antes de aplicar:
--   - Columnas exactas de vendor_subscriptions más allá de las 4 que
--     nombraste: asumo también vendor_id (FK, obvio) y amount_rdp (el
--     monto pagado, dato razonable a guardar junto al resto). Si el
--     nombre real de alguna columna es distinto, el INSERT falla en
--     la aplicación -- falla segura (Postgres rechaza la migración,
--     no corrompe nada), pero falla al fin.
--   - Duración de la suscripción: asumo starts_at = NOW(),
--     expires_at = NOW() + INTERVAL '1 month' (plan mensual). Si Pro
--     es anual o tiene otra duración, este intervalo es incorrecto.
--
-- is_verified NO es lo mismo que plan='pro' -- son dos señales de
-- confianza completamente distintas. Qué depende de is_verified
-- (confirmado por grep en todo el frontend, ~28 archivos, entre
-- ellos):
--   - La insignia "✓ Vendedor verificado" en la tarjeta de vendedor
--     de /producto/[id] y en el checklist de confianza del buy-box
--   - El perfil público de tienda (/tienda/[id])
--   - PRÁCTICAMENTE todas las grillas/tarjetas de producto del sitio
--     (ProductCard.tsx y sus ~15 consumidores: BestSellers, Trending,
--     Popular, RecentlyPublished, RecommendedProducts, RelatedProducts,
--     SearchResultsGrid, HomeProductGrid, NearbyProducts, LowStock,
--     FeaturedProvidersGrid, VendorProductsCarousel, etc.)
--   - El panel de administración (lib/queries/admin.ts) -- que además
--     ya maneja un verification_level (entero) SEPARADO de
--     is_verified, confirmando que existe un flujo real de
--     verificación de identidad manejado por un admin, independiente
--     de si el vendor pagó Pro.
-- Activar Pro nunca debería otorgar esta insignia -- es una promesa
-- sobre identidad/legitimidad del vendedor, no sobre cuánto paga por
-- el plan.
--
-- Con esta migración YA NO se puede llamar directo (022 le revoca
-- EXECUTE a authenticated/anon) -- este CREATE OR REPLACE es
-- "defensa en profundidad": para cuando exista una ruta servidor real
-- que sí la invoque (con verificación real contra Azul primero), que
-- el cuerpo ya no le regale is_verified a cualquiera que pague Pro.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.activate_pro_plan(
  p_vendor_id uuid,
  p_amount_rdp int,
  p_azul_order_id text,
  p_auth_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subscription_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM vendors WHERE id = p_vendor_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF p_amount_rdp != 49900 THEN
    RAISE EXCEPTION 'Monto inválido para el plan Pro';
  END IF;

  -- is_verified ya NO se toca acá -- ver comentario arriba. Es el
  -- ÚNICO cambio de comportamiento real de esta migración.
  UPDATE vendors
  SET plan = 'pro'
  WHERE id = p_vendor_id;

  INSERT INTO vendor_subscriptions (
    vendor_id, amount_rdp, azul_order_id, auth_code, starts_at, expires_at
  ) VALUES (
    p_vendor_id, p_amount_rdp, p_azul_order_id, p_auth_code, NOW(), NOW() + INTERVAL '1 month'
  )
  RETURNING id INTO v_subscription_id;

  RETURN v_subscription_id;
END;
$function$;
