-- =========================================================
-- MercadoRD — Lote C-2
-- Privacidad de la dirección en pedidos de regalo, límite de intentos
-- fallidos en cupones, RPC para cambiar el avatar y cierre de
-- increment_product_views.
-- =========================================================

-- ---------------------------------------------------------
-- 1) Dirección de entrega de los pedidos de regalo
--    Quien compra un regalo no debe poder leer la dirección de quien
--    armó la lista. orders.delivery_address guarda un texto genérico y
--    la dirección real vive en gift_order_delivery, que solo leen el
--    vendedor del pedido y el admin.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gift_order_delivery (
  order_id         uuid        PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_address text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gift_order_delivery IS
  'Dirección real de entrega de los pedidos creados desde una lista de regalos. orders.delivery_address guarda un texto genérico para que el comprador no vea la dirección de quien armó la lista. Solo la leen el vendedor del pedido y el admin; solo se escribe desde create_gift_order.';

ALTER TABLE public.gift_order_delivery ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.gift_order_delivery FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.gift_order_delivery TO authenticated;

CREATE POLICY gift_order_delivery_vendor_admin_read
  ON public.gift_order_delivery
  FOR SELECT
  TO authenticated
  USING (public.is_vendor_order(order_id) OR public.is_admin());

-- Pedidos de regalo que ya existen: se mueve la dirección real a la tabla
-- nueva y orders queda con el texto genérico.
INSERT INTO public.gift_order_delivery (order_id, delivery_address)
SELECT o.id, o.delivery_address
FROM public.orders o
WHERE o.gift_list_item_id IS NOT NULL
  AND o.delivery_address <> 'Dirección protegida (lista de regalos)'
ON CONFLICT (order_id) DO NOTHING;

UPDATE public.orders
SET delivery_address = 'Dirección protegida (lista de regalos)'
WHERE gift_list_item_id IS NOT NULL
  AND delivery_address <> 'Dirección protegida (lista de regalos)';

-- create_gift_order: mismo flujo de siempre, pero el pedido se guarda con el
-- texto genérico y la dirección real va a gift_order_delivery. Además exige
-- producto publicado y activo (igual que create_order_from_cart) y bloquea la
-- fila del producto para que dos regalos simultáneos no dejen el stock negativo.
CREATE OR REPLACE FUNCTION public.create_gift_order(p_gift_list_item_id uuid, p_payment_method payment_method)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c_placeholder CONSTANT text := 'Dirección protegida (lista de regalos)';
  v_item record;
  v_list record;
  v_product record;
  v_order_id uuid;
  v_delivery int;
  v_itbis int;
  v_total int;
  v_buyer_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Necesitas iniciar sesión para comprar un regalo';
  END IF;

  SELECT * INTO v_item FROM gift_list_items WHERE id = p_gift_list_item_id FOR UPDATE;

  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este artículo ya no existe en la lista');
  END IF;

  IF v_item.purchased_by IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Alguien más ya compró este regalo');
  END IF;

  SELECT * INTO v_list FROM gift_lists
  WHERE id = v_item.gift_list_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
  IF v_list IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta lista ya no está disponible');
  END IF;

  IF v_list.user_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes comprarte un regalo a ti mismo desde tu propia lista');
  END IF;

  SELECT * INTO v_product FROM products
  WHERE id = v_item.product_id
    AND status = 'published'
    AND COALESCE(is_active, false)
  FOR UPDATE;
  IF v_product IS NULL OR v_product.stock < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este producto ya no está disponible');
  END IF;

  -- Misma regla que create_order_from_cart: nadie compra sus propios productos
  IF EXISTS (SELECT 1 FROM vendors v WHERE v.id = v_product.vendor_id AND v.user_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes comprar tus propios productos');
  END IF;

  SELECT price_rdp INTO v_delivery FROM shipping_rates WHERE province_id = v_list.province_id;
  IF v_delivery IS NULL THEN v_delivery := 25000; END IF;
  IF v_product.price_rdp >= 250000 THEN v_delivery := 0; END IF;
  v_itbis := ROUND(v_product.price_rdp * 0.18);
  v_total := v_product.price_rdp + v_itbis + v_delivery;

  INSERT INTO orders (
    user_id, status, delivery_type, delivery_address, province_id,
    subtotal_rdp, discount_rdp, delivery_rdp, total_rdp, payment_method,
    recipient_name, gift_list_item_id
  ) VALUES (
    auth.uid(), 'pending', 'standard', c_placeholder, v_list.province_id,
    v_product.price_rdp, 0, v_delivery, v_total, p_payment_method,
    v_list.display_name, p_gift_list_item_id
  ) RETURNING id INTO v_order_id;

  -- La dirección real solo la ven el vendedor del pedido y el admin
  INSERT INTO gift_order_delivery (order_id, delivery_address)
  VALUES (v_order_id, v_list.delivery_address);

  INSERT INTO order_items (order_id, product_id, vendor_id, quantity, price_rdp)
  VALUES (v_order_id, v_product.id, v_product.vendor_id, 1, v_product.price_rdp);

  UPDATE products SET stock = stock - 1, sold_count = sold_count + 1 WHERE id = v_product.id;

  UPDATE gift_list_items SET purchased_by = auth.uid(), purchased_at = NOW() WHERE id = p_gift_list_item_id;

  SELECT full_name INTO v_buyer_name FROM users WHERE id = auth.uid();
  PERFORM create_notification(
    v_list.user_id, 'gift_purchased',
    '🎁 ¡Alguien te compró un regalo!',
    COALESCE(v_buyer_name, 'Alguien') || ' te compró "' || v_product.name || '" de tu lista de regalos.',
    '/perfil/lista-regalos',
    jsonb_build_object('buyer_name', v_buyer_name, 'product_name', v_product.name)
  );

  PERFORM log_audit_event('gift_order_created', 'order', v_order_id);

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.create_gift_order(uuid, payment_method) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_gift_order(uuid, payment_method) TO authenticated, service_role;

-- ---------------------------------------------------------
-- 2) Cupones: límite de intentos fallidos y códigos de error
--    Antes se podían probar códigos sin límite. Ahora, 10 intentos
--    fallidos por usuario en 15 minutos y después responde rate_limited.
--    La respuesta trae error_code para que el front traduzca el mensaje.
--    Se guarda una sola fila por usuario (contador con ventana fija), así
--    la tabla no crece ni hace falta limpiarla.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupon_attempts (
  user_id           uuid        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  failed_count      integer     NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.coupon_attempts IS
  'Contador de intentos fallidos de validate_coupon por usuario (límite de 10 cada 15 minutos, ventana fija). Solo la usa validate_coupon; nadie más tiene acceso.';

ALTER TABLE public.coupon_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.coupon_attempts FROM PUBLIC, anon, authenticated;

CREATE POLICY coupon_attempts_no_access
  ON public.coupon_attempts
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_order_total_rdp integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c_max_failed CONSTANT int      := 10;
  c_window     CONSTANT interval := interval '15 minutes';
  v_uid      uuid := auth.uid();
  v_code     text := UPPER(TRIM(COALESCE(p_code, '')));
  v_coupon   record;
  v_found    boolean := false;
  v_discount numeric;
  v_err      text;
  v_msg      text;
BEGIN
  -- Límite de intentos fallidos por usuario. service_role no trae sesión
  -- (auth.uid() es NULL) y no se limita.
  IF v_uid IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM coupon_attempts
      WHERE user_id = v_uid
        AND window_started_at > now() - c_window
        AND failed_count >= c_max_failed
    ) THEN
      RETURN jsonb_build_object(
        'valid', false,
        'error_code', 'rate_limited',
        'error', 'Demasiados intentos con códigos inválidos. Espera unos minutos e inténtalo de nuevo.'
      );
    END IF;
  END IF;

  IF p_order_total_rdp IS NULL OR p_order_total_rdp < 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error_code', 'invalid_total',
      'error', 'El total del pedido no es válido'
    );
  END IF;

  IF v_code <> '' AND length(v_code) <= 50 THEN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE UPPER(code) = v_code
      AND is_active = true;
    v_found := FOUND;
  END IF;

  IF NOT v_found THEN
    v_err := 'not_found';
    v_msg := 'Cupón no encontrado o inactivo';
  ELSIF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    v_err := 'expired';
    v_msg := 'Este cupón ha expirado';
  ELSIF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
    v_err := 'limit_reached';
    v_msg := 'Este cupón ya alcanzó su límite de usos';
  ELSIF p_order_total_rdp < COALESCE(v_coupon.min_order_rdp, 0) THEN
    v_err := 'min_order';
    v_msg := 'El pedido debe ser de al menos RD$' || (v_coupon.min_order_rdp / 100) || ' para usar este cupón';
  END IF;

  IF v_err IS NOT NULL THEN
    -- Cuenta como intento fallido todo salvo "falta monto mínimo": ese caso
    -- depende del carrito y no de adivinar el código. No se cuenta tampoco el
    -- código vacío (un clic por error).
    IF v_uid IS NOT NULL AND v_err <> 'min_order' AND v_code <> '' THEN
      INSERT INTO coupon_attempts AS ca (user_id, window_started_at, failed_count)
      VALUES (v_uid, now(), 1)
      ON CONFLICT (user_id) DO UPDATE
        SET failed_count = CASE WHEN ca.window_started_at > now() - c_window
                                THEN ca.failed_count + 1 ELSE 1 END,
            window_started_at = CASE WHEN ca.window_started_at > now() - c_window
                                     THEN ca.window_started_at ELSE now() END;
    END IF;

    RETURN jsonb_build_object('valid', false, 'error_code', v_err, 'error', v_msg)
        || CASE WHEN v_err = 'min_order'
                THEN jsonb_build_object('min_order_rdp', v_coupon.min_order_rdp)
                ELSE '{}'::jsonb
           END;
  END IF;

  -- Mismo cálculo que create_order_from_cart (redondeo sobre numérico)
  IF v_coupon.type = 'percentage' THEN
    v_discount := ROUND(p_order_total_rdp::numeric * v_coupon.value / 100.0);
  ELSE
    v_discount := v_coupon.value;
  END IF;
  v_discount := GREATEST(0, LEAST(v_discount, p_order_total_rdp));

  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'type', v_coupon.type,
    'value', v_coupon.value,
    'discount_rdp', v_discount::int,
    'vendor_id', v_coupon.vendor_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.validate_coupon(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, integer) TO authenticated, service_role;

-- ---------------------------------------------------------
-- 3) Cambiar el avatar
--    users ya no acepta UPDATE directo desde el cliente (Lote C-1), así que
--    el avatar se cambia con esta función. Solo acepta una URL del bucket
--    avatars dentro de la carpeta del propio usuario (o NULL para quitarlo).
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_own_avatar(p_avatar_url text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '28000';
  END IF;

  IF p_avatar_url IS NOT NULL THEN
    IF length(p_avatar_url) > 500
       OR p_avatar_url !~ (
            '^https://ifjzittwvoggstjlmaph\.supabase\.co/storage/v1/object/public/avatars/'
            || v_uid::text
            || '/[A-Za-z0-9][A-Za-z0-9._-]*(\?v=[0-9]+)?$'
          ) THEN
      RAISE EXCEPTION 'La URL del avatar no es válida' USING ERRCODE = '22023';
    END IF;
  END IF;

  UPDATE public.users SET avatar_url = p_avatar_url WHERE id = v_uid;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_own_avatar(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_avatar(text) TO authenticated, service_role;

-- ---------------------------------------------------------
-- 4) increment_product_views quedó sin uso (las vistas se cuentan con
--    record_product_view). Se cierra para que nadie la llame desde el cliente.
-- ---------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.increment_product_views(uuid) FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';
