-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Pausar productos de prueba activos en producción
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════
-- CORREGIDO contra la BD viva: is_active NO es una columna escribible
-- directo — es GENERATED ALWAYS AS (status = 'published'), derivada
-- del enum real de status (draft | published | paused). Un
-- `UPDATE ... SET is_active = false` falla de entrada. El cambio real
-- es sobre status, no sobre is_active.
--
-- 'paused', no 'draft': estos productos SÍ se publicaron de verdad (no
-- son borradores que nunca vieron la luz) — pausarlos es la
-- descripción honesta del estado, y is_active pasa a false como
-- consecuencia automática de la columna generada, sin tocarla.
--
-- 10 productos de prueba en total (confirmado contra la BD viva,
-- sep-2026): 4 ya estaban pausados/inactivos (iPhone Test Playwright,
-- Corolla Test VIN, TEST Gorras Final, TEST Smartphones Final) y no se
-- tocan acá. Estos 6 seguían status = 'published' (confirmado
-- independientemente contra la BD viva), visibles en búsqueda, grillas
-- de inicio y el directorio público:
--   - libro
--   - f1
--   - pintura de juanete pablo duarte
--   - poloche                          (0 order_items)
--   - Mesa Control Playwright 1786415218704
--   - Galaxy Test Completo 1786417191988  (4 order_items reales de prueba)
--
-- Solo cambia status -- reversible, no borra ninguna fila. El borrado
-- real queda para antes del lanzamiento, en una migración aparte (ver
-- plan de FKs), y Galaxy Test Completo se queda pausado hasta que sus
-- 4 pedidos de prueba se limpien primero.
-- ═══════════════════════════════════════════════════════════

UPDATE public.products
SET status = 'paused'
WHERE id IN (
  'f4ca2603-7822-4018-8bee-bb5b69957594', -- libro
  '3e8216b7-d69b-4e2e-affd-e877a2cd5f55', -- f1
  'e2ab917a-f35a-4493-87f9-f982e48e2031', -- pintura de juanete pablo duarte
  'da38c40d-b6fb-4346-b1df-c69908850fd1', -- poloche
  'bc2168cd-3e7e-4bf4-a7ee-ce57e92c7841', -- Mesa Control Playwright 1786415218704
  '7bb050ec-7cba-4acb-90a1-61e673c9c3cf'  -- Galaxy Test Completo 1786417191988
);
