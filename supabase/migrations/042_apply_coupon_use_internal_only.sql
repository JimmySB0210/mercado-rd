-- apply_coupon_use incrementa uses_count sin comprobar que quien la llama haya hecho un pedido con ese
-- cupón: cualquier usuario con sesión podía llamarla a mano para agotar los usos de cualquier cupón.
-- Solo la necesita create_order_from_cart, que corre como SECURITY DEFINER del mismo dueño (postgres)
-- y la llama por dentro. El checkout dejó de llamarla desde el navegador (commit 2929cba, verificado
-- en el JS desplegado en producción).
REVOKE EXECUTE ON FUNCTION public.apply_coupon_use(uuid) FROM authenticated;
