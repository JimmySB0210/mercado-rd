-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Estadísticas reales de vendedor (no sembradas)
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- vendors.total_sales y vendors.rating_avg son columnas DEFAULT 0
-- (migración 001) que ningún trigger ni función actualiza jamás —
-- confirmado revisando TODAS las migraciones: la única lógica de
-- rating real que existe (update_product_rating(), migración 001)
-- escribe en products.rating_avg/rating_count, nunca en vendors.
-- Aun así, vendors.total_sales/rating_avg se muestran en:
--   - la tarjeta de vendedor en /producto/[id]
--   - el perfil público de tienda (/tienda/[id])
--   - la grilla de inicio y "vendedores destacados"
--   - el directorio /tiendas (¡y además ORDENA por total_sales!)
--   - el resumen propio del vendedor en /dashboard
--   - la tabla de vendors en /admin
-- Un número que nunca cambia, presentado como si fuera real, es
-- exactamente el problema — esta vista lo reemplaza por un cálculo
-- real, sin necesidad de ningún trigger nuevo:
--
--   real_total_sales: SUM(products.sold_count) del vendedor —
--   sold_count YA es real y ya se mantiene solo (incrementa al crear
--   un pedido, decrementa al cancelarlo — create_order_from_cart y
--   trigger_restore_stock_on_cancellation, migraciones 015/014).
--   Sumar esa columna no requiere inventar ningún conteo nuevo.
--
--   real_rating_avg / real_rating_count: AVG/COUNT directo sobre
--   reviews.rating filtrado por vendor_id — reviews.vendor_id ya
--   existe y cada fila está atada a un pedido real y "delivered"
--   (validate_real_review(), migración 013), así que esto es
--   honesto por construcción.
--
-- Los 2 orígenes (products, reviews) se agregan en subconsultas
-- separadas ANTES del LEFT JOIN — unirlos directo multiplicaría
-- filas (un vendor con 5 productos y 10 reseñas daría 50 filas antes
-- de agregar) y el SUM/AVG saldría mal.
--
-- A propósito NO se filtra por products.is_active: un producto que
-- el vendor desactivó después de venderlo sigue habiendo sido una
-- venta real — igual que el propio sold_count no se resetea al
-- desactivar un producto.
--
-- Sin cambios de RLS: products (products_public_read) y reviews (se
-- lee público hoy mismo en /tienda/[id], comprobado en vivo aunque no
-- encontré su policy exacta en ningún archivo de migración — mismo
-- patrón de fixes aplicados directo en Supabase que order_items/
-- validate_real_review) — esta vista no expone ninguna fila que no
-- fuera ya visible una por una; solo suma/promedia lo que cualquiera
-- ya puede leer hoy.
--
-- WITH (security_invoker = true) — a propósito NO se usa acá.
-- Razón: con security_invoker, el LEFT JOIN a products respetaría la
-- policy de quien consulta — un visitante público solo ve
-- is_active = TRUE (products_public_read), pero el propio vendedor
-- consultando su dashboard también calificaría para
-- products_vendor_write (FOR ALL, sin filtro de is_active), así que
-- real_total_sales le mostraría un número distinto a él que a
-- cualquier otro visitante viendo la MISMA tienda — inconsistente
-- para una métrica de confianza pública que debe ser igual para
-- todos. Sin security_invoker, la vista corre con los permisos del
-- dueño (comportamiento estándar de las vistas en Postgres) y agrega
-- TODOS los productos del vendedor por igual sin importar is_active,
-- exactamente como ya hace su propio sold_count acumulado. No hay
-- riesgo de fuga: solo se exponen 3 números agregados por vendor_id,
-- nunca filas de products/reviews en sí.
--
-- reviews NO tiene ningún estado de ocultar/moderar — confirmado
-- revisando su definición completa (migración 001: id, user_id,
-- product_id, vendor_id, order_id, rating, comment, created_at) y
-- que ninguna migración posterior le agregó columnas. real_rating_avg/
-- real_rating_count agregan TODAS las filas de reviews porque no hay
-- ningún estado que excluir -- si en el futuro se agrega moderación,
-- este WHERE es el único lugar que haría falta tocar.
--
-- La vista expone exactamente 3 columnas por vendor_id
-- (real_total_sales, real_rating_avg, real_rating_count) — nunca una
-- fila de products o reviews en sí.
--
-- OJO: no pude correr get_advisors en esta sesión (el conector MCP de
-- Supabase está desconectado) — pedido explícitamente: correrlo
-- después de aplicar esta migración, o reconectar el MCP para que lo
-- corra yo.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.vendor_real_stats AS
SELECT
  v.id AS vendor_id,
  COALESCE(sales.total, 0) AS real_total_sales,
  COALESCE(ROUND(reviews_agg.avg_rating, 2), 0) AS real_rating_avg,
  COALESCE(reviews_agg.review_count, 0) AS real_rating_count
FROM public.vendors v
LEFT JOIN (
  SELECT vendor_id, SUM(sold_count) AS total
  FROM public.products
  GROUP BY vendor_id
) sales ON sales.vendor_id = v.id
LEFT JOIN (
  SELECT vendor_id, AVG(rating)::numeric AS avg_rating, COUNT(*) AS review_count
  FROM public.reviews
  GROUP BY vendor_id
) reviews_agg ON reviews_agg.vendor_id = v.id;
