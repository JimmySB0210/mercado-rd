-- ═══════════════════════════════════════════════════════════
-- MercadoRD — search_products: filtros, orden y paginación real
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- NOTA: esta migración documenta el estado ACTUAL de
-- search_products, ya aplicado directamente en Supabase — no se
-- ejecutó desde este archivo. Se agrega aquí solo para que quede
-- rastro en el repo de un cambio hecho fuera de la migración 001
-- inicial (mismo problema de drift que tuvimos con
-- create_order_from_cart, documentado en 003).
--
-- Cambio: search_products() pasa de aceptar solo p_query a aceptar
-- también p_category_id, p_vendor_id, p_min_price, p_max_price,
-- p_min_rating, p_sort_by ('relevance' default / 'price_asc' /
-- 'price_desc' / 'rating' / 'newest' / 'sales' / 'popularity'), y
-- p_limit/p_offset — la paginación ahora es real en el servidor
-- (antes p_query era el único parámetro y la función devolvía todos
-- los resultados de una sola llamada).
--
-- 'newest' ordena por products.published_at (no created_at).
-- 'sales' ordena por sold_count. 'popularity' es una señal distinta
-- de 'sales': cuenta filas de product_view_history por producto —
-- antes de este cambio, "ventas" y "popularidad" eran indistinguibles
-- en el código (ninguna de las dos existía como sort real).
--
-- El matching de texto: unaccent + LOWER sobre el término, más
-- búsqueda de sinónimos en una tabla search_synonyms (term -> maps_to
-- text[]) — si el término tiene sinónimos mapeados, también se buscan
-- esos. Compara contra name/description/categoría (ILIKE sobre
-- columnas con unaccent aplicado) y además contra un tsvector
-- ('spanish', name || description) vía plainto_tsquery como señal
-- adicional (no como filtro exclusivo — es un OR más en la condición).
--
-- ADVERTENCIA: esta función depende de la extensión `unaccent` y de
-- una tabla `search_synonyms` que tampoco están documentadas en
-- ningún archivo de este repo (no aparecen en 001_initial_schema.sql
-- ni en migraciones posteriores) — existen solo como objetos ya
-- aplicados en Supabase. No se documentan aquí porque no tengo su
-- definición exacta (CREATE EXTENSION / CREATE TABLE) — pendiente de
-- agregar en una migración aparte si se quiere cerrar ese hueco.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.search_products(p_query text DEFAULT NULL::text, p_category_id integer DEFAULT NULL::integer, p_vendor_id uuid DEFAULT NULL::uuid, p_min_price integer DEFAULT NULL::integer, p_max_price integer DEFAULT NULL::integer, p_min_rating numeric DEFAULT NULL::numeric, p_sort_by text DEFAULT 'relevance'::text, p_limit integer DEFAULT 24, p_offset integer DEFAULT 0)
 RETURNS SETOF products
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_query_clean text;
  v_synonyms text[];
  v_all_terms text[];
BEGIN
  IF p_query IS NOT NULL AND TRIM(p_query) != '' THEN
    v_query_clean := LOWER(TRIM(unaccent(p_query)));

    SELECT maps_to INTO v_synonyms
    FROM search_synonyms
    WHERE lower(unaccent(term)) = v_query_clean
    LIMIT 1;

    v_all_terms := ARRAY[v_query_clean];
    IF v_synonyms IS NOT NULL THEN
      v_all_terms := v_all_terms || v_synonyms;
    END IF;
  END IF;

  RETURN QUERY
  WITH matched AS (
    SELECT DISTINCT p.*
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE p.is_active = true
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_vendor_id IS NULL OR p.vendor_id = p_vendor_id)
      AND (p_min_price IS NULL OR p.price_rdp >= p_min_price)
      AND (p_max_price IS NULL OR p.price_rdp <= p_max_price)
      AND (p_min_rating IS NULL OR p.rating_avg >= p_min_rating)
      AND (
        v_all_terms IS NULL
        OR EXISTS (
          SELECT 1 FROM unnest(v_all_terms) AS t
          WHERE unaccent(p.name) ILIKE '%' || t || '%'
        )
        OR EXISTS (
          SELECT 1 FROM unnest(v_all_terms) AS t
          WHERE unaccent(COALESCE(p.description, '')) ILIKE '%' || t || '%'
        )
        OR EXISTS (
          SELECT 1 FROM unnest(v_all_terms) AS t
          WHERE unaccent(COALESCE(c.name, '')) ILIKE '%' || t || '%'
          OR unaccent(COALESCE(c.slug, '')) ILIKE '%' || t || '%'
        )
        OR (
          v_query_clean IS NOT NULL AND
          to_tsvector('spanish', unaccent(COALESCE(p.name, '') || ' ' || COALESCE(p.description, '')))
            @@ plainto_tsquery('spanish', unaccent(v_query_clean))
        )
      )
  )
  SELECT matched.* FROM matched
  ORDER BY
    CASE WHEN p_sort_by = 'price_asc' THEN matched.price_rdp END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price_desc' THEN matched.price_rdp END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'rating' THEN matched.rating_avg END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'newest' THEN matched.published_at END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'sales' THEN matched.sold_count END DESC,
    CASE WHEN p_sort_by = 'popularity' THEN
      (SELECT COUNT(*) FROM product_view_history pvh WHERE pvh.product_id = matched.id)
    END DESC,
    matched.sold_count DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;
