-- =========================================================
-- MercadoRD — Lote C-3b
-- gift_list_items: el navegador deja de poder leer quién compró cada
-- regalo (purchased_by), y el dueño de la lista solo puede cambiar la
-- prioridad de sus ítems (no puede marcarlos como comprados ni moverlos
-- a otra lista).
-- Requiere que el front ya lea purchased_at en lugar de purchased_by.
-- =========================================================

-- ---------------------------------------------------------
-- 1) Lectura: solo las columnas que usa el front. purchased_by queda
--    fuera para anon y authenticated; la escribe create_gift_order
--    (SECURITY DEFINER), que no depende de estos permisos.
--    Quien pida SELECT * sobre esta tabla recibirá "permission denied":
--    hay que listar las columnas.
-- ---------------------------------------------------------
REVOKE SELECT ON public.gift_list_items FROM anon, authenticated;
GRANT SELECT (id, gift_list_id, product_id, priority, purchased_at, added_at)
  ON public.gift_list_items TO anon, authenticated;

-- ---------------------------------------------------------
-- 2) Escritura del dueño de la lista: insertar con (gift_list_id,
--    product_id, priority) y modificar solo priority. Borrar no cambia.
-- ---------------------------------------------------------
REVOKE INSERT, UPDATE ON public.gift_list_items FROM authenticated;
GRANT INSERT (gift_list_id, product_id, priority) ON public.gift_list_items TO authenticated;
GRANT UPDATE (priority) ON public.gift_list_items TO authenticated;

NOTIFY pgrst, 'reload schema';
