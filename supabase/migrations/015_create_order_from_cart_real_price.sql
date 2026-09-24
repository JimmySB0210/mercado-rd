-- ═══════════════════════════════════════════════════════════
-- MercadoRD — create_order_from_cart calcula el precio real en el servidor
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- NOTA: esta migración documenta el estado ACTUAL de
-- create_order_from_cart, ya aplicado directamente en Supabase por
-- el usuario -- no se ejecutó desde este archivo. Se agrega aquí
-- solo para que quede rastro en el repo (mismo patrón que
-- 003/004/.../014). No modifica la migración 003 original, que
-- queda como registro histórico de la versión vulnerable que existió.
--
-- Hueco de seguridad encontrado mientras se investigaba por qué los
-- precios por tramo de cantidad (product_pricing_tiers) no se
-- cobraban: la función tomaba price_rdp directo de cada item de
-- p_items, es decir, del navegador, sin verificarlo contra el precio
-- real del catálogo en ningún punto. Cualquiera con una sesión válida
-- podía llamar la función RPC directo (sin pasar por /checkout) y
-- mandar el price_rdp que quisiera.
--
-- Fix: el precio real de cada item ahora se calcula del lado del
-- servidor, dos veces (subtotal y por cada order_item), siempre como
-- COALESCE(tramo que califica para la cantidad, precio base del
-- catálogo) -- el price_rdp que manda el cliente ya no se lee en
-- ningún lado.
--
-- Verificado en vivo el 24-sep-2026 con 3 pruebas:
-- 1) Manipulación directa (RPC, no por la UI): price_rdp=1 para un
--    iPhone 15 de RD$85,000 -- el pedido se creó con
--    order_items.price_rdp = 8,500,000 (precio real), no 1.
-- 2) Tramos reales (3-5 u. = RD$68,000, 6+ u. = RD$65,000) + checkout
--    real por la interfaz pidiendo 3 unidades -- el cliente solo
--    conoce el precio base (RD$72,000, así se mostró en pantalla) y
--    aun así order_items.price_rdp quedó en 6,800,000, el del tramo.
-- 3) Checkout normal sin tramos ni manipulación (AirPods Pro, 1 u.)
--    -- cobró exactamente el precio de catálogo, sin regresión.
-- Datos de prueba (pedidos, tramos temporales, stock/sold_count)
-- limpiados después de verificar.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_order_from_cart(p_delivery_address text, p_province_id integer, p_payment_method payment_method, p_notes text, p_items jsonb, p_discount_rdp integer DEFAULT 0, p_coupon_id uuid DEFAULT NULL::uuid, p_recipient_name text DEFAULT NULL::text, p_recipient_phone text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_subtotal int := 0;
  v_delivery int;
  v_total int;
  v_itbis int;
  v_item jsonb;
  v_snapshot jsonb;
  v_current_stock int;
  v_quantity int;
  v_short_id text;
  v_vendor_user_id uuid;
  v_real_price int;
  v_base_price int;
  v_tier_price int;
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

  IF p_discount_rdp < 0 THEN
    RAISE EXCEPTION 'El descuento no puede ser negativo';
  END IF;

  IF p_recipient_name IS NOT NULL AND LENGTH(TRIM(p_recipient_name)) < 3 THEN
    RAISE EXCEPTION 'El nombre del destinatario debe tener al menos 3 caracteres';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'quantity')::int <= 0 THEN
      RAISE EXCEPTION 'La cantidad de cada producto debe ser mayor a cero';
    END IF;
  END LOOP;

  -- CRÍTICO: el precio real se calcula aquí, del lado del servidor --
  -- nunca se confía en el price_rdp que manda el cliente. Se usa el
  -- tramo de product_pricing_tiers que califica para la cantidad
  -- pedida, o si no hay tramo que aplique, el precio base del
  -- catálogo (products.price_rdp).
  v_subtotal := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::int;

    SELECT price_rdp INTO v_base_price FROM products WHERE id = (v_item->>'product_id')::uuid;
    IF v_base_price IS NULL THEN
      RAISE EXCEPTION 'Uno de los productos de tu pedido ya no existe';
    END IF;

    SELECT price_rdp INTO v_tier_price FROM product_pricing_tiers
      WHERE product_id = (v_item->>'product_id')::uuid
        AND min_quantity <= v_quantity
        AND (max_quantity IS NULL OR max_quantity >= v_quantity)
      ORDER BY min_quantity DESC LIMIT 1;

    v_real_price := COALESCE(v_tier_price, v_base_price);
    v_subtotal := v_subtotal + (v_real_price * v_quantity);
  END LOOP;

  SELECT price_rdp INTO v_delivery FROM shipping_rates WHERE province_id = p_province_id;
  IF v_delivery IS NULL THEN v_delivery := 25000; END IF;
  IF v_subtotal >= 250000 THEN v_delivery := 0; END IF;

  v_itbis := ROUND(v_subtotal * 0.18);
  v_total := v_subtotal + v_itbis + v_delivery - LEAST(p_discount_rdp, v_subtotal);

  INSERT INTO public.orders (
    user_id, status, delivery_type, delivery_address, province_id,
    subtotal_rdp, discount_rdp, delivery_rdp, total_rdp, payment_method, notes,
    recipient_name, recipient_phone
  ) VALUES (
    auth.uid(), 'pending', 'standard', p_delivery_address, p_province_id,
    v_subtotal, p_discount_rdp, v_delivery, v_total, p_payment_method, p_notes,
    NULLIF(TRIM(p_recipient_name), ''), NULLIF(TRIM(p_recipient_phone), '')
  )
  RETURNING id INTO v_order_id;

  v_short_id := '#RD-' || UPPER(LEFT(v_order_id::text, 8));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::int;

    SELECT stock, price_rdp INTO v_current_stock, v_base_price
    FROM public.products WHERE id = (v_item->>'product_id')::uuid
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Uno de los productos de tu pedido ya no existe';
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Stock insuficiente: solo quedan % unidades disponibles de este producto', v_current_stock;
    END IF;

    -- Mismo cálculo de precio real, ahora para el registro final
    -- (order_items + snapshot)
    SELECT price_rdp INTO v_tier_price FROM product_pricing_tiers
      WHERE product_id = (v_item->>'product_id')::uuid
        AND min_quantity <= v_quantity
        AND (max_quantity IS NULL OR max_quantity >= v_quantity)
      ORDER BY min_quantity DESC LIMIT 1;

    v_real_price := COALESCE(v_tier_price, v_base_price);

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
      order_id, product_id, vendor_id, quantity, price_rdp, size, color, product_snapshot
    ) VALUES (
      v_order_id, (v_item->>'product_id')::uuid, (v_item->>'vendor_id')::uuid,
      v_quantity, v_real_price,
      v_item->>'size', v_item->>'color', v_snapshot
    );

    UPDATE public.products
    SET stock = stock - v_quantity,
        sold_count = sold_count + v_quantity
    WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;

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
