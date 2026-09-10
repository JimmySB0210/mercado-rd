-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Solicitar cotización en el chat comprador-vendor
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- NOTA: esta migración documenta cambios ya aplicados directamente en
-- Supabase (vía MCP, mientras el acceso propio del usuario estaba
-- caído) -- no se ejecutó desde este archivo. Se agrega aquí solo
-- para que quede rastro en el repo (mismo motivo que 003/004/005/006/007).
--
-- Cambio 1: tabla chat_quotes + RLS (SELECT por participante) tal
-- cual la definió el usuario.
--
-- Cambio 2: chat_messages.chat_quote_id (FK opcional) -- referencia
-- desde un mensaje a la cotización que representa, para renderizarla
-- como tarjeta especial en el hilo.
--
-- Cambio 3: request_chat_quote() -- el SQL original del usuario solo
-- creaba la fila en chat_quotes; se extendió para TAMBIÉN insertar el
-- mensaje-puente en chat_messages (chat_quote_id), actualizar
-- last_message/vendor_unread de la conversación, y notificar al
-- vendor -- sin esto, chat_quote_id nunca se hubiera poblado y la
-- tarjeta nunca habría aparecido en el hilo.
--
-- Cambio 4: respond_chat_quote() -- se agregó notificación al
-- comprador cada vez que el vendor ajusta el precio (puede llamarse
-- varias veces), y actualización de last_message de la conversación.
--
-- Cambio 5: accept_chat_quote() -- igual que el SQL del usuario
-- (crea el pedido con quoted_unit_price_rdp, NUNCA products.price_rdp),
-- con notificación al vendor agregada al final.
--
-- Cambio 6 -- IMPORTANTE, hallazgo de la verificación en vivo:
-- chat_quotes tuvo que agregarse explícitamente a la publicación
-- supabase_realtime (ALTER PUBLICATION supabase_realtime ADD TABLE
-- chat_quotes) -- una tabla nueva no queda incluida en Realtime solo
-- por tener RLS habilitado.
--
-- Cambio 7 -- chat_quotes también se dejó con REPLICA IDENTITY FULL
-- (necesario para que Realtime pueda evaluar RLS en eventos UPDATE,
-- no solo INSERT).
--
-- A PESAR de los cambios 6 y 7, la entrega de eventos postgres_changes
-- para chat_quotes resultó inconsistente en pruebas repetidas contra
-- la app real (a veces llegaba, a veces no, sin patrón reproducible
-- 100% de las veces) -- posiblemente una particularidad de Realtime en
-- este proyecto específico bajo pruebas repetidas en ventanas cortas.
-- Se decidió NO depender de Realtime para esta tabla: el frontend
-- (mensajes/[id]/page.tsx) hace POLLING de chat_quotes cada 4s en vez
-- de suscribirse. chat_messages vía Realtime sí es sólido (probado
-- repetidas veces) y se dejó como estaba. La tabla queda en la
-- publicación y con REPLICA IDENTITY FULL de todos modos, por si se
-- quiere reintentar Realtime más adelante.
--
-- Verificado en vivo de punta a punta (10 sep 2026, cuentas reales
-- Carlos=comprador / María=vendor, producto "libro", precio de
-- catálogo RD$300): Carlos solicitó cotización -> María cotizó
-- RD$199/unidad (ajustable las veces que haga falta) -> Carlos vio el
-- precio actualizado sin recargar (vía polling) -> Carlos aceptó
-- (dirección + provincia + método de pago) -> pedido real creado.
-- Confirmado en la base de datos: order_items.price_rdp = 19900
-- (RD$199, el precio negociado), NO products.price_rdp = 30000
-- (RD$300, el precio de catálogo) -- la diferencia es exacta e
-- inequívoca. Datos de prueba limpiados después (pedido, order_items,
-- cotización, mensaje-puente, stock/sold_count del producto, y
-- last_message de la conversación, todos restaurados).
-- ═══════════════════════════════════════════════════════════

CREATE TABLE public.chat_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.users(id),
  quantity int NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'requested', -- requested | quoted | accepted | declined
  quoted_unit_price_rdp int,
  quoted_by uuid REFERENCES public.users(id),
  order_id uuid REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chat_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_quotes REPLICA IDENTITY FULL;

CREATE POLICY "chat_quotes_participant_read" ON public.chat_quotes FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE buyer_id = (select auth.uid())
    UNION
    SELECT c.id FROM conversations c JOIN vendors v ON v.id = c.vendor_id WHERE v.user_id = (select auth.uid())
  ) OR public.is_admin()
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_quotes;

ALTER TABLE public.chat_messages ADD COLUMN chat_quote_id uuid REFERENCES public.chat_quotes(id);

CREATE OR REPLACE FUNCTION public.request_chat_quote(p_conversation_id uuid, p_product_id uuid, p_quantity int)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_quote_id uuid;
  v_is_buyer boolean;
  v_vendor_user_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT EXISTS(SELECT 1 FROM conversations WHERE id = p_conversation_id AND buyer_id = auth.uid()) INTO v_is_buyer;
  IF NOT v_is_buyer THEN RAISE EXCEPTION 'Solo el comprador puede solicitar una cotización'; END IF;

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
    v_vendor_user_id, 'new_message',
    'Nueva solicitud de cotización 💰',
    'Te pidieron cotizar ' || p_quantity || ' unidades',
    '/mensajes'
  );

  RETURN v_quote_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_chat_quote(p_quote_id uuid, p_unit_price_rdp int)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_vendor_ok boolean;
  v_conversation_id uuid;
  v_buyer_id uuid;
  v_vendor_business_name text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT EXISTS(
    SELECT 1 FROM chat_quotes cq JOIN conversations c ON c.id = cq.conversation_id
    JOIN vendors v ON v.id = c.vendor_id
    WHERE cq.id = p_quote_id AND v.user_id = auth.uid()
  ) INTO v_vendor_ok;
  IF NOT v_vendor_ok THEN RAISE EXCEPTION 'No autorizado'; END IF;

  UPDATE chat_quotes
  SET quoted_unit_price_rdp = p_unit_price_rdp, quoted_by = auth.uid(), status = 'quoted', updated_at = NOW()
  WHERE id = p_quote_id AND status IN ('requested', 'quoted');

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
    v_buyer_id, 'new_message',
    COALESCE(v_vendor_business_name, 'El vendedor') || ' te envió un precio 💰',
    'Nuevo precio: RD$' || (p_unit_price_rdp / 100) || ' por unidad',
    '/mensajes'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_chat_quote(
  p_quote_id uuid, p_delivery_address text, p_province_id int, p_payment_method payment_method
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_quote record;
  v_product record;
  v_order_id uuid;
  v_subtotal int;
  v_delivery int;
  v_itbis int;
  v_total int;
  v_vendor_user_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT * INTO v_quote FROM chat_quotes WHERE id = p_quote_id AND requested_by = auth.uid() FOR UPDATE;
  IF v_quote IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cotización no encontrada');
  END IF;
  IF v_quote.status != 'quoted' OR v_quote.quoted_unit_price_rdp IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta cotización todavía no tiene un precio para aceptar');
  END IF;

  SELECT * INTO v_product FROM products WHERE id = v_quote.product_id;

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

  INSERT INTO order_items (order_id, product_id, vendor_id, quantity, price_rdp)
  VALUES (v_order_id, v_product.id, v_product.vendor_id, v_quote.quantity, v_quote.quoted_unit_price_rdp);

  UPDATE products SET stock = GREATEST(0, stock - v_quote.quantity), sold_count = sold_count + v_quote.quantity WHERE id = v_product.id;

  UPDATE chat_quotes SET status = 'accepted', order_id = v_order_id, updated_at = NOW() WHERE id = p_quote_id;

  UPDATE conversations SET last_message = '💰 Cotización aceptada — pedido creado', last_message_at = NOW()
  WHERE id = v_quote.conversation_id;

  SELECT v.user_id INTO v_vendor_user_id
  FROM conversations c JOIN vendors v ON v.id = c.vendor_id
  WHERE c.id = v_quote.conversation_id;

  PERFORM create_notification(
    v_vendor_user_id, 'new_message',
    '¡Cotización aceptada! 🎉',
    'El comprador aceptó tu precio y generó un pedido',
    '/dashboard/pedidos'
  );

  PERFORM log_audit_event('chat_quote_accepted', 'order', v_order_id);

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_chat_quote, public.respond_chat_quote, public.accept_chat_quote TO authenticated;
