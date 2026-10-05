-- ═══════════════════════════════════════════════════════════
-- MercadoRD — search_providers: ordenar por estadísticas reales
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- Ya aplicada en vivo por Jimmy. Dump literal del statement aplicado,
-- no reconstrucción -- mismo criterio que 019/035/036.
--
-- El orden anterior dependía de vendors.rating_avg, una columna
-- sembrada que nunca se actualiza. Ahora, después de verification_level,
-- ordena por vendor_real_stats: calificación real (solo con 5 o más
-- reseñas reales) y luego ventas reales. El único cambio respecto a la
-- versión anterior es la línea ORDER BY.

CREATE OR REPLACE FUNCTION public.search_providers(p_business_types business_type[] DEFAULT NULL::business_type[], p_category_ids integer[] DEFAULT NULL::integer[], p_services vendor_service[] DEFAULT NULL::vendor_service[], p_province_id integer DEFAULT NULL::integer, p_max_moq integer DEFAULT NULL::integer, p_min_verification_level integer DEFAULT NULL::integer, p_limit integer DEFAULT 30, p_offset integer DEFAULT 0)
 RETURNS SETOF vendors
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT v.* FROM public.vendors v
  WHERE v.onboarding_completed = true
    AND (p_business_types IS NULL OR EXISTS (
      SELECT 1 FROM vendor_business_types vbt
      WHERE vbt.vendor_id = v.id AND vbt.business_type = ANY(p_business_types)
    ))
    AND (p_category_ids IS NULL OR EXISTS (
      SELECT 1 FROM vendor_categories vc
      WHERE vc.vendor_id = v.id AND vc.category_id = ANY(p_category_ids)
    ))
    AND (p_services IS NULL OR EXISTS (
      SELECT 1 FROM vendor_services vs
      WHERE vs.vendor_id = v.id AND vs.service = ANY(p_services)
    ))
    AND (p_province_id IS NULL OR v.province_id = p_province_id)
    AND (p_max_moq IS NULL OR v.min_order_quantity IS NULL OR v.min_order_quantity <= p_max_moq)
    AND (p_min_verification_level IS NULL OR v.verification_level >= p_min_verification_level)
  ORDER BY v.verification_level DESC,
    (SELECT CASE WHEN s.real_rating_count >= 5 THEN s.real_rating_avg END
       FROM public.vendor_real_stats s WHERE s.vendor_id = v.id) DESC NULLS LAST,
    (SELECT s.real_total_sales FROM public.vendor_real_stats s WHERE s.vendor_id = v.id) DESC NULLS LAST,
    v.created_at DESC
  LIMIT LEAST(p_limit, 50) OFFSET p_offset;
END;
$function$;
