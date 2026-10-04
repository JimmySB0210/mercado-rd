-- ═══════════════════════════════════════════════════════════
-- MercadoRD — recalcular products.sold_count desde pedidos reales
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Ya aplicada en vivo (supabase_migrations.schema_migrations,
-- version 20261004042603). Dump literal del statement aplicado, no
-- reconstrucción -- mismo criterio que 019/035.
--
-- sold_count tenía valores sembrados (demo) que se mostraban al público
-- como ventas reales. Esta migración lo recalcula desde order_items de
-- pedidos no cancelados, con el mismo criterio que create_order_from_cart
-- (suma al crear) y restore_stock_on_cancellation (resta al cancelar).

-- sold_count tenía valores sembrados (demo) que se mostraban al público como ventas reales.
-- Se recalcula desde order_items de pedidos no cancelados: mismo criterio que
-- create_order_from_cart (suma al crear) y restore_stock_on_cancellation (resta al cancelar).
UPDATE public.products p
SET sold_count = COALESCE((
  SELECT SUM(oi.quantity)
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.product_id = p.id AND o.status != 'cancelled'
), 0)::int;
