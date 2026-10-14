'use client'
// ============================================================
// MercadoRD — Checkout
// Ruta: src/app/checkout/page.tsx
// ============================================================

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, ChevronDown } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { useCartStore } from '@/lib/store/cart'
import { useExpressCheckoutStore, useExpressCheckoutHydrated } from '@/lib/store/expressCheckout'
import { useAuth } from '@/lib/hooks/useAuth'
import { Navbar } from '@/components/shop/Navbar'
import { createClient } from '@/lib/supabase/client'
import { useLocationStore } from '@/lib/store/location'
import type { Province } from '@/types/database.types'
import type { CartItem } from '@/types'
import { notifyOrderConfirmed } from '@/lib/whatsapp/notifications'
import { processPayment, type PaymentResult } from '@/lib/payments/azul'
import { DANGEROUS_PATTERN } from '@/lib/validation'
import { formatPhone, normalizePhone, PHONE_INPUT_PROPS } from '@/lib/phone'
import { useCartQuote, fetchCartQuote, lineProblem, quoteBlocksPurchase, type CartQuote } from '@/lib/cart/quote'
import { resolveKnownError, KNOWN_ORDER_ERRORS, type SupabaseErrorLike } from '@/lib/orderErrors'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { CheckoutDict } from '@/lib/i18n/es/checkout'
import Image from 'next/image'

const PAYMENT_METHOD_KEYS: { id: string; labelKey: keyof CheckoutDict; emoji: string }[] = [
  { id: 'azul',     labelKey: 'paymentAzulLabel',     emoji: '💳' },
  { id: 'cardnet',  labelKey: 'paymentCardnetLabel',  emoji: '🏦' },
  { id: 'transfer', labelKey: 'paymentTransferLabel', emoji: '🏧' },
  { id: 'cash',     labelKey: 'paymentCashLabel',      emoji: '💵' },
]

interface AppliedCoupon {
  valid: true
  coupon_id: string
  code: string
  type: string
  value: number
  discount_rdp: number
  vendor_id: string | null
}

// FIX URGENTE (2026-10-01): useSearchParams() sin <Suspense> alrededor
// falla el build de producción real (next build), aunque funcione sin
// problema en next dev -- bloqueaba el deploy entero en Vercel (el
// mismo bug que ya había roto producto/[id] hoy). El wrapper de abajo
// (CheckoutPage) es el fix estándar de Next.js para esto -- ningún
// cambio de comportamiento, solo satisface el requisito de build.
function CheckoutPageContent() {
  const { t } = useTranslation('checkout')
  const { t: tc } = useTranslation('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()
  const { items: cartItems, clearCart } = useCartStore()

  // Modo "Comprar ahora" — activo SOLO con ?modo=express en la URL. Sin
  // ese flag, checkout usa el carrito real de siempre, sin importar si
  // quedó un ítem express viejo dando vueltas en sessionStorage. Con el
  // flag, usa ÚNICAMENTE ese ítem — nunca el carrito completo, ni
  // siquiera como fallback (ver el useEffect de abajo para el caso en
  // que el flag está pero el ítem no existe).
  const isExpressMode = searchParams.get('modo') === 'express'
  const expressItem = useExpressCheckoutStore(s => s.item)
  const clearExpressItem = useExpressCheckoutStore(s => s.clearItem)
  const expressHydrated = useExpressCheckoutHydrated()

  const items: CartItem[] = isExpressMode ? (expressItem ? [expressItem] : []) : cartItems

  // Si el flag express está pero sessionStorage no tiene ningún ítem
  // (ej. se limpió entre el click y esta carga, o alguien pegó la URL a
  // mano) — nunca caer al carrito completo por error: volver a la
  // página del producto (el id viaja en la misma URL) o, si tampoco
  // está, a inicio. Espera a que la hidratación de sessionStorage
  // termine antes de decidir "no hay ítem" (si no, redirige en cada F5).
  useEffect(() => {
    if (!isExpressMode || !expressHydrated || expressItem) return
    const productId = searchParams.get('producto')
    router.replace(productId ? `/producto/${productId}` : '/')
  }, [isExpressMode, expressHydrated, expressItem, searchParams, router])

  const [form, setForm] = useState({
    fullName:   profile?.full_name || '',
    phone:      formatPhone(profile?.phone),
    address:    '',
    province:   '',
    notes:      '',
    isForSomeoneElse: false,
    recipientName:  '',
    recipientPhone: '',
    payMethod:  'azul',
    cardNumber:     '',
    cardExpiration: '',
    cardCvc:        '',
  })
  // El perfil suele llegar después del primer render (useAuth carga en
  // segundo plano), así que el useState inicial casi nunca lo ve. Cuando
  // llega, se rellenan nombre y teléfono, salvo en los campos que el
  // usuario ya haya editado (no se pisa lo que escribió).
  const editedFieldsRef = useRef(new Set<string>())
  useEffect(() => {
    if (!profile) return
    setForm(f => ({
      ...f,
      fullName: editedFieldsRef.current.has('fullName') ? f.fullName : (profile.full_name || f.fullName),
      phone: editedFieldsRef.current.has('phone') ? f.phone : (formatPhone(profile.phone) || f.phone),
    }))
  }, [profile])

  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  // Errores en línea de los teléfonos (comprador y quien recibe).
  const [phoneErrors, setPhoneErrors] = useState<{ phone: string | null; recipientPhone: string | null }>({ phone: null, recipientPhone: null })
  const [notesError, setNotesError] = useState<string | null>(null)
  const [provinces, setProvinces] = useState<Province[]>([])

  const [couponCode, setCouponCode] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  // Subtotal de la cotización con el que se validó el cupón aplicado: si
  // cambia, se revalida una vez en silencio.
  const couponValidatedForRef = useRef<number | null>(null)
  const { province: selectedProvince } = useLocationStore()

  const [shippingRate, setShippingRate] = useState<{
    price_rdp: number
    estimated_days_min: number
    estimated_days_max: number
    zone: string
  } | null>(null)
  const [shippingLoading, setShippingLoading] = useState(false)

  // Subtotal, ITBIS, envío y precio por línea los calcula el servidor
  // (quote_cart) con la misma regla que cobra create_order_from_cart. La
  // consulta a shipping_rates de abajo solo da los días estimados y la
  // tarifa tachada cuando el envío es gratis; el monto sale de aquí.
  const quoteProvinceId = provinces.find(p => p.name === form.province)?.id ?? null
  const { quote, status: quoteStatus, reload: reloadQuote, setQuote } = useCartQuote(items, quoteProvinceId)
  const quoteMatches = !!quote && quote.lines.length === items.length
    && quote.lines.every((l, i) => l.product_id === items[i].product.id && l.quantity === items[i].quantity)
  const q = quoteStatus === 'ready' && quoteMatches ? quote : null
  const subtotal = q?.subtotal_rdp ?? 0
  const itbis = q?.itbis_rdp ?? 0
  const qualifiesFreeShipping = q?.qualifies_free_shipping ?? false
  const ENVIO = q?.delivery_rdp ?? 0
  const discountRdp = appliedCoupon?.discount_rdp ?? 0
  const totalToPay = q ? Math.max(0, q.total_rdp - discountRdp) : 0
  const quoteHasLineIssues = q ? quoteBlocksPurchase(q) : false
  const quoteReady = !!q && q.delivery_rdp !== null
  const fmt = (cents: number) => `RD$${(cents / 100).toLocaleString('es-DO')}`
  const submitBlocked = loading || rateLimited || quoteStatus === 'loading' || quoteStatus === 'error'
    || quoteHasLineIssues || (!!form.province && !quoteReady)
  const backHref = isExpressMode ? (expressItem ? `/producto/${expressItem.product.id}` : '/') : '/cart'

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
    editedFieldsRef.current.add(e.target.name)
    if (e.target.name === 'phone' || e.target.name === 'recipientPhone') {
      const name = e.target.name
      setPhoneErrors(prev => (prev[name] ? { ...prev, [name]: null } : prev))
    }
  }

  // Al salir del campo: error si no es un número dominicano válido; si
  // lo es, se reescribe como 809-555-1234 (lo que se guarda).
  const handlePhoneBlur = (name: 'phone' | 'recipientPhone') => {
    const value = form[name]
    if (!value.trim()) return
    if (!normalizePhone(value)) {
      setPhoneErrors(prev => ({ ...prev, [name]: tc('phoneInvalid') }))
      return
    }
    setPhoneErrors(prev => ({ ...prev, [name]: null }))
    setForm(f => ({ ...f, [name]: formatPhone(value) }))
  }

  const handleForSomeoneElseToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, isForSomeoneElse: e.target.checked }))
  }

  // Mensaje traducido por error_code; nunca el texto crudo del servidor.
  const couponErrorMessage = (data: { error_code?: string; min_order_rdp?: number } | null): string => {
    switch (data?.error_code) {
      case 'not_found': return t('couponErrNotFound')
      case 'expired': return t('couponErrExpired')
      case 'limit_reached': return t('couponErrLimitReached')
      case 'min_order': return t('couponErrMinOrder', { amount: ((data.min_order_rdp ?? 0) / 100).toLocaleString('es-DO') })
      case 'rate_limited': return t('couponErrRateLimited')
      case 'invalid_total': return t('couponErrInvalidTotal')
      default: return t('couponGenericError')
    }
  }

  // validate_coupon solo con sesión. Devuelve el cupón válido o el mensaje
  // de error ya traducido. Un cupón de tienda no aplica si el pedido trae
  // productos de otra tienda (el servidor igual lo rechazaría al crear el
  // pedido).
  const validateCoupon = async (code: string, subtotalRdp: number): Promise<{ coupon: AppliedCoupon } | { error: string }> => {
    const { data, error } = await createClient().rpc('validate_coupon', { p_code: code, p_order_total_rdp: subtotalRdp })
    if (error || !data) return { error: t('couponGenericError') }
    if (!data.valid) return { error: couponErrorMessage(data) }
    if (data.vendor_id && items.some(i => i.product.vendor_id !== data.vendor_id)) return { error: t('couponStoreOnly') }
    return { coupon: data as AppliedCoupon }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !q || !user) return
    setCouponApplying(true)
    setCouponError(null)
    const result = await validateCoupon(couponCode.trim().toUpperCase(), q.subtotal_rdp)
    setCouponApplying(false)
    if ('error' in result) {
      setCouponError(result.error)
      setAppliedCoupon(null)
      return
    }
    couponValidatedForRef.current = q.subtotal_rdp
    setAppliedCoupon(result.coupon)
  }

  // Si el subtotal de la cotización cambia con un cupón aplicado, se
  // revalida una vez en silencio; si deja de servir, se quita con aviso.
  useEffect(() => {
    if (!appliedCoupon || !q || couponValidatedForRef.current === q.subtotal_rdp) return
    const subtotalNow = q.subtotal_rdp
    couponValidatedForRef.current = subtotalNow
    validateCoupon(appliedCoupon.code, subtotalNow).then(result => {
      if ('error' in result) {
        setAppliedCoupon(null)
        setCouponError(t('couponRemovedNotice'))
      } else {
        setAppliedCoupon(result.coupon)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.subtotal_rdp, appliedCoupon?.code])

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError(null)
  }

  const handleSubmit = async () => {
    if (!user) {
      const redirectTo = isExpressMode ? `/checkout?${searchParams.toString()}` : '/checkout'
      router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`)
      return
    }
    if (!form.fullName || !form.phone || !form.address || !form.province) {
      setError(t('requiredFieldsError'))
      return
    }
    if (form.isForSomeoneElse) {
      if (form.recipientName.trim().length < 3) {
        setError(t('recipientNameRequiredError'))
        return
      }
      if (!form.recipientPhone.trim()) {
        setError(t('recipientPhoneRequiredError'))
        return
      }
    }
    const buyerPhoneInvalid = !normalizePhone(form.phone)
    const recipientPhoneInvalid = form.isForSomeoneElse && !normalizePhone(form.recipientPhone)
    if (buyerPhoneInvalid || recipientPhoneInvalid) {
      setPhoneErrors({
        phone: buyerPhoneInvalid ? tc('phoneInvalid') : null,
        recipientPhone: recipientPhoneInvalid ? tc('phoneInvalid') : null,
      })
      return
    }
    if (form.payMethod === 'azul' && (!form.cardNumber || !form.cardExpiration || !form.cardCvc)) {
      setError(t('cardDetailsRequired'))
      return
    }
    if (items.length === 0) { router.push('/'); return }
    if (!quoteReady || quoteHasLineIssues) {
      setError(quoteHasLineIssues ? t('itemsBlockedNotice') : t('waitingShippingCalc'))
      return
    }

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

      // Protección contra card testing — máx. 5 intentos por IP y 3
      // fallos consecutivos por usuario cada 15 minutos.
      const rateCheckRes = await fetch('/api/checkout/rate-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
      })

      if (rateCheckRes.status === 429) {
        const { error: rateError } = await rateCheckRes.json().catch(() => ({ error: null }))
        setError(rateError ?? t('rateLimitFallback'))
        setRateLimited(true)
        setLoading(false)
        return
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

      // Cotización nueva con la provincia final ANTES de cobrar. Si falla,
      // si algo dejó de estar disponible o si el total cambió respecto a
      // lo mostrado, no se cobra: se actualiza la pantalla y se avisa.
      let fresh: CartQuote
      try {
        fresh = await fetchCartQuote(items, provinceRow.id)
      } catch (quoteErr) {
        console.error('[checkout] quote_cart', quoteErr)
        setError(t('quoteFailedSubmit'))
        setLoading(false)
        return
      }
      if (quoteBlocksPurchase(fresh)) {
        setQuote(fresh)
        setError(t('stockChangedNotice'))
        setLoading(false)
        return
      }
      if (!q || fresh.total_rdp !== q.total_rdp) {
        setQuote(fresh)
        setError(t('pricesChangedNotice'))
        setLoading(false)
        return
      }

      // El cupón se revalida contra el subtotal fresco.
      let discountForCharge = 0
      if (appliedCoupon) {
        const result = await validateCoupon(appliedCoupon.code, fresh.subtotal_rdp)
        if ('error' in result) {
          setAppliedCoupon(null)
          setCouponError(result.error)
          setError(t('couponRemovedNotice'))
          setLoading(false)
          return
        }
        if (result.coupon.discount_rdp !== appliedCoupon.discount_rdp) {
          setAppliedCoupon(result.coupon)
          setError(t('pricesChangedNotice'))
          setLoading(false)
          return
        }
        discountForCharge = result.coupon.discount_rdp
      }
      const totalCents = Math.max(0, fresh.total_rdp - discountForCharge)

      // Cobrar primero — solo creamos la orden si el pago es aprobado.
      // Así evitamos órdenes "pending" huérfanas por pagos rechazados.
      let paymentResult: PaymentResult | null = null
      if (form.payMethod === 'azul') {
        paymentResult = await processPayment({
          orderId: crypto.randomUUID(), // referencia temporal, no es el id real de la orden
          amountCents: totalCents,
          itbisCents: fresh.itbis_rdp,
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
            body: JSON.stringify({ action: 'fail' }),
          }).catch(() => {})
          return
        }
      }

      // Armar el payload de items para la función RPC — vendor_id y
      // price_rdp van solo de referencia informativa, la función real
      // los ignora y resuelve todo del lado del servidor. price_rdp lleva
      // el precio unitario de la cotización por coherencia.
      const itemsPayload = items.map((item, index) => ({
        product_id: item.product.id,
        vendor_id: item.product.vendor_id,
        variant_id: item.variant_id ?? null,
        quantity: item.quantity,
        price_rdp: fresh.lines.find(l => l.index === index)?.unit_price_rdp ?? item.variant_price_rdp ?? item.product.price_rdp,
        size: item.selected_size ?? null,
        color: item.selected_color ?? null,
      }))

      // p_discount_rdp ya no existe como parámetro — el descuento se
      // recalcula del lado del servidor contra la fila real del cupón,
      // nunca contra lo que este cliente haya mostrado en pantalla.
      const { data: orderId, error: rpcError } = await supabase.rpc('create_order_from_cart', {
        p_delivery_address: form.address,
        p_province_id: provinceRow.id,
        p_payment_method: form.payMethod,
        p_notes: form.notes || null,
        p_items: itemsPayload,
        p_coupon_id: appliedCoupon?.coupon_id ?? null,
        p_recipient_name: form.isForSomeoneElse ? form.recipientName.trim() : null,
        p_recipient_phone: form.isForSomeoneElse ? normalizePhone(form.recipientPhone) : null,
      })

      if (rpcError) {
        console.error('[RPC ERROR DETALLE]', JSON.stringify(rpcError, null, 2))
        throw rpcError
      }

      // El uso del cupón lo cuenta create_order_from_cart dentro de la misma
      // transacción (apply_coupon_use). No se vuelve a llamar aquí: contaría
      // dos usos por pedido.

      // Contacto del comprador para la tienda (orders.buyer_name /
      // buyer_phone). create_order_from_cart ya los rellena con el perfil;
      // aquí se guardan los que la persona escribió en este formulario. Si
      // falla no se interrumpe nada: el pedido ya existe con el contacto
      // del perfil.
      const { error: contactError } = await supabase.rpc('set_order_buyer_contact', {
        p_order_id: orderId,
        p_buyer_name: form.fullName.trim(),
        p_buyer_phone: normalizePhone(form.phone),
      })
      if (contactError) console.error('[checkout] set_order_buyer_contact', contactError)

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

      // En modo express solo se limpia el ítem efímero — el carrito real
      // de la persona (si tenía algo adentro) queda intacto, nunca se tocó.
      if (isExpressMode) {
        clearExpressItem()
      } else {
        clearCart()
      }
      router.push(`/confirm?order=${orderId}`)
    } catch (err) {
      console.error('[checkout]', err)
      // Nunca el texto crudo del RPC — solo errores conocidos (por
      // ERRCODE) se traducen a un mensaje específico, el resto cae al
      // genérico de siempre. Ver lib/orderErrors.ts.
      const knownKey = resolveKnownError(err as SupabaseErrorLike, KNOWN_ORDER_ERRORS)
      setError(
        knownKey === 'SELF_PURCHASE' ? t('selfPurchaseError') :
        knownKey === 'PRODUCT_UNAVAILABLE' ? t('productUnavailableError') :
        knownKey === 'VARIANT_UNAVAILABLE' ? t('variantUnavailableError') :
        knownKey === 'INSUFFICIENT_STOCK' ? t('insufficientStockError') :
        knownKey === 'PRICES_CHANGED' ? t('pricesChangedError') :
        knownKey === 'COUPON_INVALID' ? t('couponInvalidError') :
        t('genericOrderError'),
      )
      setLoading(false)
    }
  }

  // Mientras sessionStorage todavía no terminó de hidratar en modo
  // express, no se sabe todavía si el ítem existe — no mostrar "carrito
  // vacío" por un instante en el caso normal (ítem sí existe). El
  // useEffect de arriba ya se encarga de redirigir si en verdad no está.
  if (isExpressMode && !expressHydrated) {
    return <div style={{ minHeight: '100vh', background: BRAND.bg }}><Navbar /></div>
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.bg }}>
        <Navbar />
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <h2 style={{ fontSize: 'var(--text-h3)', fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>{t('emptyCartTitle')}</h2>
          <p style={{ color: BRAND.gray, fontSize: 'var(--text-ui)', marginBottom: 24 }}>{t('emptyCartSub')}</p>
          <a href="/" style={{ display: 'inline-block', background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', padding: '12px 28px', borderRadius: 'var(--radius-control)', fontWeight: 600, boxShadow: 'var(--shadow-button)' }}>
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
          <div style={{ background: 'var(--color-card-bg)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 'var(--text-h4)', fontWeight: 700, marginBottom: 18, color: BRAND.dark }}>{t('deliveryAddressHeading')}</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder={t('fullNamePlaceholder')}
                style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '11px 14px', fontSize: 'var(--text-ui)', outline: 'none', boxSizing: 'border-box' }}
              />
              <div>
                <input
                  name="phone"
                  {...PHONE_INPUT_PROPS}
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={() => handlePhoneBlur('phone')}
                  aria-invalid={!!phoneErrors.phone}
                  placeholder={t('phonePlaceholder')}
                  style={{ width: '100%', border: `1px solid ${phoneErrors.phone ? BRAND.red : 'var(--color-border)'}`, borderRadius: 'var(--radius-control)', padding: '11px 14px', fontSize: 'var(--text-ui)', outline: 'none', boxSizing: 'border-box' }}
                />
                {phoneErrors.phone && <p style={{ fontSize: 'var(--text-small)', fontWeight: 500, color: BRAND.red, margin: '4px 0 0' }}>{phoneErrors.phone}</p>}
              </div>
              <div>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder={t('addressPlaceholder')}
                  style={{ width: '100%', border: `1px solid ${addressError ? BRAND.red : 'var(--color-border)'}`, borderRadius: 'var(--radius-control)', padding: '11px 14px', fontSize: 'var(--text-ui)', outline: 'none', boxSizing: 'border-box' }}
                />
                {addressError && <p style={{ fontSize: 'var(--text-small)', fontWeight: 500, color: BRAND.red, margin: '4px 0 0' }}>{addressError}</p>}
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '11px 14px', fontSize: 'var(--text-ui)', outline: 'none', boxSizing: 'border-box', appearance: 'none', background: '#fff', color: form.province ? BRAND.dark : BRAND.gray }}
                >
                  <option value="">{t('selectProvincePlaceholder')}</option>
                  {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                <ChevronDown size={16} color={BRAND.gray} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-ui)', color: BRAND.dark, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isForSomeoneElse}
                  onChange={handleForSomeoneElseToggle}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                {t('isForSomeoneElseLabel')}
              </label>

              {form.isForSomeoneElse && (
                <>
                  <input
                    name="recipientName"
                    value={form.recipientName}
                    onChange={handleChange}
                    placeholder={t('recipientNamePlaceholder')}
                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '11px 14px', fontSize: 'var(--text-ui)', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div>
                    <input
                      name="recipientPhone"
                      {...PHONE_INPUT_PROPS}
                      value={form.recipientPhone}
                      onChange={handleChange}
                      onBlur={() => handlePhoneBlur('recipientPhone')}
                      aria-invalid={!!phoneErrors.recipientPhone}
                      placeholder={t('recipientPhonePlaceholder')}
                      style={{ width: '100%', border: `1px solid ${phoneErrors.recipientPhone ? BRAND.red : 'var(--color-border)'}`, borderRadius: 'var(--radius-control)', padding: '11px 14px', fontSize: 'var(--text-ui)', outline: 'none', boxSizing: 'border-box' }}
                    />
                    {phoneErrors.recipientPhone && <p style={{ fontSize: 'var(--text-small)', fontWeight: 500, color: BRAND.red, margin: '4px 0 0' }}>{phoneErrors.recipientPhone}</p>}
                  </div>
                </>
              )}

              <div>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder={t('notesPlaceholder')}
                  rows={2}
                  style={{ width: '100%', border: `1px solid ${notesError ? BRAND.red : 'var(--color-border)'}`, borderRadius: 'var(--radius-control)', padding: '11px 14px', fontSize: 'var(--text-ui)', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                />
                {notesError && <p style={{ fontSize: 'var(--text-small)', fontWeight: 500, color: BRAND.red, margin: '4px 0 0' }}>{notesError}</p>}
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div style={{ background: 'var(--color-card-bg)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 24 }}>
            <h2 style={{ fontSize: 'var(--text-h4)', fontWeight: 700, marginBottom: 18, color: BRAND.dark }}>{t('paymentMethodHeading')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {PAYMENT_METHOD_KEYS.map(m => (
                <label
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    border: `1px solid ${form.payMethod === m.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-pill)', cursor: 'pointer',
                    background: form.payMethod === m.id ? 'var(--color-primary)' : 'transparent',
                    transition: 'all var(--transition-fast)',
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
                  <span style={{ fontSize: 'var(--text-small)', fontWeight: 500, color: form.payMethod === m.id ? '#fff' : BRAND.dark }}>{t(m.labelKey)}</span>
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
                  style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '11px 14px', fontSize: 'var(--text-ui)', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input
                    name="cardExpiration"
                    value={form.cardExpiration}
                    onChange={handleChange}
                    placeholder={t('cardExpirationPlaceholder')}
                    maxLength={4}
                    inputMode="numeric"
                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '11px 14px', fontSize: 'var(--text-ui)', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <input
                    name="cardCvc"
                    value={form.cardCvc}
                    onChange={handleChange}
                    placeholder={t('cardCvcPlaceholder')}
                    maxLength={4}
                    inputMode="numeric"
                    style={{ width: '100%', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', padding: '11px 14px', fontSize: 'var(--text-ui)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <p style={{ fontSize: 'var(--text-badge)', color: BRAND.gray, margin: 0 }}>
                  {t('mockModeNotice')}
                </p>
              </div>
            )}

            {form.payMethod === 'cardnet' && (
              <div style={{ marginTop: 14, padding: 12, background: '#FFF8E1', borderRadius: 8, border: '1px solid #FFE082', fontSize: 'var(--text-small)', color: '#5D4037' }}>
                {t('cardnetRedirectNotice')}
              </div>
            )}
          </div>
        </div>

        {/* Resumen lateral */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: 'var(--color-card-bg)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 20, marginBottom: 12 }}>
            <h2 style={{ fontSize: 'var(--text-h4)', fontWeight: 700, marginBottom: 14, color: BRAND.dark }}>
              {items.length === 1
                ? t('orderItemsCountOne', { count: items.length })
                : t('orderItemsCountOther', { count: items.length })}
            </h2>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {items.map((item, index) => {
                const line = q?.lines.find(l => l.index === index)
                const problem = lineProblem(line)
                return (
                <div key={`${item.product.id}-${item.variant_id ?? `${item.selected_size}-${item.selected_color}`}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 6, background: BRAND.bg, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                    {item.product.images?.[0] ? (
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="44px" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: BRAND.dark, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product.name}
                    </p>
                    <p style={{ fontSize: 'var(--text-badge)', color: BRAND.gray, margin: '2px 0 0' }}>
                      x{item.quantity}
                      {item.variant_label
                        ? ` · ${item.variant_label}`
                        : <>
                            {item.selected_size && ` · ${item.selected_size}`}
                            {item.selected_color && ` · ${item.selected_color}`}
                          </>}
                    </p>
                    {problem && (
                      <p style={{ fontSize: 'var(--text-badge)', fontWeight: 600, color: BRAND.red, margin: '2px 0 0' }}>
                        {problem === 'unavailable' ? t('lineUnavailable') : t('onlyNLeft', { count: line?.available_quantity ?? 0 })}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: BRAND.dark, flexShrink: 0 }}>
                    {line?.line_total_rdp != null ? fmt(line.line_total_rdp) : '—'}
                  </span>
                </div>
                )
              })}
            </div>
            {quoteHasLineIssues && (
              <div style={{ fontSize: 'var(--text-small)', color: BRAND.red, marginBottom: 12 }}>
                {t('itemsBlockedNotice')}{' '}
                <a href={backHref} style={{ color: BRAND.blue, fontWeight: 600 }}>{t('backToCart')}</a>
              </div>
            )}

            {/* Cupón */}
            <div style={{ borderTop: '1px solid #EEE', paddingTop: 12, marginBottom: 12 }}>
              <label style={{ fontSize: 'var(--text-caption)', color: BRAND.gray, display: 'block', marginBottom: 6 }}>
                {t('couponQuestion')}
              </label>
              {!user ? (
                <a
                  href={`/login?redirect=${encodeURIComponent(isExpressMode ? `/checkout?${searchParams.toString()}` : '/checkout')}`}
                  style={{ fontSize: 'var(--text-small)', color: BRAND.blue, fontWeight: 600 }}
                >
                  {t('couponLoginRequired')}
                </a>
              ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder={t('couponPlaceholder')}
                  disabled={!!appliedCoupon}
                  style={{
                    flex: 1, border: '1px solid #E0E0E0', borderRadius: 8, padding: '9px 12px',
                    fontSize: 'var(--text-small)', outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase',
                    background: appliedCoupon ? '#F5F5F5' : '#fff',
                  }}
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{ border: '1px solid #E0E0E0', background: '#fff', color: BRAND.gray, borderRadius: 8, padding: '9px 14px', fontSize: 'var(--text-small)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {t('removeCoupon')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponApplying || !couponCode.trim() || !q}
                    style={{
                      border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 'var(--text-small)', fontWeight: 600,
                      color: '#fff', whiteSpace: 'nowrap',
                      background: couponApplying || !couponCode.trim() || !q ? '#ccc' : BRAND.dark,
                      cursor: couponApplying || !couponCode.trim() || !q ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {couponApplying ? '...' : t('applyCoupon')}
                  </button>
                )}
              </div>
              )}
              {couponError && <p style={{ fontSize: 'var(--text-small)', fontWeight: 500, color: BRAND.red, margin: '6px 0 0' }}>{couponError}</p>}
              {appliedCoupon && (
                <p style={{ fontSize: 'var(--text-small)', color: '#2E7D32', margin: '6px 0 0', fontWeight: 600 }}>
                  {t('couponAppliedMsg', { code: appliedCoupon.code })}
                </p>
              )}
            </div>

            <div style={{ borderTop: '1px solid #EEE', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-small)', color: BRAND.dark }}>
                <span>{t('subtotalLabel')}</span><span>{q ? fmt(subtotal) : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-small)', color: BRAND.dark }}>
                <span>
                  {t('shippingLabel')}
                  {shippingRate && (
                    <span style={{ display: 'block', fontSize: 'var(--text-badge)', color: BRAND.gray }}>
                      {shippingRate.estimated_days_min === shippingRate.estimated_days_max
                        ? t(shippingRate.estimated_days_min === 1 ? 'shippingDaysOne' : 'shippingDaysOther', { count: shippingRate.estimated_days_min })
                        : t('shippingDaysRange', { min: shippingRate.estimated_days_min, max: shippingRate.estimated_days_max })}
                    </span>
                  )}
                </span>
                <span>
                  {!form.province
                    ? t('selectProvinceHint')
                    : !quoteReady
                      ? t('calculatingShipping')
                      : qualifiesFreeShipping
                        ? (
                          <>
                            {shippingRate && (
                              <span style={{ textDecoration: 'line-through', color: BRAND.gray, marginRight: 6 }}>
                                {fmt(shippingRate.price_rdp)}
                              </span>
                            )}
                            <span style={{ color: 'var(--color-green)', fontWeight: 700 }}>{t('freeBadge')}</span>
                          </>
                        )
                        : fmt(ENVIO)}
                </span>
              </div>
              {form.province && quoteReady && !qualifiesFreeShipping && (
                <p style={{ fontSize: 'var(--text-badge)', color: BRAND.gray, margin: '-2px 0 0', textAlign: 'right' }}>
                  {t('freeShippingThresholdNote')}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-small)', color: BRAND.dark }}>
                <span>{t('itbisLabel')}</span><span>{q ? fmt(itbis) : '—'}</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-small)', color: 'var(--color-green)', fontWeight: 600 }}>
                  <span>{t('discountLabel', { code: appliedCoupon.code })}</span>
                  <span>-{fmt(discountRdp)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 700, fontSize: 'var(--text-ui)', borderTop: '1px solid #EEE', paddingTop: 10, marginTop: 4, color: BRAND.dark }}>
                <span>{t('totalLabel')}</span>
                <span style={{ fontSize: 'var(--text-price-card)', fontWeight: 700, lineHeight: 'var(--leading-price)', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', letterSpacing: 'var(--tracking-heading)' }}>
                  {quoteReady ? fmt(totalToPay) : '—'}
                </span>
              </div>
            </div>
          </div>

          {quoteStatus === 'error' && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 14px', fontSize: 'var(--text-small)', color: '#C62828', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span>{t('quoteErrorNotice')}</span>
              <button type="button" onClick={reloadQuote} style={{ border: '1px solid #FFCDD2', background: '#fff', color: '#C62828', borderRadius: 8, padding: '6px 12px', fontSize: 'var(--text-small)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {t('retryButton')}
              </button>
            </div>
          )}

          {error && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 14px', fontSize: 'var(--text-small)', color: '#C62828', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <p style={{ fontSize: 'var(--text-badge)', color: BRAND.gray, textAlign: 'center', marginBottom: 10 }}>
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
            disabled={submitBlocked}
            style={{
              display: 'block', width: '100%', background: submitBlocked ? '#ccc' : 'var(--color-primary)',
              color: '#fff', border: 'none', padding: 14, borderRadius: 'var(--radius-control)',
              fontWeight: 600, fontSize: 'var(--text-body)', cursor: submitBlocked ? 'not-allowed' : 'pointer',
              marginBottom: 10,
              boxShadow: submitBlocked ? 'none' : 'var(--shadow-button)',
            }}
          >
            {loading ? t('processingPayment') : quoteStatus === 'loading' ? t('quoteLoadingButton') : rateLimited ? t('rateLimitedButton') : t('confirmAndPay')}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'var(--color-green-subtle)', borderRadius: 'var(--radius-control)', color: 'var(--color-green)' }}>
            <ShieldCheck size={15} color="currentColor" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-badge)' }}>{t('securePaymentNotice')}</span>
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageContent />
    </Suspense>
  )
}
