-- ═══════════════════════════════════════════════════════════
-- MercadoRD — search_products acepta filtros a nivel de vendor
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- NOTA: esta migración documenta el estado ACTUAL de
-- search_products, ya aplicado directamente en Supabase por el
-- usuario -- no se ejecutó desde este archivo. Se agrega aquí solo
-- para que quede rastro en el repo (mismo patrón que 003/.../015).
--
-- Motivo: la pestaña "Productos" de /proveedores necesita los mismos
-- 6 filtros que el directorio de tiendas (search_providers) ya
-- soporta, pero aplicados sobre productos en vez de vendors.
-- search_products no tenía forma de filtrar por tipo de negocio,
-- servicios, MOQ ni nivel de verificación numérico del vendor dueño
-- del producto.
--
-- 4 parámetros nuevos, todos DEFAULT NULL (no rompen los callers
-- existentes en /buscar, SearchResultsGrid.tsx, SearchBar.tsx, que
-- siguen llamando el RPC con un objeto nombrado sin estas claves):
--   p_business_types text[]         -- EXISTS contra vendor_business_types
--   p_services text[]               -- EXISTS contra vendor_services
--   p_max_moq int                   -- v.min_order_quantity <= X (NULL nunca excluye vendors sin MOQ declarado)
--   p_min_verification_level int    -- v.verification_level >= X (numérico 0-4, no el
--                                       booleano p_verified_only ya existente -- ese
--                                       se deja intacto para no afectar /buscar)
--
-- p_category_id sigue siendo singular (a diferencia de
-- p_category_ids en search_providers) -- limitación conocida,
-- documentada en /proveedores/page.tsx.
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.search_products(
  p_query text DEFAULT NULL::text,
  p_category_id integer DEFAULT NULL::integer,
  p_vendor_id uuid DEFAULT NULL::uuid,
  p_min_price integer DEFAULT NULL::integer,
  p_max_price integer DEFAULT NULL::integer,
  p_min_rating numeric DEFAULT NULL::numeric,
  p_sort_by text DEFAULT 'relevance'::text,
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0,
  p_province_id integer DEFAULT NULL::integer,
  p_verified_only boolean DEFAULT false,
  p_min_reviews integer DEFAULT NULL::integer,
  p_business_types text[] DEFAULT NULL::text[],
  p_services text[] DEFAULT NULL::text[],
  p_max_moq integer DEFAULT NULL::integer,
  p_min_verification_level integer DEFAULT NULL::integer
)
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
    SELECT maps_to INTO v_synonyms FROM search_synonyms WHERE lower(unaccent(term)) = v_query_clean LIMIT 1;
    v_all_terms := ARRAY[v_query_clean];
    IF v_synonyms IS NOT NULL THEN v_all_terms := v_all_terms || v_synonyms; END IF;
  END IF;

  RETURN QUERY
  WITH matched AS (
    SELECT DISTINCT p.*
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    LEFT JOIN public.vendors v ON v.id = p.vendor_id
    WHERE p.is_active = true
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_vendor_id IS NULL OR p.vendor_id = p_vendor_id)
      AND (p_min_price IS NULL OR p.price_rdp >= p_min_price)
      AND (p_max_price IS NULL OR p.price_rdp <= p_max_price)
      AND (p_min_rating IS NULL OR p.rating_avg >= p_min_rating)
      AND (p_province_id IS NULL OR v.province_id = p_province_id)
      AND (p_verified_only IS NOT TRUE OR v.is_verified = true)
      AND (p_min_reviews IS NULL OR (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) >= p_min_reviews)
      AND (p_business_types IS NULL OR EXISTS (
        SELECT 1 FROM vendor_business_types vbt WHERE vbt.vendor_id = v.id AND vbt.business_type::text = ANY(p_business_types)
      ))
      AND (p_services IS NULL OR EXISTS (
        SELECT 1 FROM vendor_services vs WHERE vs.vendor_id = v.id AND vs.service::text = ANY(p_services)
      ))
      AND (p_max_moq IS NULL OR v.min_order_quantity IS NULL OR v.min_order_quantity <= p_max_moq)
      AND (p_min_verification_level IS NULL OR v.verification_level >= p_min_verification_level)
      AND (
        v_all_terms IS NULL
        OR EXISTS (SELECT 1 FROM unnest(v_all_terms) AS t WHERE unaccent(p.name) ILIKE '%' || t || '%')
        OR EXISTS (SELECT 1 FROM unnest(v_all_terms) AS t WHERE unaccent(COALESCE(p.description, '')) ILIKE '%' || t || '%')
        OR EXISTS (SELECT 1 FROM unnest(v_all_terms) AS t WHERE unaccent(COALESCE(c.name, '')) ILIKE '%' || t || '%' OR unaccent(COALESCE(c.slug, '')) ILIKE '%' || t || '%')
        OR (v_query_clean IS NOT NULL AND LOWER(p.sku) = v_query_clean)
        OR (v_query_clean IS NOT NULL AND LOWER(p.barcode) = v_query_clean)
        OR (v_query_clean IS NOT NULL AND to_tsvector('spanish', unaccent(COALESCE(p.name, '') || ' ' || COALESCE(p.description, ''))) @@ plainto_tsquery('spanish', unaccent(v_query_clean)))
      )
  )
  SELECT matched.* FROM matched
  ORDER BY
    CASE WHEN p_sort_by = 'price_asc' THEN matched.price_rdp END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'price_desc' THEN matched.price_rdp END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'rating' THEN matched.rating_avg END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'newest' THEN matched.published_at END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'sales' THEN matched.sold_count END DESC,
    CASE WHEN p_sort_by = 'popularity' THEN (SELECT COUNT(*) FROM product_view_history pvh WHERE pvh.product_id = matched.id) END DESC,
    matched.sold_count DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;
