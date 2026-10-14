-- ============================================================
-- MercadoRD — Lote C (aditivo / bajo riesgo: el front desplegado hoy sigue funcionando)
--
-- 1) Listas de regalos: la direccion de entrega y el user_id eran legibles por
--    cualquiera (la politica de lectura publica aplicaba a todos los roles y todas
--    las columnas eran visibles). Ahora:
--      - las listas ajenas solo se leen con el rol anon (la pagina publica
--        /regalo/[slug] usa createPublicClient() = anon, sin sesion),
--      - anon solo ve columnas publicas (nunca delivery_address ni user_id),
--      - una persona con sesion solo ve su propia lista (gift_lists_owner_manage),
--      - anon pierde los privilegios de escritura sobre las tablas de regalos,
--      - una persona no puede tener mas de una lista (el front asume una sola).
--    create_gift_order (SECURITY DEFINER) sigue leyendo la direccion sin problema.
--    Si algun dia se agrega una columna publica a gift_lists, hay que concederla
--    a anon de forma explicita (GRANT SELECT (columna) ...).
-- 2) create_gift_order: un vendedor no puede comprar sus propios productos (misma
--    regla que create_order_from_cart) y una lista vencida ya no acepta regalos
--    (la pagina ya la mostraba como no disponible, pero la funcion no lo exigia).
-- 3) quote_cart: cotizacion de solo lectura con la MISMA regla de precios que
--    create_order_from_cart (tramo por cantidad > precio de variante > precio base,
--    envio por provincia, gratis desde RD$2,500, ITBIS 18 %), para que carrito y
--    checkout muestren lo que la base va a cobrar. SECURITY INVOKER: solo ve lo
--    que ya es publico.
-- 4) public.users: nadie por la API (anon / authenticated) necesita INSERT / UPDATE /
--    DELETE directo (todo pasa por funciones SECURITY DEFINER). Se revocan para que
--    una politica de UPDATE agregada por error en el futuro no habilite is_admin.
--
-- Idempotente: se puede ejecutar mas de una vez.
-- ============================================================

-- ------------------------------------------------------------
-- 1) gift_lists / gift_list_items
-- ------------------------------------------------------------
ALTER POLICY gift_lists_public_read ON public.gift_lists TO anon;

REVOKE ALL ON TABLE public.gift_lists FROM anon;
GRANT SELECT (id, display_name, share_slug, province_id, is_active, expires_at, created_at)
  ON TABLE public.gift_lists TO anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.gift_list_items FROM anon;

COMMENT ON POLICY gift_lists_public_read ON public.gift_lists IS
  'Solo rol anon (pagina publica /regalo/[slug]). Las columnas visibles las limita el GRANT de columnas: delivery_address y user_id no son legibles por anon.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.gift_lists'::regclass AND conname = 'gift_lists_user_id_key'
  ) THEN
    ALTER TABLE public.gift_lists ADD CONSTRAINT gift_lists_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2) create_gift_order
--    - un vendedor no puede comprar sus propios productos
--    - la lista no debe estar vencida
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_gift_order(p_gift_list_item_id uuid, p_payment_method payment_method)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
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

  SELECT * INTO v_product FROM products WHERE id = v_item.product_id AND status = 'published';
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
    auth.uid(), 'pending', 'standard', v_list.delivery_address, v_list.province_id,
    v_product.price_rdp, 0, v_delivery, v_total, p_payment_method,
    v_list.display_name, p_gift_list_item_id
  ) RETURNING id INTO v_order_id;

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

-- ------------------------------------------------------------
-- 3) quote_cart — cotizacion de solo lectura (misma regla de precios que
--    create_order_from_cart). SECURITY INVOKER: solo ve datos publicos.
--
--    p_items: [{"product_id": uuid, "variant_id": uuid|null, "quantity": int}, ...]
--    p_province_id: opcional (1..32). Sin provincia, delivery_rdp es null.
--
--    status por linea: ok | invalid_item | invalid_quantity |
--                      product_unavailable | variant_unavailable
--    Los totales suman solo las lineas con status ok; all_available indica si
--    todas lo estan. total_rdp = subtotal + ITBIS + envio (sin cupon).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.quote_cart(p_items jsonb, p_province_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  c_free_shipping_threshold CONSTANT int := 250000;
  c_default_shipping CONSTANT int := 25000;
  c_uuid_re CONSTANT text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  v_item jsonb;
  v_idx int := 0;
  v_lines jsonb := '[]'::jsonb;
  v_pid_txt text;
  v_vid_txt text;
  v_qty_txt text;
  v_pid uuid;
  v_vid uuid;
  v_qty int;
  v_status text;
  v_base int;
  v_is_active boolean;
  v_pstock int;
  v_vprice int;
  v_vstock int;
  v_tier int;
  v_unit int;
  v_src text;
  v_avail int;
  v_line_total bigint;
  v_subtotal bigint := 0;
  v_ok_lines int := 0;
  v_all_ok boolean := true;
  v_delivery int;
  v_itbis bigint;
  v_total bigint;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'p_items debe ser un arreglo' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'No se pueden cotizar más de 50 items' USING ERRCODE = '22023';
  END IF;
  IF p_province_id IS NOT NULL AND (p_province_id < 1 OR p_province_id > 32) THEN
    RAISE EXCEPTION 'Provincia inválida' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_status := 'ok';
    v_pid := NULL; v_vid := NULL; v_qty := NULL;
    v_base := NULL; v_is_active := NULL; v_pstock := NULL;
    v_vprice := NULL; v_vstock := NULL; v_tier := NULL;
    v_unit := NULL; v_src := NULL; v_avail := NULL; v_line_total := NULL;

    IF jsonb_typeof(v_item) <> 'object' THEN
      v_status := 'invalid_item';
    ELSE
      v_pid_txt := v_item->>'product_id';
      v_vid_txt := NULLIF(v_item->>'variant_id', '');
      v_qty_txt := v_item->>'quantity';

      IF v_pid_txt IS NULL OR v_pid_txt !~ c_uuid_re
         OR (v_vid_txt IS NOT NULL AND v_vid_txt !~ c_uuid_re) THEN
        v_status := 'invalid_item';
      ELSE
        v_pid := v_pid_txt::uuid;
        v_vid := v_vid_txt::uuid;
        IF v_qty_txt IS NULL OR v_qty_txt !~ '^[0-9]{1,4}$' THEN
          v_status := 'invalid_quantity';
        ELSE
          v_qty := v_qty_txt::int;
          IF v_qty <= 0 THEN
            v_status := 'invalid_quantity';
          END IF;
        END IF;
      END IF;
    END IF;

    IF v_status = 'ok' THEN
      SELECT p.price_rdp, p.is_active, p.stock
        INTO v_base, v_is_active, v_pstock
      FROM products p WHERE p.id = v_pid;

      IF NOT FOUND OR v_base IS NULL OR NOT COALESCE(v_is_active, false) THEN
        v_status := 'product_unavailable';
      ELSIF v_vid IS NOT NULL THEN
        SELECT pv.price_rdp, pv.stock
          INTO v_vprice, v_vstock
        FROM product_variants pv
        WHERE pv.id = v_vid AND pv.product_id = v_pid AND pv.is_active;
        IF NOT FOUND THEN
          v_status := 'variant_unavailable';
        END IF;
      END IF;
    END IF;

    IF v_status = 'ok' THEN
      SELECT t.price_rdp INTO v_tier
      FROM product_pricing_tiers t
      WHERE t.product_id = v_pid
        AND t.min_quantity <= v_qty
        AND (t.max_quantity IS NULL OR t.max_quantity >= v_qty)
      ORDER BY t.min_quantity DESC
      LIMIT 1;

      IF v_tier IS NOT NULL THEN
        v_unit := v_tier;  v_src := 'tier';
      ELSIF v_vprice IS NOT NULL THEN
        v_unit := v_vprice; v_src := 'variant';
      ELSE
        v_unit := v_base;  v_src := 'base';
      END IF;

      v_avail := CASE WHEN v_vid IS NOT NULL THEN LEAST(v_pstock, v_vstock) ELSE v_pstock END;
      v_line_total := v_unit::bigint * v_qty;
      v_subtotal := v_subtotal + v_line_total;
      v_ok_lines := v_ok_lines + 1;
    ELSE
      v_all_ok := false;
    END IF;

    v_lines := v_lines || jsonb_build_object(
      'index', v_idx,
      'product_id', v_pid,
      'variant_id', v_vid,
      'quantity', v_qty,
      'status', v_status,
      'unit_price_rdp', v_unit,
      'line_total_rdp', v_line_total,
      'price_source', v_src,
      'available_quantity', v_avail
    );
    v_idx := v_idx + 1;
  END LOOP;

  IF p_province_id IS NOT NULL AND v_ok_lines > 0 THEN
    SELECT sr.price_rdp INTO v_delivery FROM shipping_rates sr WHERE sr.province_id = p_province_id;
    IF v_delivery IS NULL THEN v_delivery := c_default_shipping; END IF;
    IF v_subtotal >= c_free_shipping_threshold THEN v_delivery := 0; END IF;
  ELSE
    v_delivery := NULL;
  END IF;

  v_itbis := ROUND(v_subtotal * 0.18);
  v_total := v_subtotal + v_itbis + COALESCE(v_delivery, 0);

  RETURN jsonb_build_object(
    'lines', v_lines,
    'all_available', v_all_ok,
    'subtotal_rdp', v_subtotal,
    'itbis_rdp', v_itbis,
    'delivery_rdp', v_delivery,
    'qualifies_free_shipping', (v_ok_lines > 0 AND v_subtotal >= c_free_shipping_threshold),
    'free_shipping_threshold_rdp', c_free_shipping_threshold,
    'total_rdp', v_total
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.quote_cart(jsonb, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.quote_cart(jsonb, integer) TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 4) public.users: sin escritura directa por la API
-- ------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.users FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';
