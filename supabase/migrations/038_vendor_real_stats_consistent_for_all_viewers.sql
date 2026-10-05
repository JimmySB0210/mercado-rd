-- ═══════════════════════════════════════════════════════════
-- MercadoRD — vendor_real_stats: mismo resultado para cualquier lector
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Ya aplicada en vivo por Jimmy.
--
-- La vista se había creado con security_invoker = true. Con esa opción la
-- vista corre con los permisos de quien la consulta, así que la clave
-- anónima solo sumaba las ventas de productos publicados y no las de
-- todos los productos del vendedor. Con security_invoker = false la vista
-- corre con los permisos de su dueño y devuelve lo mismo para cualquier
-- lector. Solo expone agregados por vendedor: vendor_id, ventas reales,
-- calificación promedio y cantidad de reseñas.

ALTER VIEW public.vendor_real_stats SET (security_invoker = false);
