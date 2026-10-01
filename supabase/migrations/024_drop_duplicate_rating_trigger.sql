-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Quitar el trigger de rating duplicado
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- after_review_insert (AFTER INSERT OR UPDATE ON reviews, migración
-- 001 de este repo, función update_product_rating()) quedó
-- redundante contra un trigger más nuevo que nunca se documentó en
-- este repo, recalculate_product_rating() -- que además cubre DELETE,
-- caso que after_review_insert nunca manejó (una reseña borrada nunca
-- le hizo recalcular el promedio). Confirmado contra la BD viva por
-- el usuario directamente.
--
-- Se borra SOLO el trigger, no la función update_product_rating() —
-- queda huérfana pero inofensiva (nada la invoca sin el trigger); se
-- puede dropear aparte si se quiere, no lo incluyo acá porque no fue
-- lo que se pidió.
-- ═══════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS after_review_insert ON public.reviews;
