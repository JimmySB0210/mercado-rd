-- vendors.rating_avg y vendors.total_sales eran valores sembrados (demo), nunca mantenidos por ningún
-- proceso real. Desde la 039 estaban en NULL / 0 y el sitio lee vendor_real_stats. Verificado antes de
-- borrarlas: ningún código las lee y nada en la base depende de ellas (ensayo con rollback).
ALTER TABLE public.vendors DROP COLUMN rating_avg, DROP COLUMN total_sales;
