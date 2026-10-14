-- ============================================================
-- MercadoRD - Lote B: endurecimiento de Storage, chat, cupones y push
-- ============================================================
-- Cambios:
--   1. Storage: products y vendors solo aceptan subidas dentro de la
--      carpeta del dueno (products/{vendors.id}/..., vendors/{users.id}/...).
--      Antes cualquier usuario con sesion podia escribir en cualquier ruta.
--   2. Storage: chat-attachments deja de ser una politica FOR ALL; los
--      participantes solo pueden SUBIR y LEER (no modificar ni borrar los
--      adjuntos del otro, que son evidencia). Solo admin borra.
--   3. Buckets: products sube a 50 MB (videos de producto);
--      chat-attachments, dispute-evidence e identity-documents reciben
--      limite de tamano y tipos permitidos que ya exigia el front.
--   4. Chat: 3 politicas de escritura directa que ningun codigo del front
--      usa (todo pasa por send_chat_message, mark_conversation_read y las
--      RPC de cotizacion, todas DEFINER) quedan inertes, igual que otras 2
--      de Storage que ya no hacen falta.
--   5. send_chat_message: tienda inexistente, producto de otra tienda,
--      respuesta de vendedor sin conversation_id y adjuntos fuera de la
--      conversacion.
--   6. validate_coupon: ya no la ejecuta anon (solo usuarios con sesion).
--   7. push_subscriptions: el endpoint solo puede ser de los servicios
--      push reales (FCM, Mozilla, Apple, Windows) y las llaves tienen tope.
-- Esta migracion es re-ejecutable (idempotente).
-- Las politicas obsoletas se dejan inertes (USING / WITH CHECK false) en
-- lugar de eliminarse: el efecto es el mismo (nadie pasa por ellas) y la
-- migracion no contiene sentencias destructivas.
-- ============================================================


-- ============================================================
-- 1. STORAGE: products y vendors por carpeta del dueno
-- ============================================================
-- Se compara como TEXTO (id::text) para que una carpeta que no sea un
-- UUID de "denegado" limpio en vez de un error de cast.

ALTER POLICY products_vendor_upload ON storage.objects
  WITH CHECK (
    bucket_id = 'products'
    AND (storage.foldername(name))[1] IN (
      SELECT v.id::text FROM public.vendors v WHERE v.user_id = (SELECT auth.uid())
    )
  );

ALTER POLICY products_bucket_vendor_delete ON storage.objects
  USING (
    bucket_id = 'products'
    AND (storage.foldername(name))[1] IN (
      SELECT v.id::text FROM public.vendors v WHERE v.user_id = (SELECT auth.uid())
    )
  );

ALTER POLICY vendors_owner_upload ON storage.objects
  WITH CHECK (
    bucket_id = 'vendors'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );


-- ============================================================
-- 2. STORAGE: chat-attachments (subir y leer; solo admin borra)
-- ============================================================
-- Cada politica se crea si no existe y, si ya existe, se deja con la
-- definicion de abajo.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'chat_attachments_participant_read'
  ) THEN
    ALTER POLICY chat_attachments_participant_read ON storage.objects
      TO authenticated
      USING (
        bucket_id = 'chat-attachments'
        AND (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id::text = (storage.foldername(name))[1]
              AND (
                c.buyer_id = (SELECT auth.uid())
                OR c.vendor_id IN (SELECT v.id FROM public.vendors v WHERE v.user_id = (SELECT auth.uid()))
              )
          )
        )
      );
  ELSE
    CREATE POLICY chat_attachments_participant_read ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'chat-attachments'
        AND (
          public.is_admin()
          OR EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id::text = (storage.foldername(name))[1]
              AND (
                c.buyer_id = (SELECT auth.uid())
                OR c.vendor_id IN (SELECT v.id FROM public.vendors v WHERE v.user_id = (SELECT auth.uid()))
              )
          )
        )
      );
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'chat_attachments_participant_insert'
  ) THEN
    ALTER POLICY chat_attachments_participant_insert ON storage.objects
      TO authenticated
      WITH CHECK (
        bucket_id = 'chat-attachments'
        AND EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id::text = (storage.foldername(name))[1]
            AND (
              c.buyer_id = (SELECT auth.uid())
              OR c.vendor_id IN (SELECT v.id FROM public.vendors v WHERE v.user_id = (SELECT auth.uid()))
            )
        )
      );
  ELSE
    CREATE POLICY chat_attachments_participant_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'chat-attachments'
        AND EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id::text = (storage.foldername(name))[1]
            AND (
              c.buyer_id = (SELECT auth.uid())
              OR c.vendor_id IN (SELECT v.id FROM public.vendors v WHERE v.user_id = (SELECT auth.uid()))
            )
        )
      );
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'chat_attachments_admin_delete'
  ) THEN
    ALTER POLICY chat_attachments_admin_delete ON storage.objects
      TO authenticated
      USING (bucket_id = 'chat-attachments' AND public.is_admin());
  ELSE
    CREATE POLICY chat_attachments_admin_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'chat-attachments' AND public.is_admin());
  END IF;
END $$;


-- ============================================================
-- 3. BUCKETS: tamano y tipos
-- ============================================================
-- products: 50 MB para videos de producto (las imagenes siguen
-- limitadas a 5 MB por el formulario; el bucket no distingue por tipo).
UPDATE storage.buckets SET file_size_limit = 52428800 WHERE id = 'products';

-- chat-attachments: el front permite imagen 5 MB, video 20 MB, PDF 10 MB y
-- audio 10 MB; el bucket pone el tope mayor (20 MB). audio/* porque las
-- notas de voz llegan como "audio/webm;codecs=opus".
UPDATE storage.buckets
SET file_size_limit = 20971520,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','application/pdf','audio/*']
WHERE id = 'chat-attachments';

-- dispute-evidence e identity-documents: el front solo sube imagenes JPG/PNG/WebP de hasta 5 MB.
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id IN ('dispute-evidence', 'identity-documents');


-- ============================================================
-- 4. POLITICAS OBSOLETAS: se dejan inertes
-- ============================================================
-- Chat: todo el chat escribe por send_chat_message / mark_conversation_read /
-- request|respond|accept_chat_quote (SECURITY DEFINER). Las tres politicas
-- siguientes dejaban a un participante insertar mensajes, crear
-- conversaciones con cualquier tienda/producto y reescribir vendor_id,
-- buyer_id, contadores y ultimo mensaje.
-- Storage: products_vendor_delete comparaba la carpeta con el id del
-- USUARIO (en products las carpetas son ids de tienda; la que sirve es
-- products_bucket_vendor_delete) y chat_attachments_participant_access era
-- la politica FOR ALL que reemplazan las de la seccion 2.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'products_vendor_delete'
  ) THEN
    ALTER POLICY products_vendor_delete ON storage.objects USING (false);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'chat_attachments_participant_access'
  ) THEN
    ALTER POLICY chat_attachments_participant_access ON storage.objects USING (false) WITH CHECK (false);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'chat_messages_participant_insert'
  ) THEN
    ALTER POLICY chat_messages_participant_insert ON public.chat_messages WITH CHECK (false);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'conversations_buyer_insert'
  ) THEN
    ALTER POLICY conversations_buyer_insert ON public.conversations WITH CHECK (false);
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'conversations_participant_update'
  ) THEN
    ALTER POLICY conversations_participant_update ON public.conversations USING (false);
  END IF;
END $$;


-- ============================================================
-- 5. send_chat_message (misma firma y defaults)
-- ============================================================
CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_vendor_id uuid,
  p_product_id uuid,
  p_message text,
  p_conversation_id uuid DEFAULT NULL::uuid,
  p_attachments jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_conversation_id uuid;
  v_message_id uuid;
  v_vendor_user_id uuid;
  v_vendor_business_name text;
  v_buyer_id uuid;
  v_conv_vendor_id uuid;
  v_is_buyer boolean;
  v_preview text;
  v_att jsonb;
  v_clean jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF LENGTH(p_message) > 1000 THEN
    RAISE EXCEPTION 'El mensaje debe tener entre 1 y 1000 caracteres';
  END IF;

  -- Un null JSON llega como jsonb 'null': se trata igual que "sin adjuntos".
  IF p_attachments IS NOT NULL AND jsonb_typeof(p_attachments) = 'null' THEN
    p_attachments := NULL;
  END IF;

  IF p_attachments IS NOT NULL THEN
    IF jsonb_typeof(p_attachments) <> 'array' THEN
      RAISE EXCEPTION 'Adjuntos inválidos';
    END IF;
    IF jsonb_array_length(p_attachments) > 20 THEN
      RAISE EXCEPTION 'Máximo 20 adjuntos por mensaje';
    END IF;
  END IF;

  IF (p_message IS NULL OR LENGTH(TRIM(p_message)) = 0)
     AND (p_attachments IS NULL OR jsonb_array_length(p_attachments) = 0) THEN
    RAISE EXCEPTION 'El mensaje debe tener entre 1 y 1000 caracteres';
  END IF;

  -- Adjuntos: solo en una conversacion que ya existe (los archivos se suben
  -- a chat-attachments/{conversation_id}/...) y con la forma que genera el
  -- front: {path, type, filename}. Se guarda una copia limpia, sin claves extra.
  IF p_attachments IS NOT NULL AND jsonb_array_length(p_attachments) > 0 THEN
    IF p_conversation_id IS NULL THEN
      RAISE EXCEPTION 'Los adjuntos requieren una conversación existente';
    END IF;

    FOR v_att IN SELECT value FROM jsonb_array_elements(p_attachments) LOOP
      IF NOT COALESCE(
           jsonb_typeof(v_att) = 'object'
           AND jsonb_typeof(v_att->'path') = 'string'
           AND jsonb_typeof(v_att->'type') = 'string'
           AND jsonb_typeof(v_att->'filename') = 'string'
           AND (v_att->>'type') IN ('image', 'video', 'document', 'audio')
           AND (v_att->>'path') ~ ('^' || p_conversation_id::text || '/[^/]+$')
           AND (v_att->>'path') NOT LIKE '%..%'
           AND char_length(v_att->>'path') <= 300
           AND char_length(v_att->>'filename') <= 255,
           false) THEN
        RAISE EXCEPTION 'Adjunto inválido';
      END IF;
    END LOOP;

    SELECT jsonb_agg(
             jsonb_build_object('path', a.value->>'path', 'type', a.value->>'type', 'filename', a.value->>'filename')
             ORDER BY a.ordinality)
      INTO v_clean
      FROM jsonb_array_elements(p_attachments) WITH ORDINALITY AS a(value, ordinality);
  END IF;

  v_preview := CASE WHEN p_message IS NOT NULL AND LENGTH(TRIM(p_message)) > 0 THEN p_message ELSE '📎 Adjunto' END;

  SELECT user_id, business_name INTO v_vendor_user_id, v_vendor_business_name
  FROM vendors WHERE id = p_vendor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tienda no encontrada';
  END IF;

  v_is_buyer := (v_uid IS DISTINCT FROM v_vendor_user_id);

  IF p_conversation_id IS NOT NULL THEN
    SELECT buyer_id, vendor_id INTO v_buyer_id, v_conv_vendor_id
    FROM conversations WHERE id = p_conversation_id;

    IF NOT FOUND OR v_buyer_id IS NULL THEN
      RAISE EXCEPTION 'Conversación no encontrada';
    END IF;
    IF v_conv_vendor_id IS DISTINCT FROM p_vendor_id THEN
      RAISE EXCEPTION 'La conversación no corresponde a este vendor';
    END IF;
    IF v_uid IS DISTINCT FROM v_buyer_id AND v_uid IS DISTINCT FROM v_vendor_user_id THEN
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
    -- Sin conversation_id solo el comprador puede abrir una conversacion.
    -- El vendedor siempre responde dentro de una existente (antes caia en
    -- la de un comprador cualquiera de su tienda).
    IF NOT v_is_buyer THEN
      RAISE EXCEPTION 'Indica la conversación a la que respondes';
    END IF;

    v_buyer_id := v_uid;

    IF p_product_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id AND vendor_id = p_vendor_id) THEN
      RAISE EXCEPTION 'El producto no pertenece a esta tienda';
    END IF;

    INSERT INTO public.conversations (buyer_id, vendor_id, product_id, last_message, last_message_at, vendor_unread, buyer_unread)
    VALUES (v_buyer_id, p_vendor_id, p_product_id, v_preview, NOW(), 1, 0)
    ON CONFLICT (buyer_id, vendor_id, product_id) DO UPDATE
    SET last_message = v_preview,
        last_message_at = NOW(),
        vendor_unread = conversations.vendor_unread + 1
    RETURNING id INTO v_conversation_id;
  END IF;

  INSERT INTO public.chat_messages (conversation_id, sender_id, message, attachments)
  VALUES (v_conversation_id, v_uid, COALESCE(p_message, ''), v_clean)
  RETURNING id INTO v_message_id;

  IF v_is_buyer THEN
    PERFORM create_notification(
      v_vendor_user_id, 'new_message',
      'Nuevo mensaje de un comprador 💬',
      LEFT(v_preview, 80),
      '/mensajes',
      jsonb_build_object('is_from_vendor', false, 'message_preview', LEFT(v_preview, 80))
    );
  ELSE
    PERFORM create_notification(
      v_buyer_id, 'new_message',
      COALESCE(v_vendor_business_name, 'El vendedor') || ' te respondió 💬',
      LEFT(v_preview, 80),
      '/mensajes',
      jsonb_build_object('is_from_vendor', true, 'vendor_business_name', v_vendor_business_name, 'message_preview', LEFT(v_preview, 80))
    );
  END IF;

  RETURN v_message_id;
END;
$function$;


-- ============================================================
-- 6. validate_coupon: solo usuarios con sesion
-- ============================================================
-- Sin sesion se podia probar codigos de cupon ilimitadamente. La tabla
-- coupons no es legible directamente; esta RPC era la unica puerta.
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, integer) TO authenticated, service_role;


-- ============================================================
-- 7. push_subscriptions: endpoint solo de servicios push reales
-- ============================================================
-- El servidor hace POST a este endpoint (web-push). Sin validar, un usuario
-- podia guardar una URL interna o ajena y provocar peticiones desde el
-- servidor. Hosts permitidos: FCM (Chrome/Edge/Opera/Brave/Samsung),
-- Mozilla (Firefox), Apple (Safari/iOS) y Windows (Edge en Windows).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.push_subscriptions'::regclass AND conname = 'push_subscriptions_endpoint_check'
  ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_endpoint_check
      CHECK (
        char_length(endpoint) <= 2048
        AND endpoint ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/[^[:space:][:cntrl:]]*$'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.push_subscriptions'::regclass AND conname = 'push_subscriptions_keys_len_check'
  ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_keys_len_check
      CHECK (char_length(p256dh) BETWEEN 1 AND 200 AND char_length(auth) BETWEEN 1 AND 100);
  END IF;
END $$;


NOTIFY pgrst, 'reload schema';
