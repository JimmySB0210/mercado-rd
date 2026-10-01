-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Corregir products.sold_count sembrado (una sola vez)
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Verificado en vivo (2 sesiones autenticadas reales, Carlos/TechZone
-- RD y María/Moda Dominicana) antes de construir la vista
-- vendor_real_stats encima de esta columna: sold_count NO coincide
-- con order_items real, ni de lejos —
--   Camiseta Estampada Bandera RD: sembrado 96, real ~9-11
--   Café Induban Molido 400g:      sembrado 104, real 5
--   Canasta Surtida Navideña:      sembrado 23, real 2
--   iPhone 15 128GB Desbloqueado:  sembrado 45, real 1
--   Galaxy Test Completo (producto de prueba, sin seed): sembrado 4, real 4 -- coincide exacto
--
-- Explicación: a diferencia de products.rating_avg (que SÍ se
-- autocorrige, porque update_product_rating recalcula el promedio
-- completo desde reviews en cada insert/update), sold_count nunca se
-- recalcula desde cero — se INCREMENTA nada más. Un valor sembrado
-- arbitrario como punto de partida queda ahí para siempre, sumándose
-- sobre una base falsa en vez de corregirse solo.
--
-- QUÉ SUMA/RESTA sold_count hoy, y de dónde sale cada pieza:
--   (a) create_order_from_cart (migración 015, texto completo en este
--       repo): `sold_count = sold_count + cantidad` en el momento de
--       crear la orden, sin importar su status inicial ('pending').
--   (b) accept_chat_quote (migración 009, texto completo en este
--       repo, línea `UPDATE products SET ... sold_count = sold_count +
--       v_quote.quantity`): un pedido nacido de una cotización por
--       chat (RFQ) SUMA exactamente igual, por un camino de código
--       distinto pero escribiendo en las mismas tablas orders/
--       order_items — el recálculo de abajo cubre ambos caminos
--       porque lee esas tablas directo, no reimplementa la lógica de
--       ninguna función.
--   (c) trigger_restore_stock_on_cancellation (migración 014):
--       RESTA cuando un pedido pasa a 'cancelled'. OJO — esta migración
--       014 tal cual está en el repo es solo un comentario
--       descriptivo; el CREATE TRIGGER real se aplicó directo en
--       Supabase y su SQL exacto nunca quedó capturado en ningún
--       archivo de este repo (mismo patrón no documentado que la
--       policy real de order_items o el RLS real de reviews). No
--       puedo citar su texto literal. Lo que SÍ tengo, y en lo que se
--       basa el recálculo de abajo:
--         - La descripción de la migración 014: "AFTER UPDATE OF
--           status ON orders ... devuelve stock/corrige sold_count
--           cuando un pedido pasa a 'cancelled'".
--         - Verificación en vivo propia (esta sesión): cancelé un
--           pedido real de 1 unidad vía /dashboard/pedidos y
--           confirmé sold_count 97 → 96, stock 39 → 40 — un
--           decremento de exactamente 1, simétrico al incremento
--           original.
--       Si el trigger tuviera algún caso borde no documentado (ej.
--       qué pasa si un pedido pasa de 'cancelled' de vuelta a otro
--       estado), este recálculo no lo reproduciría — pero como es un
--       ajuste de una sola vez sobre el estado ACTUAL de orders/
--       order_items (no una simulación del historial de cambios de
--       status), el resultado final coincide con "cuánto se vendió
--       de verdad, según el status de cada pedido ahora mismo" sin
--       importar cuántas veces cambió de estado en el camino.
--
-- Este UPDATE es una corrección de una sola vez: recalcula sold_count
-- desde el historial real de order_items (pedidos cuyo status actual
-- no es 'cancelled'), y a partir de acá el trigger/RPC existente lo
-- sigue manteniendo bien — no cambia create_order_from_cart,
-- accept_chat_quote ni ningún trigger, solo corrige el número de
-- partida.
-- ═══════════════════════════════════════════════════════════

UPDATE public.products p
SET sold_count = COALESCE(real_sold.total, 0)
FROM (
  SELECT oi.product_id, SUM(oi.quantity) AS total
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.status != 'cancelled'
  GROUP BY oi.product_id
) real_sold
WHERE p.id = real_sold.product_id;

-- Productos sin NINGÚN pedido real (ni siquiera en real_sold) quedan
-- en 0 explícitamente -- antes tenían un número sembrado > 0 sin
-- ningún order_item detrás.
UPDATE public.products p
SET sold_count = 0
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.product_id = p.id AND o.status != 'cancelled'
);

-- ─── products.rating_avg / rating_count ────────────────────────────
-- A diferencia de sold_count, ESTOS dos campos SÍ se autocorrigen
-- (update_product_rating, migración 001, dispara en cada INSERT/UPDATE
-- de reviews y recalcula el promedio COMPLETO desde cero, no lo
-- incrementa) — en teoría no deberían tener el mismo problema. Lo
-- verifiqué en vivo antes de asumirlo: consulté reviews público (22
-- productos, 1 sola reseña real en toda la base, la de Camiseta
-- Estampada Bandera RD) contra products.rating_avg/rating_count de
-- los 22 — los 21 productos sin reseñas reales ya tienen rating_avg
-- NULL/rating_count 0, y el único con 1 reseña real ya muestra
-- exactamente rating_avg 5 / rating_count 1. No encontré ningún caso
-- roto. Aun así, se incluye este recálculo (mismo cálculo exacto que
-- update_product_rating, aplicado a los 22 productos, no solo a los
-- que ya tienen filas en reviews) como corrección defensiva —  no
-- tiene costo real ya que hoy es un no-op, y deja canonizado que
-- rating_avg/rating_count SIEMPRE reflejan reviews real, nunca un
-- valor sembrado, sin depender de que algún día llegue una reseña
-- nueva para "activarse".
UPDATE public.products p
SET
  rating_avg = ratings.avg_rating,
  rating_count = COALESCE(ratings.review_count, 0)
FROM (
  SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
  FROM public.reviews
  GROUP BY product_id
) ratings
WHERE p.id = ratings.product_id;

UPDATE public.products p
SET rating_avg = NULL, rating_count = 0
WHERE NOT EXISTS (SELECT 1 FROM public.reviews r WHERE r.product_id = p.id);
