-- ═══════════════════════════════════════════════════════════
-- MercadoRD — coupons: cerrar la lectura pública
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Ya aplicada en vivo por Jimmy.
--
-- coupons_public_read (SELECT con is_active = true) dejaba leer todos los cupones
-- activos a cualquier visitante anónimo, con sus códigos. Se elimina. La lectura
-- queda en coupons_vendor_read (migración 040), que deja ver solo los cupones
-- propios del vendedor y los del admin. Los visitantes ven 0 cupones, y
-- validate_coupon sigue funcionando sin sesión porque es SECURITY DEFINER.

DROP POLICY coupons_public_read ON public.coupons;
