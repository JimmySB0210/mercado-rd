'use client'
// ============================================================
// MercadoRD — Tarjeta de cotización dentro del hilo de chat
// Ruta: src/components/chat/QuoteCard.tsx
// ============================================================
// Se renderiza en vez de la burbuja de texto plano cuando un mensaje
// tiene chat_quote_id — los datos vivos de la cotización (precio,
// status) los mantiene mensajes/[id]/page.tsx vía su propia
// suscripción realtime a chat_quotes; este componente es puramente de
// presentación + disparo de acciones (respond_chat_quote /
// accept_chat_quote), no tiene su propia suscripción.
//
// accept_chat_quote() ya usa quoted_unit_price_rdp guardado en la fila
// de chat_quotes para armar el pedido — nunca products.price_rdp.
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { validateText, validateProvince } from '@/lib/validation'
import { formatPrice } from '@/types/database.types'
import { BRAND } from '@/lib/colors'

export interface ChatQuote {
  id: string
  conversation_id: string
  product_id: string
  requested_by: string
  quantity: number
  status: 'requested' | 'quoted' | 'accepted' | 'declined'
  quoted_unit_price_rdp: number | null
  quoted_by: string | null
  order_id: string | null
  created_at: string
  updated_at: string
}

interface ProvinceOption {
  id: number
  name: string
}

interface Props {
  quote: ChatQuote
  productName: string
  catalogPriceRdp: number
  isBuyer: boolean
  provinces: ProvinceOption[]
}

export function QuoteCard({ quote, productName, catalogPriceRdp, isBuyer, provinces }: Props) {
  const { t } = useTranslation('chat')
  const supabase = createClient()

  const [priceInput, setPriceInput] = useState('')
  const [respondLoading, setRespondLoading] = useState(false)
  const [respondError, setRespondError] = useState<string | null>(null)

  const [showAcceptForm, setShowAcceptForm] = useState(false)
  const [address, setAddress] = useState('')
  const [provinceId, setProvinceId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'azul' | 'cardnet'>('cash')
  const [acceptLoading, setAcceptLoading] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  const subtotal = quote.quoted_unit_price_rdp !== null ? quote.quoted_unit_price_rdp * quote.quantity : null

  const handleRespond = async () => {
    const priceNum = parseFloat(priceInput)
    if (isNaN(priceNum) || priceNum <= 0) {
      setRespondError(t('invalidPriceError'))
      return
    }
    setRespondLoading(true)
    setRespondError(null)

    const { error } = await supabase.rpc('respond_chat_quote', {
      p_quote_id: quote.id,
      p_unit_price_rdp: Math.round(priceNum * 100),
    })

    if (error) {
      console.error('[QuoteCard respond]', error)
      setRespondError(t('quoteActionError'))
      setRespondLoading(false)
      return
    }

    setPriceInput('')
    setRespondLoading(false)
  }

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setAcceptError(null)

    const addressTrimmed = address.trim()
    const addressErr = validateText(addressTrimmed, t('deliveryAddressLabel'), 10, 200)
    if (addressErr) { setAcceptError(addressErr); return }

    const provinceIdNum = Number(provinceId)
    const provinceErr = validateProvince(provinceIdNum)
    if (provinceErr) { setAcceptError(provinceErr); return }

    setAcceptLoading(true)

    const { data, error } = await supabase.rpc('accept_chat_quote', {
      p_quote_id: quote.id,
      p_delivery_address: addressTrimmed,
      p_province_id: provinceIdNum,
      p_payment_method: paymentMethod,
    })

    if (error) {
      console.error('[QuoteCard accept]', error)
      setAcceptError(t('quoteActionError'))
      setAcceptLoading(false)
      return
    }

    if (!data?.success) {
      setAcceptError(data?.error ?? t('quoteActionError'))
      setAcceptLoading(false)
      return
    }

    setAcceptLoading(false)
    setShowAcceptForm(false)
    // El status pasa a 'accepted' vía la suscripción realtime del padre —
    // no hace falta actualizar nada local acá.
  }

  const priceInputRow = (label: string) => (
    <div className="mt-2">
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <div className="flex gap-1.5">
        <input
          type="number"
          step="0.01"
          min="0"
          value={priceInput}
          onChange={e => setPriceInput(e.target.value)}
          placeholder="0.00"
          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
        />
        <button
          type="button"
          onClick={handleRespond}
          disabled={respondLoading || !priceInput}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white border-none cursor-pointer disabled:opacity-60"
          style={{ background: BRAND.blue }}
        >
          {respondLoading ? t('sendingButton') : t('sendQuoteButton')}
        </button>
      </div>
      {respondError && <p className="text-xs mt-1" style={{ color: BRAND.red }}>{respondError}</p>}
    </div>
  )

  return (
    <div className="rounded-xl p-3" style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#111', minWidth: 230 }}>
      <p className="text-xs font-semibold mb-1" style={{ color: BRAND.blue }}>💰 {t('quoteCardTitle')}</p>
      <p className="text-sm font-medium">{productName}</p>
      <p className="text-xs text-gray-500 mt-0.5">{t('quoteQuantityLine', { count: quote.quantity })}</p>
      <p className="text-xs text-gray-400">{t('catalogPriceLine', { price: formatPrice(catalogPriceRdp) })}</p>

      {quote.status === 'requested' && (
        isBuyer ? (
          <p className="text-xs mt-2 font-medium" style={{ color: BRAND.gray }}>{t('waitingVendorResponse')}</p>
        ) : priceInputRow(t('unitPriceInputLabel'))
      )}

      {quote.status === 'quoted' && quote.quoted_unit_price_rdp !== null && (
        <>
          <p className="text-sm font-bold mt-2" style={{ color: BRAND.blue }}>
            {formatPrice(quote.quoted_unit_price_rdp)} {t('perUnitSuffix')}
          </p>
          <p className="text-xs text-gray-500">{t('subtotalLine', { amount: formatPrice(subtotal!) })}</p>

          {isBuyer ? (
            !showAcceptForm ? (
              <button
                type="button"
                onClick={() => setShowAcceptForm(true)}
                className="mt-2 w-full py-1.5 rounded-lg text-xs font-medium text-white border-none cursor-pointer"
                style={{ background: 'var(--color-green)' }}
              >
                {t('acceptQuoteButton')}
              </button>
            ) : (
              <form onSubmit={handleAccept} className="mt-2 flex flex-col gap-1.5">
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder={t('deliveryAddressPlaceholder')}
                  rows={2}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none resize-none"
                />
                <select
                  value={provinceId}
                  onChange={e => setProvinceId(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none bg-white"
                >
                  <option value="">{t('selectProvincePlaceholder')}</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as typeof paymentMethod)}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none bg-white"
                >
                  <option value="cash">{t('paymentCashLabel')}</option>
                  <option value="transfer">{t('paymentTransferLabel')}</option>
                  <option value="azul">{t('paymentAzulLabel')}</option>
                  <option value="cardnet">{t('paymentCardnetLabel')}</option>
                </select>
                {acceptError && <p className="text-xs" style={{ color: BRAND.red }}>{acceptError}</p>}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAcceptForm(false)}
                    className="flex-1 py-1.5 rounded-lg text-xs border border-gray-200 bg-white cursor-pointer"
                  >
                    {t('cancelButton')}
                  </button>
                  <button
                    type="submit"
                    disabled={acceptLoading}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white border-none cursor-pointer disabled:opacity-60"
                    style={{ background: 'var(--color-green)' }}
                  >
                    {acceptLoading ? t('sendingButton') : t('confirmAcceptButton')}
                  </button>
                </div>
              </form>
            )
          ) : (
            <>
              <p className="text-xs mt-1 font-medium" style={{ color: BRAND.gray }}>{t('waitingBuyerAccept')}</p>
              {priceInputRow(t('adjustPriceLabel'))}
            </>
          )}
        </>
      )}

      {quote.status === 'accepted' && (
        <div className="mt-2">
          <p className="text-sm font-bold" style={{ color: 'var(--color-green)' }}>✅ {t('quoteAcceptedLabel')}</p>
          {subtotal !== null && (
            <p className="text-xs text-gray-500">{t('subtotalLine', { amount: formatPrice(subtotal) })}</p>
          )}
          <a
            href={isBuyer ? '/perfil/pedidos' : '/dashboard/pedidos'}
            className="text-xs font-medium hover:underline mt-1 inline-block"
            style={{ color: BRAND.blue }}
          >
            {t('viewOrderLink')}
          </a>
        </div>
      )}
    </div>
  )
}
