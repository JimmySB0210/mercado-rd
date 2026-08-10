'use client'
// ============================================================
// MercadoRD — Contenido traducido de /confirm
// Ruta: src/app/confirm/ConfirmPageContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase) y no
// puede usar useTranslation. Este componente recibe la orden ya
// resuelta como props y se encarga de todo el texto traducido.
// ============================================================

import { DownloadInvoiceButton } from '@/components/order/DownloadInvoiceButton'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPrice } from '@/types/database.types'
import type { InvoiceData } from '@/lib/invoice/generateInvoice'

interface OrderItem {
  id: string
  product: { name: string; images: string[] } | null
  vendor: { business_name: string } | null
  size: string | null
  color: string | null
  quantity: number
  price_rdp: number
}

interface VendorWithWhatsapp {
  business_name: string
  whatsapp: string
}

interface Props {
  shortId: string
  deliveryAddress: string
  provinceName: string
  notes: string | null
  items: OrderItem[]
  subtotalRdp: number
  deliveryRdp: number
  itbisRdp: number
  totalRdp: number
  vendorsWithWhatsapp: VendorWithWhatsapp[]
  invoiceData: InvoiceData
}

// Caso ?order= ausente o inválido — texto traducido aparte porque
// page.tsx retorna temprano antes de llegar a armar los props de
// ConfirmPageContent.
export function OrderNotFoundNotice() {
  const { t } = useTranslation('checkout')
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <p className="text-gray-500">{t('orderNotFound')}</p>
      <a href="/" className="text-blue-600 underline mt-4 inline-block">{t('backToHome')}</a>
    </div>
  )
}

export function ConfirmPageContent({
  shortId, deliveryAddress, provinceName, notes, items,
  subtotalRdp, deliveryRdp, itbisRdp, totalRdp, vendorsWithWhatsapp, invoiceData,
}: Props) {
  const { t } = useTranslation('checkout')

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">

      {/* Confirmación */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mb-4">
        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('orderConfirmedTitle')}</h1>
        <p className="text-gray-500 text-sm mb-6">
          {t('thankYouMessage')}<br />
          {t('whatsappConfirmationNotice')}
        </p>
        <div className="inline-block bg-gray-50 rounded-xl px-6 py-3 font-mono font-bold text-gray-900">
          # RD-{shortId}
        </div>
      </div>

      {/* Entrega */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          {t('deliveryHeading')}
        </h2>
        <p className="text-sm text-gray-900">{deliveryAddress}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {provinceName}
        </p>
        {notes && (
          <p className="text-xs text-gray-400 mt-2">📝 {notes}</p>
        )}
      </div>

      {/* Productos */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-700 px-6 pt-6 pb-3 flex items-center gap-2">
          {t('productsHeading')}
        </h2>
        <div className="divide-y divide-gray-50">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-6 py-4">
              <div className="w-12 h-12 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center text-xl">
                {item.product?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                ) : '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.product?.name}</p>
                <p className="text-xs text-gray-400">
                  {[item.size, item.color].filter(Boolean).join(' · ')}
                  {(item.size || item.color) && ' · '}
                  x{item.quantity} · {item.vendor?.business_name}
                </p>
              </div>
              <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                {formatPrice(item.price_rdp * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="border-t border-gray-100 px-6 py-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{t('subtotalLabel')}</span>
            <span>{formatPrice(subtotalRdp)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{t('shippingLabel')}</span>
            <span>{formatPrice(deliveryRdp)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{t('itbisLabel')}</span>
            <span>{formatPrice(itbisRdp)}</span>
          </div>
          <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-100">
            <span>{t('totalPaidLabel')}</span>
            <span>{formatPrice(totalRdp)}</span>
          </div>
        </div>
      </div>

      {/* Contactar vendedor(es) */}
      {vendorsWithWhatsapp.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            {vendorsWithWhatsapp.length > 1 ? t('contactVendorHeadingOther') : t('contactVendorHeadingOne')}
          </h2>
          <div className="flex flex-col gap-2">
            {vendorsWithWhatsapp.map(vendor => (
              <a
                key={vendor.business_name}
                href={`https://wa.me/${vendor.whatsapp}?text=${encodeURIComponent(`Hola, tengo una pregunta sobre mi pedido #RD-${shortId}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full border border-green-500 text-green-600 text-sm font-medium py-2.5 rounded-lg hover:bg-green-50 transition-colors no-underline"
              >
                {t('contactVendorButton', { name: vendor.business_name })}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <a
          href="/"
          className="block text-center bg-gray-900 text-white py-3 rounded-xl font-medium no-underline hover:bg-gray-800 transition-colors"
        >
          {t('continueShoppingArrow')}
        </a>
        <a
          href="/perfil/pedidos"
          className="block text-center bg-white border border-gray-200 text-gray-900 py-3 rounded-xl font-medium no-underline hover:bg-gray-50 transition-colors"
        >
          {t('viewMyOrders')}
        </a>
        <DownloadInvoiceButton data={invoiceData} />
      </div>

      {/* Garantía */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="font-semibold text-green-800 text-sm mb-1">
          {t('protectedByMercadoRD')}
        </p>
        <p className="text-xs text-green-700">
          {t('protectedGuaranteeText')}
        </p>
      </div>

    </main>
  )
}
