-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Lote D: cerrar la escritura de `payments` al navegador
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Hallazgo (revisión del checkout, oct-2026): la política
-- `payments_system_insert` deja que CUALQUIER comprador autenticado inserte,
-- sobre sus propios pedidos, filas de `payments` con el status, el monto, el
-- método, el azul_order_id, el auth_code y el raw_response que él quiera.
-- Hasta ahora lo usaba el propio navegador (checkout/page.tsx) para guardar
-- un «approved» que sale de un cobro simulado en el navegador. Es decir: el
-- comprador puede fabricar el comprobante de un pago.
--
-- Qué hace esta migración:
--   · Elimina esa política y quita los permisos de escritura de los roles de
--     la API. `payments` queda como el resto de las tablas de dinero del
--     proyecto (orders, vendor_subscriptions): solo la escribe el servidor
--     (service_role o funciones SECURITY DEFINER).
--   · El comprador dueño del pedido y el administrador siguen LEYENDO
--     (política payments_owner_read, sin cambios): el panel de admin
--     («Pagos por método» y «Pagos por estado») sigue funcionando.
--   · anon pierde todo acceso a la tabla (nunca lo necesitó).
--
-- Compatibilidad con el front: el checkout publicado hasta ahora intenta ese
-- insert y, si falla, solo escribe un console.error y sigue (el pedido ya
-- está creado). Aplicar esto antes o después del push del front no rompe el
-- checkout; el front nuevo ya no hace el insert.
--
-- NO toca record_payment: esa función sigue sin poder usarse (exige
-- auth.uid() = dueño del pedido y solo service_role puede ejecutarla, así que
-- ningún rol la completa con éxito). La función que confirma pagos reales se
-- escribe junto con la integración de Azul del lado del servidor.
--
-- Probada con rollback contra la base real antes de aplicarse: el comprador ya no
-- puede insertar, modificar ni borrar pagos; el dueño del pedido y el admin siguen
-- leyendo; el servidor (service_role) sigue pudiendo insertar.
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS payments_system_insert ON public.payments;

REVOKE ALL ON public.payments FROM anon, authenticated;
GRANT SELECT ON public.payments TO authenticated;

COMMENT ON TABLE public.payments IS
  'Registro de pagos. Solo lo escribe el servidor (service_role o funciones SECURITY DEFINER); el comprador dueño del pedido y el admin solo leen. No devolver INSERT/UPDATE/DELETE a authenticated: permitiría fabricar comprobantes de pago.';
