-- ═══════════════════════════════════════════════════════════
-- MercadoRD — create_order_from_cart: endurecimiento completo
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Este archivo reemplaza por completo la versión anterior de esta
-- misma migración (que solo agregaba el bloqueo de auto-compra) — el
-- usuario confirmó contra la BD viva que la versión corriendo hoy es
-- exactamente la de la migración 015 de este repo (el precio real por
-- servidor sí está aplicado), así que ESA es la base real de la que
-- se parte acá, más los 5 huecos que confirmó en el cuerpo vivo:
--
--   1. p_discount_rdp se aplicaba directo vía LEAST(p_discount_rdp,
--      v_subtotal) -- un cliente podía mandar el descuento igual al
--      subtotal y pagar gratis. FIX: el parámetro desaparece de la
--      firma. Solo se recibe p_coupon_id; el descuento se recalcula
--      acá adentro contra la fila real de coupons (bloqueada con FOR
--      UPDATE para evitar dos pedidos concurrentes agotando
--      max_uses a la vez), validando activo / vencimiento / max_uses
--      / min_order / vendor_id del cupón vs los vendors reales de los
--      items -- mismos criterios que validate_coupon, pero
--      recalculados acá, nunca confiando en lo que mandó el cliente.
--      Schema real de coupons confirmado en código funcionando
--      (dashboard/cupones/page.tsx, no adivinado): id, code, type
--      ('percentage'|'fixed'), value, vendor_id, min_order_rdp,
--      max_uses, uses_count, expires_at, is_active, created_at.
--
--   2. order_items.vendor_id salía de lo que mandaba el cliente en
--      cada item, sin cruzarlo jamás. FIX: se resuelve SIEMPRE de
--      products.vendor_id (lookup real), el vendor_id que venga en
--      p_items se ignora por completo.
--
--   3. Sin bloqueo de auto-compra. FIX: usando el vendor_id YA
--      resuelto en el punto 2 (no hace falta un loop aparte), si
--      auth.uid() es el user_id de ese vendor, RAISE EXCEPTION con
--      ERRCODE 'P0101' -- mismo código ya acordado antes, mapeado en
--      el frontend (lib/orderErrors.ts) sin mostrar texto crudo.
--
--   4. Stock de variante no se tocaba acá -- vivía en
--      reduce_variant_stock, que ya se revoca en la migración 022 (y
--      que además nadie llama hoy, confirmado por grep). FIX: si el
--      item trae variant_id, se descuenta product_variants.stock
--      DENTRO de esta función, con FOR UPDATE, con el mismo chequeo
--      de suficiencia que ya existe para products.stock. products.stock
--      se sigue descontando igual que siempre, en paralelo -- son dos
--      contadores reales distintos, no uno reemplaza al otro.
--      REQUIERE cambio de cliente: p_items ahora puede traer
--      variant_id (nullable) -- ver checkout/page.tsx actualizado.
--
--   5. apply_coupon_use() se seguía llamando al final, sin cambios --
--      ya incrementa uses_count por su cuenta; duplicar ese
--      incremento acá sería contarlo dos veces.
--
-- Como con activate_pro_plan: esto NO es un dump literal de
-- pg_get_functiondef() para el cuerpo COMPLETO -- la base (precio real
-- por tramo, bloqueo de stock con FOR UPDATE, snapshot, notificación
-- al vendor, log de auditoría) SÍ es texto real de este repo
-- (migración 015, confirmado idéntico a lo vivo) — lo nuevo (cupón,
-- vendor_id real, auto-compra, stock de variante) se construye encima
-- siguiendo exactamente los criterios que el usuario confirmó contra
-- la BD viva. Verificar contra pg_get_functiondef() antes de aplicar.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_order_from_cart(p_delivery_address text, p_province_id integer, p_payment_method payment_method, p_notes text, p_items jsonb, p_coupon_id uuid DEFAULT NULL::uuid, p_recipient_name text DEFAULT NULL::text, p_recipient_phone text DEFAULT NULL::text)
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
  v_variant_stock int;
  v_quantity int;
  v_short_id text;
  v_vendor_user_id uuid;
  v_real_price int;
  v_base_price int;
  v_tier_price int;
  v_real_vendor_id uuid;
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

  -- CRÍTICO: el precio real y el vendor_id real se calculan aquí, del
  -- lado del servidor -- nunca se confía en lo que manda el cliente
  -- para ninguno de los dos. De paso, el mismo lookup a products ya
  -- resuelve el vendor_id real, así que el bloqueo de auto-compra
  -- vive en este mismo loop, sin necesitar uno aparte.
  v_subtotal := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::int;
    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'La cantidad de cada producto debe ser mayor a cero';
    END IF;

    SELECT price_rdp, vendor_id INTO v_base_price, v_real_vendor_id
    FROM products WHERE id = (v_item->>'product_id')::uuid;
    IF v_base_price IS NULL THEN
      RAISE EXCEPTION 'Uno de los productos de tu pedido ya no existe';
    END IF;

    -- Un vendedor no puede comprar su propio producto, aunque venga
    -- mezclado en el carrito con productos de otros vendedores.
    IF EXISTS (SELECT 1 FROM vendors WHERE id = v_real_vendor_id AND user_id = auth.uid()) THEN
      RAISE EXCEPTION 'No puedes comprar tus propios productos' USING ERRCODE = 'P0101';
    END IF;

    SELECT price_rdp INTO v_tier_price FROM product_pricing_tiers
      WHERE product_id = (v_item->>'product_id')::uuid
        AND min_quantity <= v_quantity
        AND (max_quantity IS NULL OR max_quantity >= v_quantity)
      ORDER BY min_quantity DESC LIMIT 1;

    v_real_price := COALESCE(v_tier_price, v_base_price);
    v_subtotal := v_subtotal + (v_real_price * v_quantity);
  END LOOP;

  -- Revalidar el cupón del lado servidor -- p_discount_rdp ya no
  -- existe como parámetro, nunca se confía en un descuento que mande
  -- el cliente. FOR UPDATE bloquea la fila para que dos pedidos
  -- concurrentes no agoten max_uses al mismo tiempo.
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

    -- Cupón de un vendor específico: solo aplica si TODOS los items
    -- del pedido son de ese vendor -- usando el vendor_id REAL
    -- (products.vendor_id), nunca el que mandó el cliente.
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

    -- Stock de variante -- dentro de esta función, no en un RPC aparte
    -- que el cliente pudiera llamar con cualquier cantidad.
    IF (v_item->>'variant_id') IS NOT NULL THEN
      SELECT stock INTO v_variant_stock
      FROM public.product_variants WHERE id = (v_item->>'variant_id')::uuid
      FOR UPDATE;

      IF v_variant_stock IS NULL THEN
        RAISE EXCEPTION 'Una de las variantes de tu pedido ya no existe';
      END IF;
      IF v_variant_stock < v_quantity THEN
        RAISE EXCEPTION 'Stock insuficiente: solo quedan % unidades disponibles de esta variante', v_variant_stock;
      END IF;

      UPDATE public.product_variants
      SET stock = stock - v_quantity
      WHERE id = (v_item->>'variant_id')::uuid;
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
      v_order_id, (v_item->>'product_id')::uuid, v_real_vendor_id,
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
