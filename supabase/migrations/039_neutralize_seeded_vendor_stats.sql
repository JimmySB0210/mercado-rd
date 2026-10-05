-- vendors.rating_avg y vendors.total_sales eran valores sembrados (demo), nunca actualizados por
-- ningún proceso real. El sitio ya no los lee (usa vendor_real_stats; verificado en producción con
-- el commit 0fddc89). Se dejan en NULL / 0 para que ningún lector olvidado pueda mostrar cifras
-- inventadas. La eliminación de las columnas queda para más adelante.
UPDATE public.vendors SET rating_avg = NULL, total_sales = 0;
