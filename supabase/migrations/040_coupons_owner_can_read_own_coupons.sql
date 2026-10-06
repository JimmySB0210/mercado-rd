-- ═══════════════════════════════════════════════════════════
-- MercadoRD — coupons: el dueño puede leer sus propios cupones
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Ya aplicada en vivo por Jimmy, probada en SQL con la identidad del vendedor.
--
-- La única política SELECT de coupons era coupons_public_read (is_active = true).
-- Un UPDATE que pone is_active = false deja la fila sin política de lectura, y
-- la comprobación de RLS falla con 42501. Por eso desactivar un cupón desde el
-- dashboard nunca funcionó. Esta política deja que el vendedor (y el admin) lea
-- sus cupones aunque estén desactivados. Solo añade acceso de lectura: no cambia
-- INSERT, UPDATE ni DELETE.

CREATE POLICY coupons_vendor_read ON public.coupons
  FOR SELECT TO authenticated
  USING (
    vendor_id IN (SELECT vendors.id FROM public.vendors WHERE vendors.user_id = (SELECT auth.uid()))
    OR public.is_admin()
  );
