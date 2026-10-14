-- ============================================================
-- MercadoRD — Lote A de endurecimiento (13 oct 2026)
--   1) Cotizaciones de chat: el producto debe ser de la tienda de la conversación y estar publicado
--   2) products: contadores y destacado solo los escribe el servidor
--   3) reviews: el autor solo edita rating y comentario
--   4) OTP de entrega: código nulo, intentos reiniciables, regenerar sobre pedido entregado/cancelado
--   5) create_order_from_cart: producto publicado, variante del producto, precio de la variante
-- ============================================================

-- ------------------------------------------------------------
-- 1) Cotizaciones de chat
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_chat_quote(p_conversation_id uuid, p_product_id uuid, p_quantity integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_quote_id uuid;
  v_conv_vendor_id uuid;
  v_product_vendor_id uuid;
  v_product_active boolean;
  v_vendor_user_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
  END IF;

  SELECT vendor_id INTO v_conv_vendor_id
  FROM conversations
  WHERE id = p_conversation_id AND buyer_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solo el comprador puede solicitar una cotización';
  END IF;

  SELECT vendor_id, is_active INTO v_product_vendor_id, v_product_active
  FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este producto no existe';
  END IF;

  -- El producto tiene que ser de la tienda con la que se conversa
  IF v_product_vendor_id IS DISTINCT FROM v_conv_vendor_id THEN
    RAISE EXCEPTION 'Este producto no pertenece a la tienda de esta conversación';
  END IF;

  IF NOT COALESCE(v_product_active, false) THEN
    RAISE EXCEPTION 'Este producto no está disponible';
  END IF;

  IF EXISTS (SELECT 1 FROM vendors WHERE id = v_product_vendor_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'No puedes comprar tus propios productos' USING ERRCODE = 'P0101';
  END IF;

  INSERT INTO chat_quotes (conversation_id, product_id, requested_by, quantity)
  VALUES (p_conversation_id, p_product_id, auth.uid(), p_quantity)
  RETURNING id INTO v_quote_id;

  INSERT INTO chat_messages (conversation_id, sender_id, message, chat_quote_id)
  VALUES (p_conversation_id, auth.uid(), '', v_quote_id);

  SELECT v.user_id INTO v_vendor_user_id
  FROM conversations c JOIN vendors v ON v.id = c.vendor_id
  WHERE c.id = p_conversation_id;

  UPDATE conversations
  SET last_message = '💰 Solicitud de cotización', last_message_at = NOW(), vendor_unread = vendor_unread + 1
  WHERE id = p_conversation_id;

  PERFORM create_notification(
    v_vendor_user_id, 'quote_requested',
    'Nueva solicitud de cotización 💰',
    'Te pidieron cotizar ' || p_quantity || ' unidades',
    '/mensajes',
    jsonb_build_object('quantity', p_quantity)
  );

  RETURN v_quote_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.respond_chat_quote(p_quote_id uuid, p_unit_price_rdp integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vendor_ok boolean;
  v_product_ok boolean;
  v_rows integer;
  v_conversation_id uuid;
  v_buyer_id uuid;
  v_vendor_business_name text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  IF p_unit_price_rdp IS NULL OR p_unit_price_rdp <= 0 THEN
    RAISE EXCEPTION 'El precio debe ser mayor a cero';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM chat_quotes cq JOIN conversations c ON c.id = cq.conversation_id
    JOIN vendors v ON v.id = c.vendor_id
    WHERE cq.id = p_quote_id AND v.user_id = auth.uid()
  ) INTO v_vendor_ok;
  IF NOT v_vendor_ok THEN RAISE EXCEPTION 'No autorizado'; END IF;

  -- La cotización tiene que ser de un producto de esta misma tienda
  SELECT EXISTS(
    SELECT 1 FROM chat_quotes cq
    JOIN conversations c ON c.id = cq.conversation_id
    JOIN products p ON p.id = cq.product_id
    WHERE cq.id = p_quote_id AND p.vendor_id = c.vendor_id
  ) INTO v_product_ok;
  IF NOT v_product_ok THEN
    RAISE EXCEPTION 'Esta cotización no corresponde a un producto de tu tienda';
  END IF;

  UPDATE chat_quotes
  SET quoted_unit_price_rdp = p_unit_price_rdp, quoted_by = auth.uid(), status = 'quoted', updated_at = NOW()
  WHERE id = p_quote_id AND status IN ('requested', 'quoted');
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'Esta cotización ya no se puede modificar';
  END IF;

  SELECT cq.conversation_id, cq.requested_by, v.business_name
  INTO v_conversation_id, v_buyer_id, v_vendor_business_name
  FROM chat_quotes cq
  JOIN conversations c ON c.id = cq.conversation_id
  JOIN vendors v ON v.id = c.vendor_id
  WHERE cq.id = p_quote_id;

  UPDATE conversations
  SET last_message = '💰 Cotización actualizada', last_message_at = NOW(), buyer_unread = buyer_unread + 1
  WHERE id = v_conversation_id;

  PERFORM create_notification(
    v_buyer_id, 'quote_responded',
    COALESCE(v_vendor_business_name, 'El vendedor') || ' te envió un precio 💰',
    'Nuevo precio: RD$' || (p_unit_price_rdp / 100) || ' por unidad',
    '/mensajes',
    jsonb_build_object('vendor_business_name', v_vendor_business_name, 'price_rdp', p_unit_price_rdp / 100)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_chat_quote(p_quote_id uuid, p_delivery_address text, p_province_id integer, p_payment_method payment_method)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_quote record;
  v_product record;
  v_conv_vendor_id uuid;
  v_conv_buyer_id uuid;
  v_order_id uuid;
  v_subtotal int;
  v_delivery int;
  v_itbis int;
  v_total int;
  v_vendor_user_id uuid;
  v_snapshot jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT * INTO v_quote FROM chat_quotes WHERE id = p_quote_id AND requested_by = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cotización no encontrada');
  END IF;
  IF v_quote.status <> 'quoted' OR v_quote.quoted_unit_price_rdp IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta cotización todavía no tiene un precio para aceptar');
  END IF;

  -- Misma validación que el carrito para dirección y provincia
  IF p_delivery_address IS NULL OR LENGTH(TRIM(p_delivery_address)) < 10 OR LENGTH(TRIM(p_delivery_address)) > 200 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La dirección de entrega debe tener entre 10 y 200 caracteres');
  END IF;
  IF p_province_id IS NULL OR p_province_id < 1 OR p_province_id > 32 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Provincia inválida');
  END IF;

  SELECT * INTO v_product FROM products WHERE id = v_quote.product_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este producto ya no existe');
  END IF;

  -- La cotización solo vale para un producto de la tienda de la conversación
  SELECT c.vendor_id, c.buyer_id INTO v_conv_vendor_id, v_conv_buyer_id
  FROM conversations c WHERE c.id = v_quote.conversation_id;
  IF NOT FOUND
     OR v_conv_buyer_id IS DISTINCT FROM auth.uid()
     OR v_product.vendor_id IS DISTINCT FROM v_conv_vendor_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta cotización no corresponde a la tienda de la conversación');
  END IF;

  IF NOT COALESCE(v_product.is_active, false) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este producto no está disponible');
  END IF;

  IF EXISTS (SELECT 1 FROM vendors WHERE id = v_product.vendor_id AND user_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes comprar tus propios productos');
  END IF;

  IF v_product.stock < v_quote.quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Stock insuficiente: solo quedan ' || v_product.stock || ' unidades disponibles');
  END IF;

  v_subtotal := v_quote.quoted_unit_price_rdp * v_quote.quantity;
  SELECT price_rdp INTO v_delivery FROM shipping_rates WHERE province_id = p_province_id;
  IF v_delivery IS NULL THEN v_delivery := 25000; END IF;
  IF v_subtotal >= 250000 THEN v_delivery := 0; END IF;
  v_itbis := ROUND(v_subtotal * 0.18);
  v_total := v_subtotal + v_itbis + v_delivery;

  INSERT INTO orders (
    user_id, status, delivery_type, delivery_address, province_id,
    subtotal_rdp, discount_rdp, delivery_rdp, total_rdp, payment_method
  ) VALUES (
    auth.uid(), 'pending', 'standard', p_delivery_address, p_province_id,
    v_subtotal, 0, v_delivery, v_total, p_payment_method
  ) RETURNING id INTO v_order_id;

  SELECT jsonb_build_object(
    'name', p.name, 'description', p.description, 'price_rdp', v_quote.quoted_unit_price_rdp,
    'images', p.images, 'category', c.name, 'vendor_business_name', v.business_name,
    'negotiated_via_chat', true,
    'attributes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'label', ca.attribute_label,
        'value', CASE
          WHEN ca.attribute_type = 'boolean' THEN (CASE WHEN pav.value_boolean THEN 'Sí' ELSE 'No' END)
          WHEN ca.attribute_type IN ('select', 'multiselect') THEN COALESCE(ao.label, pav.value_text)
          WHEN pav.value_number IS NOT NULL THEN pav.value_number::text || COALESCE(' ' || ca.unit, '')
          ELSE pav.value_text
        END
      ))
      FROM product_attribute_values pav
      JOIN category_attributes ca ON ca.id = pav.category_attribute_id
      LEFT JOIN attribute_options ao ON ao.category_attribute_id = pav.category_attribute_id AND ao.value = pav.value_text
      WHERE pav.product_id = p.id
    ), '[]'::jsonb),
    'snapshot_at', NOW()
  )
  INTO v_snapshot
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN vendors v ON v.id = p.vendor_id
  WHERE p.id = v_quote.product_id;

  INSERT INTO order_items (order_id, product_id, vendor_id, quantity, price_rdp, product_snapshot)
  VALUES (v_order_id, v_product.id, v_product.vendor_id, v_quote.quantity, v_quote.quoted_unit_price_rdp, v_snapshot);

  UPDATE products SET stock = stock - v_quote.quantity, sold_count = sold_count + v_quote.quantity WHERE id = v_product.id;

  UPDATE chat_quotes SET status = 'accepted', order_id = v_order_id, updated_at = NOW() WHERE id = p_quote_id;

  UPDATE conversations SET last_message = '💰 Cotización aceptada — pedido creado', last_message_at = NOW()
  WHERE id = v_quote.conversation_id;

  SELECT v.user_id INTO v_vendor_user_id
  FROM conversations c JOIN vendors v ON v.id = c.vendor_id
  WHERE c.id = v_quote.conversation_id;

  PERFORM create_notification(
    v_vendor_user_id, 'quote_accepted',
    '¡Cotización aceptada! 🎉',
    'El comprador aceptó tu precio y generó un pedido',
    '/dashboard/pedidos',
    '{}'::jsonb
  );

  PERFORM log_audit_event('chat_quote_accepted', 'order', v_order_id);

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$function$;

-- ------------------------------------------------------------
-- 2) products: los contadores y el destacado no se escriben desde el navegador
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_product_privileged_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- Solo frena las escrituras directas del navegador (PostgREST corre como
  -- anon/authenticated). Las funciones SECURITY DEFINER, los triggers, el
  -- service_role y las migraciones corren con otro rol y pasan sin cambios.
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.rating_avg := 0;
    NEW.rating_count := 0;
    NEW.sold_count := 0;
    NEW.view_count := 0;
    NEW.is_featured := false;
  ELSE
    NEW.rating_avg := OLD.rating_avg;
    NEW.rating_count := OLD.rating_count;
    NEW.sold_count := OLD.sold_count;
    NEW.view_count := OLD.view_count;
    NEW.is_featured := OLD.is_featured;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_product_privileged_columns() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER zz_guard_product_privileged_columns
  BEFORE INSERT OR UPDATE OF rating_avg, rating_count, sold_count, view_count, is_featured
  ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_privileged_columns();

-- ------------------------------------------------------------
-- 3) reviews: el autor solo puede editar rating y comentario
-- ------------------------------------------------------------
REVOKE UPDATE ON public.reviews FROM anon, authenticated;
GRANT UPDATE (rating, comment) ON public.reviews TO authenticated;

-- ------------------------------------------------------------
-- 4) OTP de entrega
-- ------------------------------------------------------------
ALTER TABLE public.delivery_otps ADD COLUMN IF NOT EXISTS generated_at timestamptz;
ALTER TABLE public.delivery_otps ADD COLUMN IF NOT EXISTS generation_count integer;
UPDATE public.delivery_otps SET generated_at = created_at WHERE generated_at IS NULL;
UPDATE public.delivery_otps SET generation_count = 1 WHERE generation_count IS NULL;
ALTER TABLE public.delivery_otps
  ALTER COLUMN generated_at SET DEFAULT now(),
  ALTER COLUMN generated_at SET NOT NULL,
  ALTER COLUMN generation_count SET DEFAULT 1,
  ALTER COLUMN generation_count SET NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_delivery_otp(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_otp text;
  v_notify_user_id uuid;
  v_recipient_name text;
  v_message text;
  v_gift_creator uuid;
  v_scenario text;
  v_order_status text;
  v_existing delivery_otps%ROWTYPE;
  v_is_admin boolean := public.is_admin();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM order_items oi JOIN vendors v ON v.id = oi.vendor_id
    WHERE oi.order_id = p_order_id AND v.user_id = auth.uid()
  ) AND NOT v_is_admin THEN
    RAISE EXCEPTION 'No autorizado para generar un código de entrega para esta orden';
  END IF;

  -- Una sola generación a la vez por pedido
  PERFORM pg_advisory_xact_lock(hashtextextended('delivery_otp:' || p_order_id::text, 0));

  SELECT status::text INTO v_order_status FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;
  IF v_order_status IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Este pedido ya está %: no se genera un código de entrega',
      CASE v_order_status WHEN 'delivered' THEN 'entregado' ELSE 'cancelado' END;
  END IF;

  SELECT * INTO v_existing FROM delivery_otps WHERE order_id = p_order_id FOR UPDATE;
  IF FOUND THEN
    IF v_existing.verified_at IS NOT NULL THEN
      RAISE EXCEPTION 'La entrega de este pedido ya fue confirmada';
    END IF;
    IF NOT v_is_admin THEN
      -- Ya se generó un código hace poco: sigue vigente, no se envía otro
      IF v_existing.generated_at > NOW() - INTERVAL '10 minutes' THEN
        RETURN;
      END IF;
      IF v_existing.generation_count >= 5 THEN
        RAISE EXCEPTION 'Se alcanzó el máximo de códigos de entrega para este pedido. Contacta a soporte.';
      END IF;
    END IF;
  END IF;

  v_otp := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');

  SELECT o.user_id, o.recipient_name, gl.user_id
  INTO v_notify_user_id, v_recipient_name, v_gift_creator
  FROM orders o
  LEFT JOIN gift_list_items gli ON gli.id = o.gift_list_item_id
  LEFT JOIN gift_lists gl ON gl.id = gli.gift_list_id
  WHERE o.id = p_order_id;

  IF v_gift_creator IS NOT NULL THEN
    v_notify_user_id := v_gift_creator;
  END IF;

  INSERT INTO public.delivery_otps (order_id, otp_hash, expires_at, generated_at, generation_count)
  VALUES (p_order_id, encode(extensions.digest(v_otp || p_order_id::text, 'sha256'), 'hex'), NOW() + INTERVAL '30 days', NOW(), 1)
  ON CONFLICT (order_id) DO UPDATE
  SET otp_hash = EXCLUDED.otp_hash,
      expires_at = EXCLUDED.expires_at,
      attempts = 0,
      generated_at = NOW(),
      generation_count = public.delivery_otps.generation_count + 1;

  v_message := 'Tu código para confirmar la entrega es: ' || v_otp || '. Compártelo con el repartidor SOLO cuando tengas el producto en tus manos.';
  IF v_gift_creator IS NOT NULL THEN
    v_message := '¡Tienes un regalo en camino! ' || v_message;
    v_scenario := 'gift';
  ELSIF v_recipient_name IS NOT NULL THEN
    v_message := v_message || ' Recuerda compartir este código con ' || v_recipient_name || ', quien recibirá el pedido.';
    v_scenario := 'recipient';
  ELSE
    v_scenario := 'normal';
  END IF;

  PERFORM create_notification(
    v_notify_user_id, 'delivery_otp',
    CASE WHEN v_gift_creator IS NOT NULL THEN '🎁 ¡Tienes un regalo en camino!' ELSE '🔐 Tu código de entrega' END,
    v_message, '/perfil/pedidos',
    jsonb_build_object('otp_code', v_otp, 'scenario', v_scenario, 'recipient_name', v_recipient_name)
  );

  PERFORM log_audit_event('otp_generated', 'order', p_order_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_delivery_otp(p_order_id uuid, p_otp_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_record delivery_otps%ROWTYPE;
  v_computed_hash text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM order_items oi JOIN vendors v ON v.id = oi.vendor_id
    WHERE oi.order_id = p_order_id AND v.user_id = auth.uid()
  ) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'No autorizado para confirmar esta entrega';
  END IF;

  -- Un código vacío o mal formado nunca confirma una entrega (ni cuenta como intento)
  IF p_otp_code IS NULL OR p_otp_code !~ '^[0-9]{6}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ingresa el código de 6 dígitos');
  END IF;

  SELECT * INTO v_record FROM delivery_otps WHERE order_id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No hay código de entrega generado para esta orden');
  END IF;

  IF v_record.verified_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta entrega ya fue confirmada anteriormente');
  END IF;

  IF v_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'El código de entrega expiró');
  END IF;

  IF v_record.attempts >= v_record.max_attempts THEN
    RETURN jsonb_build_object('success', false, 'error', 'Se agotaron los intentos. Contacta a soporte.');
  END IF;

  v_computed_hash := encode(extensions.digest(p_otp_code || p_order_id::text, 'sha256'), 'hex');

  IF v_computed_hash IS DISTINCT FROM v_record.otp_hash THEN
    UPDATE delivery_otps SET attempts = attempts + 1 WHERE order_id = p_order_id;
    PERFORM log_audit_event('otp_verification_failed', 'order', p_order_id, jsonb_build_object('attempts', v_record.attempts + 1));
    RETURN jsonb_build_object('success', false, 'error', 'Código incorrecto', 'attempts_remaining', v_record.max_attempts - v_record.attempts - 1);
  END IF;

  UPDATE delivery_otps SET verified_at = NOW(), verified_by = auth.uid() WHERE order_id = p_order_id;
  UPDATE orders SET status = 'delivered' WHERE id = p_order_id;

  PERFORM log_audit_event('delivery_confirmed', 'order', p_order_id);

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- ------------------------------------------------------------
-- 5) create_order_from_cart
--    - solo productos publicados
--    - la variante debe existir, estar activa y ser del producto
--    - precio: tramo por cantidad > precio de la variante > precio del producto
--    - control de consistencia entre el subtotal calculado y lo insertado
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_from_cart(p_delivery_address text, p_province_id integer, p_payment_method payment_method, p_notes text, p_items jsonb, p_coupon_id uuid DEFAULT NULL::uuid, p_recipient_name text DEFAULT NULL::text, p_recipient_phone text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_subtotal int := 0;
  v_check_subtotal int := 0;
  v_delivery int;
  v_total int;
  v_itbis int;
  v_item jsonb;
  v_snapshot jsonb;
  v_current_stock int;
  v_variant_stock int;
  v_variant_price int;
  v_quantity int;
  v_short_id text;
  v_vendor_user_id uuid;
  v_real_price int;
  v_base_price int;
  v_tier_price int;
  v_real_vendor_id uuid;
  v_is_active boolean;
  v_coupon record;
  v_discount_rdp int := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF p_delivery_address IS NULL OR LENGTH(TRIM(p_delivery_address)) < 10 OR LENGTH(TRIM(p_delivery_address)) > 200 THEN
    RAISE EXCEPTION 'La dirección de entrega debe tener entre 10 y 200 caracteres';
  END IF;

  IF p_notes IS NOT NULL AND LENGTH(p_notes) > 500 THEN
    RAISE EXCEPTION 'Las notas no pueden superar 500 caracteres';
  END IF;

  IF p_province_id IS NULL OR p_province_id < 1 OR p_province_id > 32 THEN
    RAISE EXCEPTION 'Provincia inválida';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El carrito está vacío';
  END IF;

  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'No se pueden procesar más de 50 items en una sola orden';
  END IF;

  IF p_recipient_name IS NOT NULL AND LENGTH(TRIM(p_recipient_name)) < 3 THEN
    RAISE EXCEPTION 'El nombre del destinatario debe tener al menos 3 caracteres';
  END IF;

  v_subtotal := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::int;
    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'La cantidad de cada producto debe ser mayor a cero';
    END IF;

    SELECT price_rdp, vendor_id, is_active INTO v_base_price, v_real_vendor_id, v_is_active
    FROM products WHERE id = (v_item->>'product_id')::uuid;
    IF v_base_price IS NULL THEN
      RAISE EXCEPTION 'Uno de los productos de tu pedido ya no existe';
    END IF;

    -- Solo se compran productos publicados (no borradores ni pausados)
    IF NOT COALESCE(v_is_active, false) THEN
      RAISE EXCEPTION 'Uno de los productos de tu pedido ya no está disponible' USING ERRCODE = 'P0102';
    END IF;

    IF EXISTS (SELECT 1 FROM vendors WHERE id = v_real_vendor_id AND user_id = auth.uid()) THEN
      RAISE EXCEPTION 'No puedes comprar tus propios productos' USING ERRCODE = 'P0101';
    END IF;

    -- La variante tiene que existir, estar activa y ser de ESTE producto
    v_variant_price := NULL;
    IF (v_item->>'variant_id') IS NOT NULL THEN
      SELECT pv.price_rdp INTO v_variant_price
      FROM product_variants pv
      WHERE pv.id = (v_item->>'variant_id')::uuid
        AND pv.product_id = (v_item->>'product_id')::uuid
        AND pv.is_active;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Una de las variantes de tu pedido ya no existe o no corresponde al producto' USING ERRCODE = 'P0103';
      END IF;
    END IF;

    SELECT price_rdp INTO v_tier_price FROM product_pricing_tiers
      WHERE product_id = (v_item->>'product_id')::uuid
        AND min_quantity <= v_quantity
        AND (max_quantity IS NULL OR max_quantity >= v_quantity)
      ORDER BY min_quantity DESC LIMIT 1;

    v_real_price := COALESCE(v_tier_price, v_variant_price, v_base_price);
    v_subtotal := v_subtotal + (v_real_price * v_quantity);
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id FOR UPDATE;

    IF v_coupon IS NULL THEN
      RAISE EXCEPTION 'Cupón inválido';
    END IF;
    IF NOT v_coupon.is_active THEN
      RAISE EXCEPTION 'Este cupón ya no está activo';
    END IF;
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
      RAISE EXCEPTION 'Este cupón venció';
    END IF;
    IF v_coupon.max_uses IS NOT NULL AND v_coupon.uses_count >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'Este cupón alcanzó su límite de usos';
    END IF;
    IF v_coupon.min_order_rdp IS NOT NULL AND v_subtotal < v_coupon.min_order_rdp THEN
      RAISE EXCEPTION 'Tu pedido no alcanza el mínimo requerido para este cupón';
    END IF;

    IF v_coupon.vendor_id IS NOT NULL THEN
      IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_items) i
        JOIN products p ON p.id = (i->>'product_id')::uuid
        WHERE p.vendor_id != v_coupon.vendor_id
      ) THEN
        RAISE EXCEPTION 'Este cupón no aplica a todos los productos de tu pedido';
      END IF;
    END IF;

    v_discount_rdp := CASE
      WHEN v_coupon.type = 'percentage' THEN ROUND(v_subtotal * v_coupon.value / 100.0)
      ELSE v_coupon.value
    END;
    v_discount_rdp := LEAST(v_discount_rdp, v_subtotal);
  END IF;

  SELECT price_rdp INTO v_delivery FROM shipping_rates WHERE province_id = p_province_id;
  IF v_delivery IS NULL THEN v_delivery := 25000; END IF;
  IF v_subtotal >= 250000 THEN v_delivery := 0; END IF;

  v_itbis := ROUND(v_subtotal * 0.18);
  v_total := v_subtotal + v_itbis + v_delivery - v_discount_rdp;

  INSERT INTO public.orders (
    user_id, status, delivery_type, delivery_address, province_id,
    subtotal_rdp, discount_rdp, delivery_rdp, total_rdp, payment_method, notes,
    recipient_name, recipient_phone
  ) VALUES (
    auth.uid(), 'pending', 'standard', p_delivery_address, p_province_id,
    v_subtotal, v_discount_rdp, v_delivery, v_total, p_payment_method, p_notes,
    NULLIF(TRIM(p_recipient_name), ''), NULLIF(TRIM(p_recipient_phone), '')
  )
  RETURNING id INTO v_order_id;

  v_short_id := '#RD-' || UPPER(LEFT(v_order_id::text, 8));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::int;

    SELECT stock, price_rdp, vendor_id INTO v_current_stock, v_base_price, v_real_vendor_id
    FROM public.products WHERE id = (v_item->>'product_id')::uuid
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Uno de los productos de tu pedido ya no existe';
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Stock insuficiente: solo quedan % unidades disponibles de este producto', v_current_stock;
    END IF;

    v_variant_price := NULL;
    IF (v_item->>'variant_id') IS NOT NULL THEN
      SELECT stock, price_rdp INTO v_variant_stock, v_variant_price
      FROM public.product_variants
      WHERE id = (v_item->>'variant_id')::uuid
        AND product_id = (v_item->>'product_id')::uuid
        AND is_active
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Una de las variantes de tu pedido ya no existe o no corresponde al producto' USING ERRCODE = 'P0103';
      END IF;
      IF v_variant_stock < v_quantity THEN
        RAISE EXCEPTION 'Stock insuficiente: solo quedan % unidades disponibles de esta variante', v_variant_stock;
      END IF;

      UPDATE public.product_variants
      SET stock = stock - v_quantity
      WHERE id = (v_item->>'variant_id')::uuid;
    END IF;

    SELECT price_rdp INTO v_tier_price FROM product_pricing_tiers
      WHERE product_id = (v_item->>'product_id')::uuid
        AND min_quantity <= v_quantity
        AND (max_quantity IS NULL OR max_quantity >= v_quantity)
      ORDER BY min_quantity DESC LIMIT 1;

    v_real_price := COALESCE(v_tier_price, v_variant_price, v_base_price);
    v_check_subtotal := v_check_subtotal + (v_real_price * v_quantity);

    SELECT jsonb_build_object(
      'name', p.name,
      'description', p.description,
      'price_rdp', v_real_price,
      'images', p.images,
      'category', c.name,
      'vendor_business_name', v.business_name,
      'attributes', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'label', ca.attribute_label,
          'value', CASE
            WHEN ca.attribute_type = 'boolean' THEN (CASE WHEN pav.value_boolean THEN 'Sí' ELSE 'No' END)
            WHEN ca.attribute_type IN ('select', 'multiselect') THEN COALESCE(ao.label, pav.value_text)
            WHEN pav.value_number IS NOT NULL THEN pav.value_number::text || COALESCE(' ' || ca.unit, '')
            ELSE pav.value_text
          END
        ))
        FROM product_attribute_values pav
        JOIN category_attributes ca ON ca.id = pav.category_attribute_id
        LEFT JOIN attribute_options ao ON ao.category_attribute_id = pav.category_attribute_id AND ao.value = pav.value_text
        WHERE pav.product_id = p.id
      ), '[]'::jsonb),
      'snapshot_at', NOW()
    )
    INTO v_snapshot
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN vendors v ON v.id = p.vendor_id
    WHERE p.id = (v_item->>'product_id')::uuid;

    INSERT INTO public.order_items (
      order_id, product_id, vendor_id, quantity, price_rdp, size, color, variant_id, product_snapshot
    ) VALUES (
      v_order_id, (v_item->>'product_id')::uuid, v_real_vendor_id,
      v_quantity, v_real_price,
      v_item->>'size', v_item->>'color',
      (v_item->>'variant_id')::uuid,
      v_snapshot
    );

    UPDATE public.products
    SET stock = stock - v_quantity,
        sold_count = sold_count + v_quantity
    WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;

  -- Lo cobrado por línea tiene que cuadrar con el subtotal calculado arriba
  IF v_check_subtotal <> v_subtotal THEN
    RAISE EXCEPTION 'Los precios cambiaron mientras se procesaba tu pedido. Intenta de nuevo.';
  END IF;

  FOR v_vendor_user_id IN
    SELECT DISTINCT v.user_id
    FROM order_items oi
    JOIN vendors v ON v.id = oi.vendor_id
    WHERE oi.order_id = v_order_id
  LOOP
    PERFORM create_notification(
      v_vendor_user_id, 'new_order', '¡Nuevo pedido recibido! 🛒',
      'Tienes un nuevo pedido ' || v_short_id || ' esperando confirmación.', '/dashboard/pedidos',
      jsonb_build_object('order_short_id', v_short_id)
    );
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    PERFORM apply_coupon_use(p_coupon_id);
  END IF;

  PERFORM log_audit_event('order_created', 'order', v_order_id);

  RETURN v_order_id;
END;
$function$;
