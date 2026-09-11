-- ═══════════════════════════════════════════════════════════
-- MercadoRD — products.video_url (video opcional de producto)
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- NOTA: esta migración documenta un cambio ya aplicado
-- directamente en Supabase por el usuario -- no se ejecutó desde
-- este archivo. Se agrega aquí solo para que quede rastro en el
-- repo (mismo motivo que 003/004/005/006).
--
-- Cambio: products gana una columna opcional, video_url text,
-- nullable -- URL pública del video subido al bucket "products"
-- (mismo bucket público que las fotos, ver
-- lib/storage/upload.ts::uploadProductVideo). Un solo video por
-- producto, no una galería -- a diferencia de "images" (array),
-- video_url es un string simple que complementa la galería de
-- fotos, no la reemplaza.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.products ADD COLUMN video_url text;
