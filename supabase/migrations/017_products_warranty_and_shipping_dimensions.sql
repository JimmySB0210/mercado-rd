-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Garantía y dimensiones de envío en products
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- 5 columnas nuevas, todas nullable — puramente aditivo, sin tocar
-- filas existentes, RLS, ni ningún otro trigger/política de products.
--
-- warranty: texto libre declarado por el vendor, SIN verificación del
-- sistema. El formulario ofrece presets (Sin garantía/7 días/30 días/
-- 90 días/6 meses/1 año/Otra) pero se guarda como texto simple, igual
-- que unit_label en product_pricing_tiers -- no es un enum de Postgres
-- a propósito, porque "Otra" necesita texto arbitrario.
--
-- weight_kg / length_cm / width_cm / height_cm: por ahora NO alimentan
-- ningún cálculo de envío real -- el costo de envío hoy se calcula por
-- provincia de destino (shipping_rates), nunca por peso/dimensiones del
-- producto. Se guardan como referencia para cuando exista esa lógica;
-- el formulario deja esto explícito al vendor (sección "Envío" marcada
-- como informativa).
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS warranty text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_kg numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS length_cm numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS width_cm numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS height_cm numeric;
