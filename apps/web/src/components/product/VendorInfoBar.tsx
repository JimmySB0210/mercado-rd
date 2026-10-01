'use client'
// ============================================================
// MercadoRD — Barra de vendedor a ancho completo (página de producto)
// Ruta: src/components/product/VendorInfoBar.tsx
// ============================================================
// Vive entre el grid principal (galería/info/confianza) y las
// pestañas — reemplaza la mini-tarjeta angosta que antes vivía en la
// columna de confianza.
//
// rating/response ya NO se piden acá adentro: ProductPageContent.tsx
// llama a useVendorTrustStats UNA sola vez y los pasa como props —
// tanto a este componente como a VendorRatingOverview.tsx ("Conoce a
// {vendedor}", más abajo en la página), que repite esta misma fila de
// datos a propósito. Si cada uno llamara al hook por su cuenta, serían
// 6 llamadas RPC en vez de 3 para la misma info en la misma carga de
// página. Nunca vendor.rating_avg/total_sales, confirmados
// sembrados/no actualizados en la auditoría de seguridad. Sin conteo
// de "seguidores": no existe ningún concepto de seguir a un vendedor
// en el schema (sin tabla, sin RPC) — mostrarlo sería inventar un dato.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import type { VendorRatingData, VendorResponseData } from '@/lib/hooks/useVendorTrustStats'
import { VendorStatsLine } from '@/components/product/VendorStatsLine'

interface Props {
  vendorId: string
  businessName: string
  logoUrl?: string | null
  isVerified: boolean
  // Conteo real de productos activos del vendedor (query en page.tsx,
  // nunca el largo de un array ya limitado/paginado).
  productCount: number
  // vendor_services.service = 'national_shipping' para este vendedor —
  // real, no asumido.
  shipsNationwide: boolean
  // Resueltos una sola vez en ProductPageContent.tsx vía
  // useVendorTrustStats — ver nota de arriba.
  rating: VendorRatingData | null
  response: VendorResponseData | null
  showRating: boolean
  showResponse: boolean
}

export function VendorInfoBar({
  vendorId, businessName, logoUrl, isVerified, productCount, shipsNationwide,
  rating, response, showRating, showResponse,
}: Props) {
  const { t } = useTranslation('products')

  return (
    <div
      className="bg-[var(--color-card-bg)] mt-6 p-4 sm:p-5"
      style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center flex-shrink-0 overflow-hidden font-bold text-gray-400 text-lg"
            style={{ width: 56, height: 56, borderRadius: 'var(--radius-control)', background: 'var(--color-primary-subtle)' }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
            ) : (
              businessName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 truncate">{businessName}</span>
              {isVerified && (
                <span
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--brand-blue) 10%, transparent)', color: 'var(--brand-blue)' }}
                >
                  {t('verifiedBadge')}
                </span>
              )}
            </div>
            <div className="mt-1">
              <VendorStatsLine
                rating={rating}
                response={response}
                showRating={showRating}
                showResponse={showResponse}
                productCount={productCount}
                shipsNationwide={shipsNationwide}
              />
            </div>
          </div>
        </div>
        <a
          href={`/tienda/${vendorId}`}
          className="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-xl border-2 no-underline text-center"
          style={{ borderColor: 'var(--brand-blue)', color: 'var(--brand-blue)' }}
        >
          {t('viewStore')}
        </a>
      </div>
    </div>
  )
}
