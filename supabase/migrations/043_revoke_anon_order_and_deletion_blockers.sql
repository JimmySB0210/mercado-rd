-- create_order_from_cart y check_account_deletion_blockers conservaban EXECUTE para PUBLIC y anon.
-- Ninguna tiene sentido sin sesión: sus únicos llamadores (checkout/page.tsx y
-- perfil/seguridad/page.tsx) requieren usuario autenticado, y authenticated conserva el permiso.
-- Aplicada en vivo por Jimmy.
REVOKE EXECUTE ON FUNCTION public.create_order_from_cart(text, integer, payment_method, text, jsonb, uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_account_deletion_blockers(uuid) FROM PUBLIC, anon;
