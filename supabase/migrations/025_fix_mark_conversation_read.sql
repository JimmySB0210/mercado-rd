-- ═══════════════════════════════════════════════════════════
-- MercadoRD — mark_conversation_read: verificar dueño real
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- OJO — reconstruida, no es un dump literal de pg_get_functiondef().
-- Firma confirmada por su único llamador real
-- (mensajes/[id]/page.tsx: supabase.rpc('mark_conversation_read',
-- { p_conversation_id })) -- un solo parámetro, sin flag de "soy
-- comprador o vendedor": eso se determina ADENTRO comparando
-- auth.uid() contra conversations.buyer_id y vendors.user_id, nunca
-- confiando en lo que el cliente cree que es.
--
-- Antes: sin este chequeo, cualquier usuario autenticado podía pasar
-- CUALQUIER conversation_id y resetear el contador de no-leídos de
-- una conversación ajena (comprador o vendedor).
--
-- CORREGIDO (revisión previa de esta misma migración se había comido
-- una pieza real): también marca chat_messages.is_read = true para
-- los mensajes de la OTRA persona en esa conversación -- solo en la
-- rama donde auth.uid() sí es el comprador o el vendedor real, nunca
-- en la rama "ni uno ni el otro". sender_id != auth.uid() para no
-- marcar como leídos los propios mensajes de quien llama.
--
-- Confirmado por grep en todo el frontend: chat_messages.is_read HOY
-- no se lee ni se muestra en ningún lado (ni un "✓✓ visto", nada) --
-- mensajes/[id]/page.tsx ni siquiera lo selecciona de chat_messages.
-- O sea que si este UPDATE se hubiera perdido, el descuido habría sido
-- completamente invisible en el producto tal como está hoy -- no hay
-- ninguna UI que dependa de esta columna todavía. Sí importa para
-- cuando exista un indicador de "visto", o para soporte/disputas que
-- puedan necesitar probar que un mensaje fue leído.
--
-- Caso "ni comprador ni vendedor de esta conversación" -> RETURN
-- silencioso (no RAISE) y SIN tocar chat_messages -- para no
-- confirmarle a un usuario cualquiera si un conversation_id existe o
-- no, y para no marcar como leídos mensajes de una conversación ajena.
-- Verificar contra pg_get_functiondef() antes de aplicar.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_buyer_id uuid;
  v_vendor_user_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT c.buyer_id, v.user_id INTO v_buyer_id, v_vendor_user_id
  FROM conversations c
  JOIN vendors v ON v.id = c.vendor_id
  WHERE c.id = p_conversation_id;

  IF v_buyer_id IS NULL THEN
    RETURN; -- la conversación no existe: no hacer nada
  END IF;

  IF auth.uid() = v_buyer_id THEN
    UPDATE chat_messages
    SET is_read = true
    WHERE conversation_id = p_conversation_id AND sender_id != auth.uid();

    UPDATE conversations SET buyer_unread = 0 WHERE id = p_conversation_id;
  ELSIF auth.uid() = v_vendor_user_id THEN
    UPDATE chat_messages
    SET is_read = true
    WHERE conversation_id = p_conversation_id AND sender_id != auth.uid();

    UPDATE conversations SET vendor_unread = 0 WHERE id = p_conversation_id;
  ELSE
    RETURN; -- ni comprador ni vendedor de esta conversación: no hacer nada
  END IF;
END;
$function$;
