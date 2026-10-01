-- ═══════════════════════════════════════════════════════════
-- MercadoRD — restore_stock_on_cancellation: restaurar stock de variante
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Ya aplicada en vivo. Dump literal de pg_get_functiondef(), no
-- reconstrucción -- se agrega acá como registro fiel, mismo criterio
-- que 003/009/013/014/015/028.
--
-- Antes de este fix, el UPDATE de abajo sobre product_variants no
-- existía: al cancelar un pedido se restauraba products.stock (y se
-- descontaba sold_count) pero nunca product_variants.stock, porque
-- order_items no tenía forma de saber qué variante había sido (ver
-- 033/034 -- order_items.variant_id no existía hasta hoy).
--
-- LIMITACIÓN CONOCIDA: las 4 órdenes de prueba canceladas hoy durante
-- el smoke test (#RD-336F8052, #RD-CF8668D4, #RD-7266C044 y una
-- cuarta) tienen order_items.variant_id = NULL -- se crearon antes de
-- 033/034. Su cancelación no ejercitó el segundo UPDATE de esta
-- función (el WHERE oi.variant_id IS NOT NULL nunca matcheó ninguna
-- fila suya). El camino de restauración de stock de variante queda
-- sin probar en vivo hasta la próxima cancelación real de un pedido
-- con variante creado DESPUÉS de este fix.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.restore_stock_on_cancellation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE products p SET
      stock = p.stock + oi.quantity,
      sold_count = GREATEST(0, p.sold_count - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND p.id = oi.product_id;

    UPDATE product_variants pv SET
      stock = pv.stock + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.variant_id IS NOT NULL AND pv.id = oi.variant_id;
  END IF;
  RETURN NEW;
END;
$function$;
