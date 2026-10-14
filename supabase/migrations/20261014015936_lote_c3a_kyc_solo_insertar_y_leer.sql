-- =========================================================
-- MercadoRD — Lote C-3a
-- Documentos de identidad (KYC): el dueño solo puede subir y leer los
-- suyos. No puede modificarlos ni borrarlos, así la copia queda como
-- evidencia si hay una infracción. El admin conserva el acceso total.
-- =========================================================

-- ---------------------------------------------------------
-- 1) Dueño: subir en su propia carpeta (identity-documents/<su uid>/…).
--    La lectura de su propia carpeta se conserva porque el flujo de
--    subida (INSERT ... RETURNING) necesita una política SELECT que
--    cubra la fila nueva. La comparación es por texto para que una
--    carpeta que no sea un UUID no provoque un error de conversión.
-- ---------------------------------------------------------
CREATE POLICY identity_documents_owner_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'identity-documents'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY identity_documents_owner_read
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'identity-documents'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- ---------------------------------------------------------
-- 2) Admin: acceso total al bucket (leer, subir, modificar, borrar).
-- ---------------------------------------------------------
CREATE POLICY identity_documents_admin_all
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'identity-documents' AND public.is_admin())
  WITH CHECK (bucket_id = 'identity-documents' AND public.is_admin());

-- ---------------------------------------------------------
-- 3) La política original (identity_documents_owner_access, FOR ALL para
--    el dueño o el admin) deja de conceder acceso. Se deja en su lugar con
--    condición falsa, igual que chat_attachments_participant_access en el
--    Lote B (el rol de migraciones no puede renombrar políticas de
--    storage.objects). Se puede borrar a mano desde Storage → Policies
--    sin cambiar el comportamiento.
-- ---------------------------------------------------------
ALTER POLICY identity_documents_owner_access
  ON storage.objects
  USING (false)
  WITH CHECK (false);
