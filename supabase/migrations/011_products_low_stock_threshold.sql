-- ═══════════════════════════════════════════════════════════
-- MercadoRD — products.low_stock_threshold + alerta de stock bajo
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- NOTA: esta migración documenta un cambio ya aplicado
-- directamente en Supabase por el usuario -- no se ejecutó desde
-- este archivo. Se agrega aquí solo para que quede rastro en el
-- repo (mismo motivo que 003/004/005/006/010).
--
-- Cambio: products gana una columna opcional,
-- low_stock_threshold int, nullable -- null significa "sin alerta
-- configurada". Un trigger en products notifica al vendor (tabla
-- notifications, mismo sistema que el resto del sitio) SOLO al
-- cruzar el umbral hacia abajo -- no se repite en ventas
-- subsiguientes mientras el stock ya está por debajo del umbral,
-- para no inundar al vendor de notificaciones repetidas.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.products ADD COLUMN low_stock_threshold int;
