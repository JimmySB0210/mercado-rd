'use client'
// ============================================================
// MercadoRD — Wizard de Configuración, paso 9: Vista previa
// Ruta: src/components/vendor/settings/VendorStorePreviewStep.tsx
// ============================================================
// Reusa el componente REAL del perfil público (VendorStoreContent),
// igual que ProductForm.tsx hace con ProductPageContent en su último
// paso -- nunca una mini-tarjeta inventada. Se re-consulta cada vez
// que se entra a este paso (no se cachea) para no quedar desactualizado
// si el vendor edita otro paso y vuelve.
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchVendorStorePreviewData, type VendorStorePreviewData } from '@/lib/queries/vendorStorePreviewClient'
import { VendorStoreContent } from '@/app/tienda/[id]/VendorStoreContent'

interface Props {
  vendorId: string
  completenessPercent: number
}

export function VendorStorePreviewStep({ vendorId, completenessPercent }: Props) {
  const [data, setData] = useState<VendorStorePreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    const supabase = createClient()
    fetchVendorStorePreviewData(supabase, vendorId).then(result => {
      if (cancelled) return
      if (!result) { setLoadError(true); setLoading(false); return }
      setData(result)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [vendorId])

  return (
    <div>
      <div style={{
        padding: '12px 16px', borderRadius: 10, marginBottom: 16,
        background: completenessPercent >= 100 ? '#E6F6F0' : '#FFF8E6',
        border: `1px solid ${completenessPercent >= 100 ? '#B7E4D3' : '#F5E3A8'}`,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: completenessPercent >= 100 ? '#00714A' : '#8A6400' }}>
          {completenessPercent >= 100
            ? '✓ Tu perfil está 100% completo'
            : `Tu perfil está ${completenessPercent}% completo`}
        </p>
        <p style={{ fontSize: 12, margin: '4px 0 0', color: '#666' }}>
          Así verán tu tienda los compradores en MercadoRD.
        </p>
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', maxHeight: 640, overflowY: 'auto', background: '#f5f5f5' }}>
        {loading && (
          <div style={{ padding: 48, textAlign: 'center', color: '#999', fontSize: 13 }}>Cargando vista previa...</div>
        )}
        {loadError && !loading && (
          <div style={{ padding: 48, textAlign: 'center', color: '#c00', fontSize: 13 }}>No se pudo cargar la vista previa. Intenta de nuevo.</div>
        )}
        {data && !loading && (
          <VendorStoreContent
            vendor={data.vendor}
            productsWithVendor={data.productsWithVendor}
            reviews={data.reviews}
            realRatingAvg={data.realRatingAvg}
            realTotalSales={data.realTotalSales}
            realRatingCount={data.realRatingCount}
            businessTypes={data.businessTypes}
            vendorCategories={data.vendorCategories}
            services={data.services}
            targetCustomers={data.targetCustomers}
            showsManufacturing={data.showsManufacturing}
            hasProviderInfo={data.hasProviderInfo}
            memberSinceRaw={data.memberSinceRaw}
          />
        )}
      </div>
    </div>
  )
}
