'use client'
// ============================================================
// MercadoRD — Checkout
// Ruta: src/app/checkout/page.tsx
// ============================================================
// Entrega y pago en una sola página (el flujo real: Carrito → Entrega y pago
// → Confirmación en /confirm). Los precios, el envío, el ITBIS y el total los
// calcula el servidor (quote_cart); aquí solo se muestran. La lógica de
// pedido (cotización fresca, cupón, cobro simulado, create_order_from_cart)
// es la de siempre; lo que cambió es la presentación, los errores junto a
// cada campo y la protección contra doble envío.
// ============================================================

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, Check, ChevronDown, CreditCard, Info, MapPin, ShieldCheck, Tag, Truck } from 'lucide-react'
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
import { useCartQuote, fetchCartQuote, quoteBlocksPurchase, type CartQuote } from '@/lib/cart/quote'
import { resolveKnownError, KNOWN_ORDER_ERRORS, type SupabaseErrorLike } from '@/lib/orderErrors'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatRdp } from '@/lib/formatRdp'
import { DEFAULT_PAYMENT_METHOD, isPaymentMethodSelectable, paymentMethodStatus } from '@/lib/checkout/paymentMethods'
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps'
import { CheckoutField } from '@/components/checkout/CheckoutField'
import { CheckoutOrderItems } from '@/components/checkout/CheckoutOrderItems'
import { PaymentMethodPicker } from '@/components/checkout/PaymentMethodPicker'
import { CheckoutStyles } from '@/components/checkout/CheckoutStyles'

interface AppliedCoupon {
  valid: true
  coupon_id: string
  code: string
  type: string
  value: number
  discount_rdp: number
  vendor_id: string | null
}

// Campos que pueden mostrar un error junto a ellos, en el orden en que
// aparecen en la página (el primero con error recibe el foco).
type FieldName =
  | 'fullName' | 'phone' | 'province' | 'address'
  | 'recipientName' | 'recipientPhone' | 'notes'
  | 'cardNumber' | 'cardExpiration' | 'cardCvc'
type FieldErrors = Partial<Record<FieldName, string>>
const FIELD_ORDER: FieldName[] = [
  'fullName', 'phone', 'province', 'address',
  'recipientName', 'recipientPhone', 'notes',
  'cardNumber', 'cardExpiration', 'cardCvc',
]

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

  // El carrito se lee de localStorage cuando la página ya está en el navegador:
  // en el primer pintado todavía aparece vacío. Hasta que esté leído no se
  // muestra «Tu carrito está vacío» (la persona tiene productos; sería un aviso falso).
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // El pedido ya se creó y se está yendo a /confirm: al vaciar el carrito (o
  // el ítem express) esta página no debe mostrar «carrito vacío» ni volver
  // a la ficha del producto mientras dura la navegación.
  const [placed, setPlaced] = useState(false)

  // Si el flag express está pero sessionStorage no tiene ningún ítem
  // (ej. se limpió entre el click y esta carga, o alguien pegó la URL a
  // mano) — nunca caer al carrito completo por error: volver a la
  // página del producto (el id viaja en la misma URL) o, si tampoco
  // está, a inicio. Espera a que la hidratación de sessionStorage
  // termine antes de decidir "no hay ítem" (si no, redirige en cada F5).
  useEffect(() => {
    if (!isExpressMode || !expressHydrated || expressItem || placed) return
    const productId = searchParams.get('producto')
    router.replace(productId ? `/producto/${productId}` : '/')
  }, [isExpressMode, expressHydrated, expressItem, placed, searchParams, router])

  const [form, setForm] = useState({
    fullName:   profile?.full_name || '',
    phone:      formatPhone(profile?.phone),
    address:    '',
    province:   '',
    notes:      '',
    isForSomeoneElse: false,
    recipientName:  '',
    recipientPhone: '',
    payMethod:  DEFAULT_PAYMENT_METHOD as string,
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
  // Segundo seguro contra el doble envío: el estado `loading` se actualiza
  // al terminar el evento, esta marca es inmediata.
  const inFlightRef = useRef(false)
  const [error, setError]   = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  // Errores junto a cada campo (obligatorio, teléfono, dirección, notas, tarjeta).
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [provinces, setProvinces] = useState<Province[]>([])
  const [provincesStatus, setProvincesStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  // Productos del pedido: plegados en pantallas chicas (en escritorio siempre
  // se ven). Se abren solos si algún producto tiene un problema.
  const [itemsOpen, setItemsOpen] = useState(false)

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
  const submitBlocked = loading || rateLimited || quoteStatus === 'loading' || quoteStatus === 'error'
    || quoteHasLineIssues || (!!form.province && !quoteReady)
  const backHref = isExpressMode ? (expressItem ? `/producto/${expressItem.product.id}` : '/') : '/cart'

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('provinces_rd')
      .select('id, name, code')
      .order('name')
      .then(({ data, error }) => {
        setProvinces(data ?? [])
        setProvincesStatus(error ? 'error' : 'ready')
      }, () => setProvincesStatus('error'))
  }, [])

  // Usa la provincia ya elegida en el Navbar como valor inicial del checkout
  useEffect(() => {
    if (selectedProvince && !form.province) {
      setForm(f => ({ ...f, province: selectedProvince.name }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince])

  // Si algún producto tiene un problema, la lista se muestra abierta.
  useEffect(() => {
    if (quoteHasLineIssues) setItemsOpen(true)
  }, [quoteHasLineIssues])

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

  // Pone o quita el error de un campo.
  const setFieldError = (name: FieldName, message: string | null) => {
    setFieldErrors(prev => {
      if (!message && !prev[name]) return prev
      const next = { ...prev }
      if (message) next[name] = message
      else delete next[name]
      return next
    })
  }

  // Lleva el foco al campo con error (después de que React pinte el error,
  // para que el lector de pantalla lo lea junto al campo).
  const focusField = (name: FieldName) => {
    setTimeout(() => {
      const el = document.getElementById(`ck-${name}`)
      if (!el) return
      el.scrollIntoView({ block: 'center' })
      el.focus({ preventScroll: true })
    }, 0)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    editedFieldsRef.current.add(e.target.name)
    // Al escribir en un campo con error, el error se quita.
    setFieldError(e.target.name as FieldName, null)
    // Al cambiar de método de pago, los errores de la tarjeta ya no aplican:
    // si vuelve a elegir tarjeta no debe encontrarse errores viejos.
    if (e.target.name === 'payMethod') {
      setFieldErrors(prev => {
        const next = { ...prev }
        delete next.cardNumber
        delete next.cardExpiration
        delete next.cardCvc
        return next
      })
    }
  }

  // Al salir del campo: error si no es un número dominicano válido; si
  // lo es, se reescribe como 809-555-1234 (lo que se guarda).
  const handlePhoneBlur = (name: 'phone' | 'recipientPhone') => {
    const value = form[name]
    if (!value.trim()) return
    if (!normalizePhone(value)) {
      setFieldError(name, tc('phoneInvalid'))
      return
    }
    setFieldError(name, null)
    setForm(f => ({ ...f, [name]: formatPhone(value) }))
  }

  const handleForSomeoneElseToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setForm(f => ({ ...f, isForSomeoneElse: checked }))
    if (!checked) {
      setFieldError('recipientName', null)
      setFieldError('recipientPhone', null)
    }
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
    if (!couponCode.trim() || !q || !user || couponApplying) return
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

  // Termina un intento de envío que no llegó a crear el pedido.
  const endSubmit = () => {
    inFlightRef.current = false
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (inFlightRef.current) return
    if (!user) {
      const redirectTo = isExpressMode ? `/checkout?${searchParams.toString()}` : '/checkout'
      router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`)
      return
    }
    setError(null)

    // Validación de los campos: todos los errores a la vez, cada uno junto a
    // su campo, y el foco va al primero. Misma regla de longitud y caracteres
    // que lib/validation.ts validateText(), con el mensaje traducido —
    // validateText arma el string completo en español y lo comparten 4
    // componentes más fuera del alcance de este namespace, así que no se toca.
    const errors: FieldErrors = {}
    if (!form.fullName.trim()) errors.fullName = t('requiredFieldError')

    if (!form.phone.trim()) errors.phone = t('requiredFieldError')
    else if (!normalizePhone(form.phone)) errors.phone = tc('phoneInvalid')

    if (!form.province) errors.province = t('provinceRequiredError')

    const addressTrimmed = form.address.trim()
    if (!addressTrimmed) errors.address = t('requiredFieldError')
    else if (addressTrimmed.length < 10 || addressTrimmed.length > 200) errors.address = t('addressLengthError', { min: 10, max: 200 })
    else if (DANGEROUS_PATTERN.test(addressTrimmed)) errors.address = t('addressInvalidChars')

    if (form.isForSomeoneElse) {
      if (form.recipientName.trim().length < 3) errors.recipientName = t('recipientNameRequiredError')
      if (!form.recipientPhone.trim()) errors.recipientPhone = t('recipientPhoneRequiredError')
      else if (!normalizePhone(form.recipientPhone)) errors.recipientPhone = tc('phoneInvalid')
    }

    const notesTrimmed = form.notes.trim()
    if (notesTrimmed.length > 500) errors.notes = t('notesTooLong', { max: 500 })
    else if (DANGEROUS_PATTERN.test(notesTrimmed)) errors.notes = t('notesInvalidChars')

    if (form.payMethod === 'azul') {
      if (!form.cardNumber.trim()) errors.cardNumber = t('requiredFieldError')
      if (!form.cardExpiration.trim()) errors.cardExpiration = t('requiredFieldError')
      if (!form.cardCvc.trim()) errors.cardCvc = t('requiredFieldError')
    }

    setFieldErrors(errors)
    const firstInvalid = FIELD_ORDER.find(name => errors[name])
    if (firstInvalid) {
      focusField(firstInvalid)
      return
    }

    if (!isPaymentMethodSelectable(form.payMethod)) {
      setError(t('paymentMethodUnavailableError'))
      return
    }
    if (items.length === 0) { router.push('/'); return }
    if (!quoteReady || quoteHasLineIssues) {
      setError(quoteHasLineIssues ? t('itemsBlockedNotice') : t('waitingShippingCalc'))
      return
    }

    inFlightRef.current = true
    setLoading(true)

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
        endSubmit()
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
        endSubmit()
        return
      }
      if (quoteBlocksPurchase(fresh)) {
        setQuote(fresh)
        setError(t('stockChangedNotice'))
        endSubmit()
        return
      }
      if (!q || fresh.total_rdp !== q.total_rdp) {
        setQuote(fresh)
        setError(t('pricesChangedNotice'))
        endSubmit()
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
          endSubmit()
          return
        }
        if (result.coupon.discount_rdp !== appliedCoupon.discount_rdp) {
          setAppliedCoupon(result.coupon)
          setError(t('pricesChangedNotice'))
          endSubmit()
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
          endSubmit()
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

      // El navegador NO escribe en `payments`: esa tabla solo la escribe el
      // servidor (la base rechaza cualquier INSERT de un comprador). Hoy el
      // cobro con tarjeta es simulado en el propio navegador y no cobra nada,
      // así que no hay un pago real que registrar; con el cobro real de Azul
      // lo registra el servidor al confirmar el pago, nunca esta pantalla.

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
      setPlaced(true)
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
      endSubmit()
    }
  }

  // Mientras el carrito (localStorage) o, en modo express, sessionStorage
  // todavía no terminaron de leerse, no se sabe si hay productos — no mostrar
  // "carrito vacío" por un instante en el caso normal (ítem sí existe). El
  // useEffect de arriba ya se encarga de redirigir si en verdad no está.
  if (!mounted || (isExpressMode && !expressHydrated)) {
    return <div style={{ minHeight: '100vh', background: BRAND.bg }}><Navbar /></div>
  }

  // Pedido creado: se está yendo a la confirmación.
  if (placed) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.bg }}>
        <Navbar />
        <main className="ck-shell">
          <p role="status" className="ck-redirecting">
            <span className="ck-spinner" aria-hidden="true" />
            {t('processingPayment')}
          </p>
        </main>
        <CheckoutStyles />
      </div>
    )
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

  // ── Textos derivados de la cotización y del método de pago ──
  const deliveryDaysText = shippingRate
    ? (shippingRate.estimated_days_min === shippingRate.estimated_days_max
        ? t(shippingRate.estimated_days_min === 1 ? 'shippingDaysOne' : 'shippingDaysOther', { count: shippingRate.estimated_days_min })
        : t('shippingDaysRange', { min: shippingRate.estimated_days_min, max: shippingRate.estimated_days_max }))
    : null
  // Tiempo de entrega de la provincia (shipping_rates), junto al selector.
  const estimateText = !form.province
    ? t('deliveryEstimateHint')
    : deliveryDaysText
      ? t('deliveryEstimateLine', { days: deliveryDaysText })
      : shippingLoading ? t('calculatingShipping') : null
  const provinceError = fieldErrors.province ?? (provincesStatus === 'error' ? t('provincesLoadError') : null)
  const totalText = quoteReady ? formatRdp(totalToPay) : null
  const methodStatus = paymentMethodStatus(form.payMethod)
  const ctaLabel =
    loading ? t('processingPayment')
    : quoteStatus === 'loading' ? t('quoteLoadingButton')
    : rateLimited ? t('rateLimitedButton')
    : quoteStatus !== 'error' && !!form.province && !quoteReady ? t('calculatingShippingButton')
    : methodStatus === 'manual'
      ? (totalText ? t('confirmOrderButton', { total: totalText }) : t('confirmOrderButtonNoTotal'))
      : (totalText ? t('payButton', { total: totalText }) : t('payButtonNoTotal'))
  const loginHref = `/login?redirect=${encodeURIComponent(isExpressMode ? `/checkout?${searchParams.toString()}` : '/checkout')}`

  return (
    <div style={{ minHeight: '100vh', background: BRAND.bg }}>
      <Navbar />

      <main className="ck-shell">
        <h1 className="ck-h1">{t('pageTitle')}</h1>
        <CheckoutSteps backHref={backHref} isExpress={isExpressMode} />

        <div className="ck-grid">

          <div className="ck-main">

            {/* Dirección */}
            <section className="ck-card" aria-labelledby="ck-delivery-title">
              <div className="ck-card-head">
                <span className="ck-card-icon" aria-hidden="true"><MapPin size={20} /></span>
                <div>
                  <h2 id="ck-delivery-title" className="ck-card-title">{t('deliveryAddressHeading')}</h2>
                  <p className="ck-card-sub">{t('deliveryAddressSub')} {t('requiredLegend')}</p>
                </div>
              </div>

              <div className="ck-fields">
                <CheckoutField id="ck-fullName" label={t('fullNameLabel')} required error={fieldErrors.fullName}>
                  {aria => (
                    <input
                      {...aria}
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder={t('fullNamePlaceholder')}
                      className="ck-input"
                    />
                  )}
                </CheckoutField>

                <CheckoutField id="ck-phone" label={t('phoneLabel')} required error={fieldErrors.phone}>
                  {aria => (
                    <input
                      {...aria}
                      name="phone"
                      {...PHONE_INPUT_PROPS}
                      value={form.phone}
                      onChange={handleChange}
                      onBlur={() => handlePhoneBlur('phone')}
                      placeholder={t('phonePlaceholder')}
                      className="ck-input"
                    />
                  )}
                </CheckoutField>

                <CheckoutField id="ck-province" label={t('provinceLabel')} required error={provinceError}>
                  {aria => (
                    <div className="ck-select-wrap">
                      <select
                        {...aria}
                        name="province"
                        value={form.province}
                        onChange={handleChange}
                        className="ck-input"
                        data-empty={!form.province}
                      >
                        <option value="">{provincesStatus === 'loading' ? t('provincesLoading') : t('selectProvincePlaceholder')}</option>
                        {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                      </select>
                      <ChevronDown size={16} className="ck-select-chevron" aria-hidden="true" />
                    </div>
                  )}
                </CheckoutField>

                {estimateText && (
                  <div className="ck-estimate-cell">
                    <span className="ck-label-row ck-label-spacer" aria-hidden="true"><span className="ck-label">&nbsp;</span></span>
                    <div className="ck-estimate" role="status">
                      <Truck size={18} aria-hidden="true" />
                      <span>{estimateText}</span>
                    </div>
                  </div>
                )}

                <CheckoutField id="ck-address" label={t('addressLabel')} required hint={t('addressHint')} error={fieldErrors.address} className="ck-span-all">
                  {aria => (
                    <input
                      {...aria}
                      name="address"
                      type="text"
                      autoComplete="street-address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder={t('addressPlaceholder')}
                      className="ck-input"
                    />
                  )}
                </CheckoutField>

                <div className="ck-span-all">
                  <label className="ck-checkbox">
                    <input
                      type="checkbox"
                      checked={form.isForSomeoneElse}
                      onChange={handleForSomeoneElseToggle}
                    />
                    {t('isForSomeoneElseLabel')}
                  </label>
                </div>

                {form.isForSomeoneElse && (
                  <>
                    <CheckoutField id="ck-recipientName" label={t('recipientNameLabel')} required error={fieldErrors.recipientName}>
                      {aria => (
                        <input
                          {...aria}
                          name="recipientName"
                          type="text"
                          autoComplete="off"
                          value={form.recipientName}
                          onChange={handleChange}
                          placeholder={t('recipientNamePlaceholder')}
                          className="ck-input"
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField id="ck-recipientPhone" label={t('recipientPhoneLabel')} required error={fieldErrors.recipientPhone}>
                      {aria => (
                        <input
                          {...aria}
                          name="recipientPhone"
                          {...PHONE_INPUT_PROPS}
                          autoComplete="off"
                          value={form.recipientPhone}
                          onChange={handleChange}
                          onBlur={() => handlePhoneBlur('recipientPhone')}
                          placeholder={t('recipientPhonePlaceholder')}
                          className="ck-input"
                        />
                      )}
                    </CheckoutField>
                  </>
                )}

                <CheckoutField
                  id="ck-notes"
                  label={t('notesLabel')}
                  aside={t('notesCounter', { count: form.notes.length, max: 500 })}
                  error={fieldErrors.notes}
                  className="ck-span-all"
                >
                  {aria => (
                    <textarea
                      {...aria}
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      placeholder={t('notesPlaceholder')}
                      rows={3}
                      className="ck-input"
                    />
                  )}
                </CheckoutField>
              </div>
            </section>

            {/* Método de pago */}
            <section className="ck-card" aria-labelledby="ck-payment-title">
              <div className="ck-card-head">
                <span className="ck-card-icon" aria-hidden="true"><CreditCard size={20} /></span>
                <div>
                  <h2 id="ck-payment-title" className="ck-card-title">{t('paymentMethodHeading')}</h2>
                  <p className="ck-card-sub">{t('paymentMethodSub')}</p>
                </div>
              </div>

              <PaymentMethodPicker value={form.payMethod} onChange={handleChange} />

              {form.payMethod === 'azul' && (
                <div className="ck-card-form">
                  <h3 className="ck-card-form-title">{t('cardDetailsHeading')}</h3>
                  <div className="ck-card-fields">
                    <CheckoutField id="ck-cardNumber" label={t('cardNumberLabel')} required error={fieldErrors.cardNumber} className="ck-span-all">
                      {aria => (
                        <input
                          {...aria}
                          name="cardNumber"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          value={form.cardNumber}
                          onChange={handleChange}
                          placeholder={t('cardNumberPlaceholder')}
                          className="ck-input"
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField id="ck-cardExpiration" label={t('cardExpirationLabel')} required error={fieldErrors.cardExpiration}>
                      {aria => (
                        <input
                          {...aria}
                          name="cardExpiration"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          maxLength={4}
                          value={form.cardExpiration}
                          onChange={handleChange}
                          placeholder={t('cardExpirationPlaceholder')}
                          className="ck-input"
                        />
                      )}
                    </CheckoutField>
                    <CheckoutField id="ck-cardCvc" label={t('cardCvcLabel')} required error={fieldErrors.cardCvc}>
                      {aria => (
                        <input
                          {...aria}
                          name="cardCvc"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          maxLength={4}
                          value={form.cardCvc}
                          onChange={handleChange}
                          placeholder={t('cardCvcPlaceholder')}
                          className="ck-input"
                        />
                      )}
                    </CheckoutField>
                  </div>
                  <div className="ck-notice" data-tone="warning">
                    <Info size={16} aria-hidden="true" />
                    <span>{t('mockModeNotice')}</span>
                  </div>
                </div>
              )}

              {methodStatus === 'manual' && (
                <div className="ck-notice" data-tone="info">
                  <Info size={16} aria-hidden="true" />
                  <span>{t('manualPaymentNotice')}</span>
                </div>
              )}
            </section>
          </div>

          {/* Productos del pedido. Va después del formulario en el código (así el teclado recorre
              formulario → productos → total, como se ve en escritorio); en pantallas chicas la
              rejilla lo muestra primero. */}
          <CheckoutOrderItems
            items={items}
            lines={q?.lines}
            totalText={totalText}
            backHref={backHref}
            isExpress={isExpressMode}
            open={itemsOpen}
            onToggle={() => setItemsOpen(o => !o)}
          />

          {/* Cupón, desglose y confirmación */}
          <div className="ck-card ck-totals">
            {quoteHasLineIssues && (
              <div className="ck-banner ck-banner-top" role="alert">
                <AlertTriangle size={16} aria-hidden="true" />
                <div className="ck-banner-body">
                  {t('itemsBlockedNotice')}{' '}
                  <a href={backHref} className="ck-link">{t('backToCart')}</a>
                </div>
              </div>
            )}

            {/* Cupón */}
            <div className="ck-coupon">
              {user ? (
                <label htmlFor="ck-coupon" className="ck-coupon-label">
                  <Tag size={16} aria-hidden="true" />
                  {t('couponQuestion')}
                </label>
              ) : (
                <p className="ck-coupon-label">
                  <Tag size={16} aria-hidden="true" />
                  {t('couponQuestion')}
                </p>
              )}
              {!user ? (
                <a href={loginHref} className="ck-link">{t('couponLoginRequired')}</a>
              ) : (
                <div className="ck-coupon-row">
                  <input
                    id="ck-coupon"
                    className="ck-input ck-coupon-input"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !appliedCoupon) {
                        e.preventDefault()
                        handleApplyCoupon()
                      }
                    }}
                    placeholder={t('couponPlaceholder')}
                    disabled={!!appliedCoupon}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-invalid={couponError ? true : undefined}
                    aria-describedby={couponError ? 'ck-coupon-error' : undefined}
                  />
                  {appliedCoupon ? (
                    <button type="button" className="ck-btn-sm" data-kind="secondary" onClick={handleRemoveCoupon}>
                      {t('removeCoupon')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="ck-btn-sm"
                      data-kind="primary"
                      onClick={handleApplyCoupon}
                      disabled={couponApplying || !couponCode.trim() || !q}
                    >
                      {couponApplying ? t('couponApplying') : t('applyCoupon')}
                    </button>
                  )}
                </div>
              )}
              {couponError && <p id="ck-coupon-error" className="ck-error" role="alert"><AlertTriangle size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} /><span>{couponError}</span></p>}
              {appliedCoupon && (
                <p className="ck-coupon-ok" role="status">
                  <Check size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{t('couponAppliedMsg', { code: appliedCoupon.code })}</span>
                </p>
              )}
            </div>

            {/* Desglose: todo viene de la cotización del servidor */}
            <dl className="ck-rows">
              <div className="ck-row">
                <dt>{t('subtotalLabel')}</dt>
                <dd>{q ? formatRdp(subtotal) : '—'}</dd>
              </div>
              {appliedCoupon && (
                <div className="ck-row" data-tone="discount">
                  <dt>{t('discountLabel', { code: appliedCoupon.code })}</dt>
                  <dd>-{formatRdp(discountRdp)}</dd>
                </div>
              )}
              <div className="ck-row">
                <dt>
                  {t('shippingLabel')}
                  {q && form.province && quoteReady && !qualifiesFreeShipping && (
                    <span className="ck-row-sub">{t('freeShippingThresholdNote', { amount: formatRdp(q.free_shipping_threshold_rdp) })}</span>
                  )}
                </dt>
                <dd>
                  {!form.province
                    ? t('selectProvinceHint')
                    : !quoteReady
                      ? t('calculatingShipping')
                      : qualifiesFreeShipping
                        ? (
                          <>
                            {shippingRate && <span className="ck-strike">{formatRdp(shippingRate.price_rdp)}</span>}
                            <span className="ck-free">{t('freeBadge')}</span>
                          </>
                        )
                        : formatRdp(ENVIO)}
                </dd>
              </div>
              <div className="ck-row">
                <dt>{t('itbisLabel')}</dt>
                <dd>{q ? formatRdp(itbis) : '—'}</dd>
              </div>
            </dl>

            <div className="ck-total">
              <span className="ck-total-label">{t('totalLabel')}</span>
              <span className="ck-total-amount" aria-live="polite" aria-atomic="true">{totalText ?? '—'}</span>
            </div>

            {quoteStatus === 'error' && (
              <div className="ck-banner" role="alert">
                <AlertTriangle size={16} aria-hidden="true" />
                <div className="ck-banner-body">{t('quoteErrorNotice')}</div>
                <button type="button" className="ck-banner-retry" onClick={reloadQuote}>{t('retryButton')}</button>
              </div>
            )}

            {error && (
              <div className="ck-banner" role="alert">
                <AlertTriangle size={16} aria-hidden="true" />
                <div className="ck-banner-body">{error}</div>
              </div>
            )}

            <p className="ck-terms">
              {t('acceptTermsPrefix')}{' '}
              <a href="/terminos" target="_blank" rel="noopener noreferrer">
                {t('termsOfServiceLink')}<span className="sr-only"> {t('opensInNewTab')}</span>
              </a>
              {' '}{t('andWord')}{' '}
              <a href="/privacidad" target="_blank" rel="noopener noreferrer">
                {t('privacyPolicyLink')}<span className="sr-only"> {t('opensInNewTab')}</span>
              </a>
            </p>

            <button
              type="button"
              className="ck-cta"
              onClick={handleSubmit}
              disabled={submitBlocked}
              data-loading={loading}
              aria-busy={loading}
            >
              {loading && <span className="ck-spinner" aria-hidden="true" />}
              <span>{ctaLabel}</span>
            </button>

            {methodStatus === 'simulated' && (
              <p className="ck-footnote">
                <Info size={14} aria-hidden="true" />
                <span>{t('simulatedPaymentNotice')}</span>
              </p>
            )}
            <p className="ck-footnote">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>{t('verifiedTotalsNotice')}</span>
            </p>
          </div>
        </div>
      </main>

      <CheckoutStyles />
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
