// ============================================================
// MercadoRD — Estadísticas reales de vendedores en lote
// Ruta: src/lib/queries/vendorRealStatsBatch.ts
// ============================================================
// Reemplaza vendors.rating_avg/total_sales (sembrados, nunca
// actualizados) en las listas de tiendas. Lee vendor_real_stats con
// .in('vendor_id', ids): una consulta por cada 50 ids como máximo,
// nunca una por vendedor (sin N+1).
//
// Usa createPublicClient (anónimo, sin cookies): la vista ya se lee sin
// sesión en la página pública de tienda, y así el mismo helper sirve a
// Server Components y a Client Components.
//
// Un vendedor sin fila en la vista no aparece en el mapa, y tampoco si
// la consulta falla. Quien lo muestra debe tratar la ausencia como
// "sin dato", nunca como 0. Los umbrales de display (5 reseñas para la
// calificación, más de 0 para las ventas) los aplica cada componente.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'

export const VENDOR_STATS_BATCH_SIZE = 50

export interface VendorRealStats {
  realTotalSales: number
  realRatingAvg: number | null
  realRatingCount: number
}

export type VendorRealStatsMap = Record<string, VendorRealStats>

export interface VendorRealStatsRow {
  vendor_id: string
  real_total_sales: number | null
  real_rating_avg: number | null
  real_rating_count: number | null
}

export function toVendorRealStats(row: VendorRealStatsRow): VendorRealStats {
  return {
    realTotalSales: Number(row.real_total_sales ?? 0),
    realRatingAvg: row.real_rating_avg == null ? null : Number(row.real_rating_avg),
    realRatingCount: Number(row.real_rating_count ?? 0),
  }
}

export async function getVendorRealStatsBatch(vendorIds: string[]): Promise<VendorRealStatsMap> {
  const ids = [...new Set(vendorIds)]
  const map: VendorRealStatsMap = {}
  if (ids.length === 0) return map

  const supabase = createPublicClient()
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += VENDOR_STATS_BATCH_SIZE) {
    chunks.push(ids.slice(i, i + VENDOR_STATS_BATCH_SIZE))
  }

  const results = await Promise.all(chunks.map(chunk =>
    supabase
      .from('vendor_real_stats')
      .select('vendor_id, real_total_sales, real_rating_avg, real_rating_count')
      .in('vendor_id', chunk)
  ))

  for (const { data, error } of results) {
    if (error) { console.error('[getVendorRealStatsBatch]', error); continue }
    for (const row of (data ?? []) as VendorRealStatsRow[]) {
      map[row.vendor_id] = toVendorRealStats(row)
    }
  }

  return map
}
