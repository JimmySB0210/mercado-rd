-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Snapshot de producto en order_items
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- NOTA: esta migración documenta el estado ACTUAL de
-- create_order_from_cart, ya aplicado directamente en Supabase —
-- no se ejecutó desde este archivo. Se agrega aquí solo para que
-- quede rastro en el repo de un cambio hecho fuera de la migración
-- 001 inicial.
--
-- Cambio: order_items.product_snapshot (jsonb) congela, en el
-- momento exacto de cada compra, el nombre, descripción, precio
-- realmente cobrado, imágenes, categoría, nombre de la tienda y los
-- atributos fijos del producto (product_attribute_values, resueltos
-- a su label legible vía attribute_options — Sí/No para booleanos,
-- valor + unit para numéricos, ej. "100 %"). No incluye atributos de
-- variante (product_attribute_values son solo los fijos, no los de
-- product_variants).
--
-- Verificado en vivo con 3 compras reales del mismo producto
-- (Galaxy S24 Ultra, distintas variantes) el 11-12 ago 2026:
-- product_snapshot.price_rdp coincide exacto con order_items.price_rdp
-- de la misma fila, y attributes trae labels legibles ("Samsung",
-- "8 GB", "Android", "Sí", "100 %"), no los códigos crudos.
--
-- No se muestra en ninguna pantalla todavía — queda solo capturado
-- para cuando se construya el sistema de disputas con evidencia
-- estructurada.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_order_from_cart(p_delivery_address text, p_province_id integer, p_payment_method payment_method, p_notes text, p_items jsonb, p_discount_rdp integer DEFAULT 0, p_coupon_id uuid DEFAULT NULL::uuid)
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

  SELECT COALESCE(SUM((item->>'price_rdp')::int * (item->>'quantity')::int), 0)
  INTO v_subtotal
  FROM jsonb_array_elements(p_items) AS item;

  SELECT price_rdp INTO v_delivery FROM shipping_rates WHERE province_id = p_province_id;
  IF v_delivery IS NULL THEN v_delivery := 25000; END IF;
  IF v_subtotal >= 250000 THEN v_delivery := 0; END IF;

  v_itbis := ROUND(v_subtotal * 0.18);
  v_total := v_subtotal + v_itbis + v_delivery - LEAST(p_discount_rdp, v_subtotal);

  INSERT INTO public.orders (
    user_id, status, delivery_type, delivery_address, province_id,
    subtotal_rdp, discount_rdp, delivery_rdp, total_rdp, payment_method, notes
  ) VALUES (
    auth.uid(), 'pending', 'standard', p_delivery_address, p_province_id,
    v_subtotal, p_discount_rdp, v_delivery, v_total, p_payment_method, p_notes
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT jsonb_build_object(
      'name', p.name,
      'description', p.description,
      'price_rdp', (v_item->>'price_rdp')::int,
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
      (v_item->>'quantity')::int, (v_item->>'price_rdp')::int,
      v_item->>'size', v_item->>'color', v_snapshot
    );

    UPDATE public.products
    SET stock = GREATEST(0, stock - (v_item->>'quantity')::int),
        sold_count = sold_count + (v_item->>'quantity')::int
    WHERE id = (v_item->>'product_id')::uuid;
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    PERFORM apply_coupon_use(p_coupon_id);
  END IF;

  PERFORM log_audit_event('order_created', 'order', v_order_id);

  RETURN v_order_id;
END;
$function$;
