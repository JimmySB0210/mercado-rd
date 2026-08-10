'use client'
// ============================================================
// MercadoRD — Checkout
// Ruta: src/app/checkout/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ChevronDown } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { useCartStore, useCartSubtotal, useCartItbis, useCartTotal } from '@/lib/store/cart'
import { useAuth } from '@/lib/hooks/useAuth'
import { Navbar } from '@/components/shop/Navbar'
import { createClient } from '@/lib/supabase/client'
import { useLocationStore } from '@/lib/store/location'
import type { Province } from '@/types/database.types'
import { notifyOrderConfirmed } from '@/lib/whatsapp/notifications'
import { processPayment, type PaymentResult } from '@/lib/payments/azul'
import { DANGEROUS_PATTERN } from '@/lib/validation'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { CheckoutDict } from '@/lib/i18n/es/checkout'
import Image from 'next/image'

const PAYMENT_METHOD_KEYS: { id: string; labelKey: keyof CheckoutDict; emoji: string }[] = [
  { id: 'azul',     labelKey: 'paymentAzulLabel',     emoji: '💳' },
  { id: 'cardnet',  labelKey: 'paymentCardnetLabel',  emoji: '🏦' },
  { id: 'transfer', labelKey: 'paymentTransferLabel', emoji: '🏧' },
  { id: 'cash',     labelKey: 'paymentCashLabel',      emoji: '💵' },
]

export default function CheckoutPage() {
  const { t } = useTranslation('checkout')
  const router = useRouter()
  const { user, profile } = useAuth()
  const { items, clearCart } = useCartStore()
  const subtotal = useCartSubtotal()
  const itbis = useCartItbis()
  const total = useCartTotal()

  const [form, setForm] = useState({
    fullName:   profile?.full_name || '',
    phone:      profile?.phone || '',
    address:    '',
    province:   '',
    notes:      '',
    payMethod:  'azul',
    cardNumber:     '',
    cardExpiration: '',
    cardCvc:        '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [provinces, setProvinces] = useState<Province[]>([])

  const [couponCode, setCouponCode] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    valid: boolean
    coupon_id: string
    code: string
    type: string
    value: number
    discount_rdp: number
    vendor_id: string
  } | null>(null)
  const { province: selectedProvince } = useLocationStore()

  const [shippingRate, setShippingRate] = useState<{
    price_rdp: number
    estimated_days_min: number
    estimated_days_max: number
    zone: string
  } | null>(null)
  const [shippingLoading, setShippingLoading] = useState(false)

  // Fallback de seguridad — mismo valor que usa el RPC create_order_from_cart
  // si alguna provincia no tuviera tarifa cargada en shipping_rates
  const SHIPPING_FALLBACK_RDP = 25000

  // Mismo umbral que create_order_from_cart aplica en el backend — se
  // replica aquí para que lo que se muestra y lo que se cobra vía la
  // pasarela de pago coincidan con lo que el RPC termina persistiendo.
  const FREE_SHIPPING_THRESHOLD_RDP = 250000 // RD$2,500
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD_RDP

  const rawShipping = items.length === 0
    ? 0
    : shippingRate?.price_rdp ?? (form.province && !shippingLoading ? SHIPPING_FALLBACK_RDP : 0)

  const ENVIO = qualifiesForFreeShipping ? 0 : rawShipping

  const discountRdp = appliedCoupon?.discount_rdp ?? 0

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('provinces_rd')
      .select('id, name, code')
      .order('name')
      .then(({ data }) => setProvinces(data ?? []))
  }, [])

  // Usa la provincia ya elegida en el Navbar como valor inicial del checkout
  useEffect(() => {
    if (selectedProvince && !form.province) {
      setForm(f => ({ ...f, province: selectedProvince.name }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince])

  // Calcula el envío real según la provincia elegida — misma tabla
  // shipping_rates que usa internamente create_order_from_cart, así que
  // lo que se cobra en el cliente coincide con lo que el RPC persiste.
  useEffect(() => {
    if (!form.province || provinces.length === 0) {
      setShippingRate(null)
      return
    }

    const provinceRow = provinces.find(p => p.name === form.province)
    if (!provinceRow) {
      setShippingRate(null)
      return
    }

    setShippingLoading(true)
    const supabase = createClient()
    supabase
      .from('shipping_rates')
      .select('price_rdp, estimated_days_min, estimated_days_max, zone')
      .eq('province_id', provinceRow.id)
      .single()
      .then(({ data }) => {
        setShippingRate(data ?? null)
        setShippingLoading(false)
      }, () => {
        setShippingRate(null)
        setShippingLoading(false)
      })
  }, [form.province, provinces])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponApplying(true)
    setCouponError(null)

    const supabase = createClient()
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: couponCode.trim().toUpperCase(),
      p_order_total_rdp: subtotal,
    })

    setCouponApplying(false)

    if (error || !data?.valid) {
      setCouponError(data?.error ?? t('couponGenericError'))
      setAppliedCoupon(null)
      return
    }

    setAppliedCoupon(data)
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError(null)
  }

  const handleSubmit = async () => {
    if (!user) { router.push('/login?redirect=/checkout'); return }
    if (!form.fullName || !form.phone || !form.address || !form.province) {
      setError(t('requiredFieldsError'))
      return
    }
    if (form.payMethod === 'azul' && (!form.cardNumber || !form.cardExpiration || !form.cardCvc)) {
      setError(t('cardDetailsRequired'))
      return
    }
    if (shippingLoading) {
      setError(t('waitingShippingCalc'))
      return
    }
    if (items.length === 0) { router.push('/'); return }

    setAddressError(null)
    setNotesError(null)

    // Misma lógica que lib/validation.ts validateText() (longitud +
    // DANGEROUS_PATTERN), pero con el mensaje traducido — validateText
    // arma el string completo en español y lo comparten 4 componentes
    // más fuera del alcance de este namespace, así que no se toca.
    const addressTrimmed = form.address.trim()
    if (addressTrimmed.length < 10 || addressTrimmed.length > 200) {
      setAddressError(t('addressLengthError', { min: 10, max: 200 }))
      return
    }
    if (DANGEROUS_PATTERN.test(addressTrimmed)) {
      setAddressError(t('addressInvalidChars'))
      return
    }

    const notesTrimmed = form.notes.trim()
    if (notesTrimmed.length > 500) {
      setNotesError(t('notesTooLong', { max: 500 }))
      return
    }
    if (DANGEROUS_PATTERN.test(notesTrimmed)) {
      setNotesError(t('notesInvalidChars'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const totalCents = Math.max(0, total + ENVIO - discountRdp)

      // Protección contra card testing — máx. 5 intentos por IP y 3
      // fallos consecutivos por usuario cada 15 minutos.
      const rateCheckRes = await fetch('/api/checkout/rate-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, action: 'check' }),
      })

      if (rateCheckRes.status === 429) {
        const { error: rateError } = await rateCheckRes.json().catch(() => ({ error: null }))
        setError(rateError ?? t('rateLimitFallback'))
        setRateLimited(true)
        setLoading(false)
        return
      }

      // Cobrar primero — solo creamos la orden si el pago es aprobado.
      // Así evitamos órdenes "pending" huérfanas por pagos rechazados.
      let paymentResult: PaymentResult | null = null
      if (form.payMethod === 'azul') {
        paymentResult = await processPayment({
          orderId: crypto.randomUUID(), // referencia temporal, no es el id real de la orden
          amountCents: totalCents,
          itbisCents: itbis,
          cardNumber: form.cardNumber,
          expiration: form.cardExpiration,
          cvc: form.cardCvc,
          customerName: form.fullName,
        })

        if (!paymentResult.success) {
          // paymentResult.responseMessage viene de la pasarela (mock o Azul
          // real) en español fijo — no se traduce (mensaje de un sistema
          // externo). Mapeamos por código a un mensaje traducido en su lugar.
          setError(paymentResult.responseCode === '05' ? t('paymentDeclined') : t('paymentErrorGeneric'))
          setLoading(false)
          fetch('/api/checkout/rate-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, action: 'fail' }),
          }).catch(() => {})
          return
        }
      }

      // Buscar el id de la provincia seleccionada
      const { data: provinceRow, error: provinceError } = await supabase
        .from('provinces_rd')
        .select('id')
        .eq('name', form.province)
        .single()

      if (provinceError || !provinceRow) {
        throw new Error('Provincia inválida')
      }

      // Armar el payload de items para la función RPC
      const itemsPayload = items.map(item => ({
        product_id: item.product.id,
        vendor_id: item.product.vendor_id,
        quantity: item.quantity,
        price_rdp: item.variant_price_rdp ?? item.product.price_rdp,
        size: item.selected_size ?? null,
        color: item.selected_color ?? null,
      }))

      const { data: orderId, error: rpcError } = await supabase.rpc('create_order_from_cart', {
        p_delivery_address: form.address,
        p_province_id: provinceRow.id,
        p_payment_method: form.payMethod,
        p_notes: form.notes || null,
        p_items: itemsPayload,
        p_discount_rdp: discountRdp,
        p_coupon_id: appliedCoupon?.coupon_id ?? null,
      })

      if (rpcError) {
        console.error('[RPC ERROR DETALLE]', JSON.stringify(rpcError, null, 2))
        throw rpcError
      }

      // Incrementar el contador de usos del cupón aplicado
      if (appliedCoupon) {
        const { error: couponUseError } = await supabase.rpc('apply_coupon_use', {
          p_coupon_id: appliedCoupon.coupon_id,
        })
        if (couponUseError) console.error('[checkout] Error incrementando uso de cupón:', couponUseError)
      }

      // Registrar el pago ya aprobado, vinculado a la orden real recién creada
      if (paymentResult) {
        const { error: paymentError } = await supabase.from('payments').insert({
          order_id: orderId,
          method: form.payMethod,
          amount_rdp: totalCents,
          status: 'approved',
          azul_order_id: paymentResult.azulOrderId,
          auth_code: paymentResult.authCode,
          raw_response: paymentResult.rawResponse,
        })
        if (paymentError) console.error('[checkout] Error guardando registro de pago:', paymentError)
      }

      // Notificar al comprador por WhatsApp — fire and forget: no bloquea la UI
      // ni muestra error si falla (ej. credenciales de Meta sin configurar todavía)
      supabase
        .from('orders')
        .select('id, total_rdp, delivery_type, user:users(full_name, phone)')
        .eq('id', orderId)
        .single()
        .then(({ data }) => {
          if (!data) return
          // Verificación defensiva: lo cobrado vía Azul debe coincidir con lo
          // que el RPC persistió usando su propio cálculo de shipping_rates
          if (paymentResult && data.total_rdp !== totalCents) {
            console.error(
              `[checkout] Descuadre de monto: se cobró ${totalCents} pero la orden ${orderId} quedó con total_rdp ${data.total_rdp}`
            )
          }
          notifyOrderConfirmed(data as any)
        }, () => {})

      clearCart()
      router.push(`/confirm?order=${orderId}`)
    } catch (err) {
      console.error('[checkout]', err)
      setError(t('genericOrderError'))
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.bg }}>
        <Navbar />
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>{t('emptyCartTitle')}</h2>
          <p style={{ color: BRAND.gray, fontSize: 14, marginBottom: 24 }}>{t('emptyCartSub')}</p>
          <a href="/" style={{ display: 'inline-block', background: BRAND.blue, color: '#fff', textDecoration: 'none', padding: '12px 28px', borderRadius: 8, fontWeight: 600 }}>
            {t('exploreProducts')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BRAND.bg }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }} className="checkout-grid">

        {/* Formulario */}
        <div>

          {/* Dirección */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, border: '1px solid #EEE' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: BRAND.dark }}>{t('deliveryAddressHeading')}</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder={t('fullNamePlaceholder')}
                style={{ width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={t('phonePlaceholder')}
                style={{ width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <div>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder={t('addressPlaceholder')}
                  style={{ width: '100%', border: `1px solid ${addressError ? '#E53935' : '#E0E0E0'}`, borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                {addressError && <p style={{ fontSize: 12, color: '#E53935', margin: '4px 0 0' }}>{addressError}</p>}
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  style={{ width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', appearance: 'none', background: '#fff', color: form.province ? BRAND.dark : BRAND.gray }}
                >
                  <option value="">{t('selectProvincePlaceholder')}</option>
                  {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                <ChevronDown size={16} color={BRAND.gray} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
              <div>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder={t('notesPlaceholder')}
                  rows={2}
                  style={{ width: '100%', border: `1px solid ${notesError ? '#E53935' : '#E0E0E0'}`, borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                />
                {notesError && <p style={{ fontSize: 12, color: '#E53935', margin: '4px 0 0' }}>{notesError}</p>}
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #EEE' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: BRAND.dark }}>{t('paymentMethodHeading')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {PAYMENT_METHOD_KEYS.map(m => (
                <label
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    border: `2px solid ${form.payMethod === m.id ? BRAND.blue : '#E0E0E0'}`,
                    borderRadius: 8, cursor: 'pointer',
                    background: form.payMethod === m.id ? `color-mix(in srgb, ${BRAND.blue} 6%, white)` : '#fff',
                    transition: 'all .15s',
                  }}
                >
                  <input
                    type="radio"
                    name="payMethod"
                    value={m.id}
                    checked={form.payMethod === m.id}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: 18 }}>{m.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: BRAND.dark }}>{t(m.labelKey)}</span>
                </label>
              ))}
            </div>

            {form.payMethod === 'azul' && (
              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                <input
                  name="cardNumber"
                  value={form.cardNumber}
                  onChange={handleChange}
                  placeholder={t('cardNumberPlaceholder')}
                  inputMode="numeric"
                  style={{ width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input
                    name="cardExpiration"
                    value={form.cardExpiration}
                    onChange={handleChange}
                    placeholder={t('cardExpirationPlaceholder')}
                    maxLength={4}
                    inputMode="numeric"
                    style={{ width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <input
                    name="cardCvc"
                    value={form.cardCvc}
                    onChange={handleChange}
                    placeholder={t('cardCvcPlaceholder')}
                    maxLength={4}
                    inputMode="numeric"
                    style={{ width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <p style={{ fontSize: 11, color: BRAND.gray, margin: 0 }}>
                  {t('mockModeNotice')}
                </p>
              </div>
            )}

            {form.payMethod === 'cardnet' && (
              <div style={{ marginTop: 14, padding: 12, background: '#FFF8E1', borderRadius: 8, border: '1px solid #FFE082', fontSize: 12, color: '#5D4037' }}>
                {t('cardnetRedirectNotice')}
              </div>
            )}
          </div>
        </div>

        {/* Resumen lateral */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #EEE', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: BRAND.dark }}>
              {items.length === 1
                ? t('orderItemsCountOne', { count: items.length })
                : t('orderItemsCountOther', { count: items.length })}
            </h2>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {items.map(item => (
                <div key={item.product.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 6, background: BRAND.bg, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                    {item.product.images?.[0] ? (
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="44px" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: BRAND.dark, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product.name}
                    </p>
                    <p style={{ fontSize: 11, color: BRAND.gray, margin: '2px 0 0' }}>
                      x{item.quantity}
                      {item.selected_size && ` · ${item.selected_size}`}
                      {item.selected_color && ` · ${item.selected_color}`}
                    </p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.dark, flexShrink: 0 }}>
                    RD${(((item.variant_price_rdp ?? item.product.price_rdp) * item.quantity) / 100).toLocaleString('es-DO')}
                  </span>
                </div>
              ))}
            </div>

            {/* Cupón */}
            <div style={{ borderTop: '1px solid #EEE', paddingTop: 12, marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: BRAND.gray, display: 'block', marginBottom: 6 }}>
                {t('couponQuestion')}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder={t('couponPlaceholder')}
                  disabled={!!appliedCoupon}
                  style={{
                    flex: 1, border: '1px solid #E0E0E0', borderRadius: 8, padding: '9px 12px',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase',
                    background: appliedCoupon ? '#F5F5F5' : '#fff',
                  }}
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{ border: '1px solid #E0E0E0', background: '#fff', color: BRAND.gray, borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {t('removeCoupon')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponApplying || !couponCode.trim()}
                    style={{
                      border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600,
                      color: '#fff', whiteSpace: 'nowrap',
                      background: couponApplying || !couponCode.trim() ? '#ccc' : BRAND.dark,
                      cursor: couponApplying || !couponCode.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {couponApplying ? '...' : t('applyCoupon')}
                  </button>
                )}
              </div>
              {couponError && <p style={{ fontSize: 12, color: '#E53935', margin: '6px 0 0' }}>{couponError}</p>}
              {appliedCoupon && (
                <p style={{ fontSize: 12, color: '#2E7D32', margin: '6px 0 0', fontWeight: 600 }}>
                  {t('couponAppliedMsg', { code: appliedCoupon.code })}
                </p>
              )}
            </div>

            <div style={{ borderTop: '1px solid #EEE', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: BRAND.dark }}>
                <span>{t('subtotalLabel')}</span><span>RD${(subtotal / 100).toLocaleString('es-DO')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: BRAND.dark }}>
                <span>
                  {t('shippingLabel')}
                  {shippingRate && (
                    <span style={{ display: 'block', fontSize: 11, color: BRAND.gray }}>
                      {shippingRate.estimated_days_min === shippingRate.estimated_days_max
                        ? t(shippingRate.estimated_days_min === 1 ? 'shippingDaysOne' : 'shippingDaysOther', { count: shippingRate.estimated_days_min })
                        : t('shippingDaysRange', { min: shippingRate.estimated_days_min, max: shippingRate.estimated_days_max })}
                    </span>
                  )}
                </span>
                <span>
                  {!form.province
                    ? t('selectProvinceHint')
                    : shippingLoading
                      ? t('calculatingShipping')
                      : qualifiesForFreeShipping
                        ? (
                          <>
                            <span style={{ textDecoration: 'line-through', color: BRAND.gray, marginRight: 6 }}>
                              RD${(rawShipping / 100).toLocaleString('es-DO')}
                            </span>
                            <span style={{ color: '#2E7D32', fontWeight: 700 }}>{t('freeBadge')}</span>
                          </>
                        )
                        : `RD$${(ENVIO / 100).toLocaleString('es-DO')}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: BRAND.dark }}>
                <span>{t('itbisLabel')}</span><span>RD${(itbis / 100).toLocaleString('es-DO')}</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#2E7D32', fontWeight: 600 }}>
                  <span>{t('discountLabel', { code: appliedCoupon.code })}</span>
                  <span>-RD${(discountRdp / 100).toLocaleString('es-DO')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, borderTop: '1px solid #EEE', paddingTop: 10, marginTop: 4, color: BRAND.dark }}>
                <span>{t('totalLabel')}</span>
                <span>RD${(Math.max(0, total + ENVIO - discountRdp) / 100).toLocaleString('es-DO')}</span>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C62828', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <p style={{ fontSize: 11, color: BRAND.gray, textAlign: 'center', marginBottom: 10 }}>
            {t('acceptTermsPrefix')}{' '}
            <a href="/terminos" target="_blank" style={{ color: BRAND.blue, textDecoration: 'underline' }}>
              {t('termsOfServiceLink')}
            </a>
            {' '}{t('andWord')}{' '}
            <a href="/privacidad" target="_blank" style={{ color: BRAND.blue, textDecoration: 'underline' }}>
              {t('privacyPolicyLink')}
            </a>
          </p>

          <button
            onClick={handleSubmit}
            disabled={loading || shippingLoading || rateLimited}
            style={{
              display: 'block', width: '100%', background: (loading || shippingLoading || rateLimited) ? '#ccc' : BRAND.red,
              color: '#fff', border: 'none', padding: 14, borderRadius: 8,
              fontWeight: 700, fontSize: 15, cursor: (loading || shippingLoading || rateLimited) ? 'not-allowed' : 'pointer',
              marginBottom: 10,
            }}
          >
            {loading ? t('processingPayment') : shippingLoading ? t('calculatingShippingButton') : rateLimited ? t('rateLimitedButton') : t('confirmAndPay')}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#F0FDF4', borderRadius: 8, border: '1px solid #C8E6C9' }}>
            <ShieldCheck size={15} color={BRAND.green} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#1B5E20' }}>{t('securePaymentNotice')}</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
