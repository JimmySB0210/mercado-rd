-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Adjuntos (foto/video/documento) en el chat comprador-vendor
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- NOTA: esta migración documenta cambios ya aplicados directamente en
-- Supabase (vía MCP, mientras el acceso propio del usuario estaba
-- caído) -- no se ejecutó desde este archivo. Se agrega aquí solo
-- para que quede rastro en el repo (mismo motivo que 003/004/005/006).
--
-- Cambio 1: chat_messages.attachments (jsonb) -- array de
-- {"path", "type": "image"|"video"|"document", "filename"}. El tipo y
-- el nombre real del archivo van en el jsonb (no solo la ruta) para
-- poder mostrar documentos con su nombre real, no un ícono genérico.
--
-- Cambio 2: bucket privado chat-attachments (mismo patrón que
-- dispute-evidence) -- ruta {conversation_id}/{filename}. Policy
-- chat_attachments_participant_access (FOR ALL, USING + WITH CHECK)
-- restringe storage.objects a los 2 participantes de esa conversación
-- (comprador o vendor) o admin, vía (storage.foldername(name))[1].
--
-- Cambio 3: send_chat_message() gana p_attachments jsonb DEFAULT NULL.
-- El mensaje ahora puede ir vacío SI trae al menos un adjunto (antes
-- exigía 1-1000 caracteres siempre); last_message/notificación
-- muestran "📎 Adjunto" cuando el texto va vacío.
--
-- ADVERTENCIA DE POSTGRES A TENER EN CUENTA: CREATE OR REPLACE
-- FUNCTION con un parámetro nuevo NO reemplaza la función existente --
-- Postgres la trata como un overload nuevo porque cambia la firma
-- (distinto número de parámetros). Terminamos con 2 versiones de
-- send_chat_message() hasta que se detectó y se hizo DROP FUNCTION
-- explícito de la firma vieja (4 parámetros, sin p_attachments) --
-- ver el DROP al final de este archivo. Si se vuelve a tocar esta
-- función agregando/quitando parámetros, hay que repetir ese DROP.
--
-- Verificado en vivo (10 sep 2026): mensaje real con imagen + video +
-- documento enviado desde el composer de /mensajes/[id], visible con
-- URL firmada tanto para el comprador como el vendor de esa
-- conversación. Prueba de seguridad: una TERCERA cuenta (ni comprador
-- ni vendor de la conversación) intentó generar una URL firmada
-- directo contra la Storage API para ese mismo path -- bloqueado por
-- RLS ("Object not found", sin filtrar si el objeto existe). También
-- se probó el lado de escritura: la misma cuenta intentando subir un
-- archivo a la carpeta de esa conversación -- bloqueado ("new row
-- violates row-level security policy"). Datos de prueba limpiados
-- después (mensaje, archivos, y last_message/last_message_at de la
-- conversación restaurados a su estado previo).
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.chat_messages ADD COLUMN attachments jsonb;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "chat_attachments_participant_access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'chat-attachments' AND (
    (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM conversations WHERE buyer_id = (select auth.uid())
      UNION
      SELECT c.id FROM conversations c JOIN vendors v ON v.id = c.vendor_id WHERE v.user_id = (select auth.uid())
    )
    OR public.is_admin()
  )
)
WITH CHECK (
  bucket_id = 'chat-attachments' AND (
    (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM conversations WHERE buyer_id = (select auth.uid())
      UNION
      SELECT c.id FROM conversations c JOIN vendors v ON v.id = c.vendor_id WHERE v.user_id = (select auth.uid())
    )
    OR public.is_admin()
  )
);

CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_vendor_id uuid,
  p_product_id uuid,
  p_message text,
  p_conversation_id uuid DEFAULT NULL::uuid,
  p_attachments jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_conversation_id uuid;
  v_message_id uuid;
  v_vendor_user_id uuid;
  v_vendor_business_name text;
  v_buyer_id uuid;
  v_conv_vendor_id uuid;
  v_is_buyer boolean;
  v_preview text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF LENGTH(p_message) > 1000 THEN
    RAISE EXCEPTION 'El mensaje debe tener entre 1 y 1000 caracteres';
  END IF;

  IF (p_message IS NULL OR LENGTH(TRIM(p_message)) = 0)
     AND (p_attachments IS NULL OR jsonb_array_length(p_attachments) = 0) THEN
    RAISE EXCEPTION 'El mensaje debe tener entre 1 y 1000 caracteres';
  END IF;

  v_preview := CASE WHEN p_message IS NOT NULL AND LENGTH(TRIM(p_message)) > 0 THEN p_message ELSE '📎 Adjunto' END;

  SELECT user_id, business_name INTO v_vendor_user_id, v_vendor_business_name
  FROM vendors WHERE id = p_vendor_id;

  v_is_buyer := (auth.uid() != v_vendor_user_id);

  IF p_conversation_id IS NOT NULL THEN
    SELECT buyer_id, vendor_id INTO v_buyer_id, v_conv_vendor_id
    FROM conversations WHERE id = p_conversation_id;

    IF v_buyer_id IS NULL THEN
      RAISE EXCEPTION 'Conversación no encontrada';
    END IF;
    IF v_conv_vendor_id != p_vendor_id THEN
      RAISE EXCEPTION 'La conversación no corresponde a este vendor';
    END IF;
    IF auth.uid() != v_buyer_id AND auth.uid() != v_vendor_user_id THEN
      RAISE EXCEPTION 'No autorizado para escribir en esta conversación';
    END IF;

    v_conversation_id := p_conversation_id;

    UPDATE conversations
    SET last_message = v_preview,
        last_message_at = NOW(),
        vendor_unread = CASE WHEN v_is_buyer THEN vendor_unread + 1 ELSE vendor_unread END,
        buyer_unread  = CASE WHEN v_is_buyer THEN buyer_unread  ELSE buyer_unread + 1 END
    WHERE id = p_conversation_id;
  ELSE
    IF v_is_buyer THEN
      v_buyer_id := auth.uid();
    ELSE
      SELECT buyer_id INTO v_buyer_id FROM conversations
      WHERE vendor_id = p_vendor_id
        AND (product_id = p_product_id OR (product_id IS NULL AND p_product_id IS NULL))
      LIMIT 1;
      IF v_buyer_id IS NULL THEN
        RAISE EXCEPTION 'No existe una conversación previa para responder';
      END IF;
    END IF;

    INSERT INTO public.conversations (buyer_id, vendor_id, product_id, last_message, last_message_at)
    VALUES (v_buyer_id, p_vendor_id, p_product_id, v_preview, NOW())
    ON CONFLICT (buyer_id, vendor_id, product_id) DO UPDATE
    SET last_message = v_preview,
        last_message_at = NOW(),
        vendor_unread = CASE WHEN v_is_buyer THEN conversations.vendor_unread + 1 ELSE conversations.vendor_unread END,
        buyer_unread  = CASE WHEN v_is_buyer THEN conversations.buyer_unread  ELSE conversations.buyer_unread + 1 END
    RETURNING id INTO v_conversation_id;
  END IF;

  INSERT INTO public.chat_messages (conversation_id, sender_id, message, attachments)
  VALUES (v_conversation_id, auth.uid(), COALESCE(p_message, ''), p_attachments)
  RETURNING id INTO v_message_id;

  IF v_is_buyer THEN
    PERFORM create_notification(
      v_vendor_user_id, 'new_message',
      'Nuevo mensaje de un comprador 💬',
      LEFT(v_preview, 80),
      '/mensajes'
    );
  ELSE
    PERFORM create_notification(
      v_buyer_id, 'new_message',
      COALESCE(v_vendor_business_name, 'El vendedor') || ' te respondió 💬',
      LEFT(v_preview, 80),
      '/mensajes'
    );
  END IF;

  RETURN v_message_id;
END;
$function$;

-- Ver ADVERTENCIA arriba — sin este DROP, la firma vieja (4 parámetros,
-- sin p_attachments) queda viva como un segundo overload y PostgREST
-- no sabe cuál de las 2 llamar.
DROP FUNCTION IF EXISTS public.send_chat_message(uuid, uuid, text, uuid);
