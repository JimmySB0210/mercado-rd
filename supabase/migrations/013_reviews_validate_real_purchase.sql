-- ═══════════════════════════════════════════════════════════
-- MercadoRD — reviews: validar compra real antes de insertar
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- NOTA: este trigger ya se aplicó directamente en Supabase por el
-- usuario -- no se ejecutó desde este archivo. Se agrega aquí solo
-- para que quede rastro en el repo (mismo motivo que 003/004/005/
-- 006/010/011/012).
--
-- Antes de esto, reviews solo verificaba que la reseña fuera "a tu
-- propio nombre" (user_id = auth.uid()), sin cruzar que el pedido
-- fuera real, estuviera entregado, o que el producto/vendor
-- realmente hubieran sido parte de ese pedido. Ahora:
--   1. El pedido (order_id) debe ser del mismo comprador (user_id),
--      tener status = 'delivered', y order_items debe tener una fila
--      con ese product_id + vendor_id exactos -- no basta con
--      "algún" pedido/producto/vendor sin relación entre sí.
--   2. Un vendor no puede reseñar su propio producto (aunque
--      técnicamente "comprara" en su propia tienda).
--
-- Nunca bloquea nada del flujo normal: el botón "Dejar reseña" en
-- app/perfil/pedidos/page.tsx ya solo aparece para
-- order.status === 'delivered' con el order_id/product_id/vendor_id
-- reales de ese pedido -- verificado en vivo, esta validación nunca
-- se dispara para un usuario legítimo a través de la UI.
--
-- Los 2 mensajes de excepción están escritos para el usuario final
-- (no jerga técnica) y ahora se muestran tal cual en
-- ReviewModal.tsx en vez de un error genérico -- ver ese archivo.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.validate_real_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_valid boolean;
BEGIN
  -- El pedido debe ser realmente del comprador, estar entregado de
  -- verdad, y el producto/vendor deben haber sido parte real de ese
  -- pedido — no solo "algún" pedido/producto/vendor sin relación
  SELECT EXISTS (
    SELECT 1 FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.id = NEW.order_id
      AND o.user_id = NEW.user_id
      AND o.status = 'delivered'
      AND oi.product_id = NEW.product_id
      AND oi.vendor_id = NEW.vendor_id
  ) INTO v_order_valid;

  IF NOT v_order_valid THEN
    RAISE EXCEPTION 'Solo puedes dejar una reseña de un producto que hayas comprado y recibido realmente';
  END IF;

  -- El vendor no puede reseñar su propio producto, aunque técnicamente
  -- lo hubiera "comprado" desde su propia tienda
  IF EXISTS (SELECT 1 FROM vendors WHERE id = NEW.vendor_id AND user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'No puedes reseñar tu propio producto';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_validate_real_review
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION validate_real_review();
