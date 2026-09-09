-- ═══════════════════════════════════════════════════════════
-- MercadoRD — products.sku / products.barcode + búsqueda
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- NOTA: esta migración documenta cambios ya aplicados directamente en
-- Supabase (vía MCP, mientras el acceso propio del usuario estaba
-- caído) -- no se ejecutó desde este archivo. Se agrega aquí solo
-- para que quede rastro en el repo (mismo motivo que 003/004/005).
--
-- Cambio: products gana dos columnas nuevas, universales (no son
-- atributos por categoría) y opcionales, sin validación de formato:
--   - sku text
--   - barcode text
-- Índice único parcial idx_products_vendor_sku(vendor_id, sku) WHERE
-- sku IS NOT NULL -- permite SKU repetido entre vendors distintos,
-- pero único dentro del catálogo de un mismo vendor; el WHERE evita
-- que dos productos con sku='' (guardado como NULL, nunca cadena
-- vacía, desde ProductForm.tsx) choquen entre sí.
--
-- search_products() (ver 004) se actualiza para matchear también por
-- sku/barcode con LOWER(...) = v_query_clean -- coincidencia exacta,
-- no ILIKE parcial como el resto de los campos.
--
-- Verificado en vivo (11 sep 2026): se guardó un SKU real en un
-- producto desde el formulario de vendor, y buscar ese SKU exacto en
-- la barra de búsqueda del sitio devolvió ese producto -- 1 resultado.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.products ADD COLUMN sku text;
ALTER TABLE public.products ADD COLUMN barcode text;

CREATE UNIQUE INDEX idx_products_vendor_sku ON products(vendor_id, sku) WHERE sku IS NOT NULL;

CREATE OR REPLACE FUNCTION public.search_products(
  p_query text DEFAULT NULL,
  p_category_id int DEFAULT NULL,
  p_vendor_id uuid DEFAULT NULL,
  p_min_price int DEFAULT NULL,
  p_max_price int DEFAULT NULL,
  p_min_rating numeric DEFAULT NULL,
  p_sort_by text DEFAULT 'relevance',
  p_limit int DEFAULT 24,
  p_offset int DEFAULT 0
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
        OR (v_query_clean IS NOT NULL AND LOWER(p.sku) = v_query_clean)
        OR (v_query_clean IS NOT NULL AND LOWER(p.barcode) = v_query_clean)
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
