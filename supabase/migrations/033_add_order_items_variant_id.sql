-- ═══════════════════════════════════════════════════════════
-- MercadoRD — order_items.variant_id
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Ya aplicada en vivo. Se agrega acá como registro fiel.
--
-- order_items nunca tuvo esta columna. La reescritura de hoy de
-- create_order_from_cart (migración 020) descontaba
-- product_variants.stock de la variante correcta al crear el pedido,
-- pero no guardaba cuál variante había sido -- sin este dato era
-- imposible que restore_stock_on_cancellation supiera qué restaurar al
-- cancelar. Nullable: un item sin variante (producto sin variantes)
-- nunca la tiene, y los pedidos creados antes de este fix quedan con
-- variant_id = NULL (ver 034/035 para la limitación conocida sobre
-- esos pedidos de prueba).
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.order_items
  ADD COLUMN variant_id uuid REFERENCES public.product_variants(id);
