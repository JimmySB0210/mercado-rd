'use client'
// ============================================================
// MercadoRD — Carrito
// Ruta: src/app/cart/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { ShoppingCart, Trash2, Minus, Plus, ShieldCheck, AlertTriangle } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { useCartStore, useCartSubtotal, useCartItbis, useCartTotal } from '@/lib/store/cart'
import { Navbar } from '@/components/shop/Navbar'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useLocationStore } from '@/lib/store/location'
import { useCartQuote, lineProblem, quoteBlocksPurchase } from '@/lib/cart/quote'
import { FREE_SHIPPING_THRESHOLD_RDP } from '@/lib/shipping'
import Image from 'next/image'

export default function CartPage() {
  const { t } = useTranslation('cart')
  const { items, updateQty, removeItem } = useCartStore()
  const subtotal = useCartSubtotal()
  const itbis = useCartItbis()
  const total = useCartTotal()
  const { user } = useAuth()

  // Un vendedor no puede comprar su propio producto (create_order_from_cart
  // ya lo rechaza, migración 020) — acá se detecta ANTES de llegar a
  // checkout, para marcar la línea y bloquear "Proceder al pago" con un
  // mensaje claro en vez de dejar que falle recién al pagar.
  const [ownVendorId, setOwnVendorId] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    if (!user) { setOwnVendorId(null); return }
    let cancelled = false
    createClient()
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setOwnVendorId(data?.id ?? null) })
    return () => { cancelled = true }
  }, [user])

  const ownProductItems = ownVendorId
    ? items.filter(i => i.product.vendor_id === ownVendorId)
    : []
  const hasOwnProducts = ownProductItems.length > 0

  // Precios, ITBIS y envío los calcula el servidor (quote_cart), con la
  // misma regla que cobra create_order_from_cart. Si la cotización falla
  // se muestra la estimación local con una nota; nunca se bloquea el
  // carrito por eso. El envío solo se sabe con provincia.
  const { province } = useLocationStore()
  const { quote, status: quoteStatus } = useCartQuote(items, province?.id ?? null)
  const quoteMatches = !!quote && quote.lines.length === items.length
    && quote.lines.every((l, i) => l.product_id === items[i].product.id && l.quantity === items[i].quantity)
  const q = quoteStatus === 'ready' && quoteMatches ? quote : null
  const displaySubtotal = q ? q.subtotal_rdp : subtotal
  const displayItbis = q ? q.itbis_rdp : itbis
  const freeThreshold = q ? q.free_shipping_threshold_rdp : FREE_SHIPPING_THRESHOLD_RDP
  const qualifiesFree = q ? q.qualifies_free_shipping : subtotal >= FREE_SHIPPING_THRESHOLD_RDP
  const deliveryRdp = q ? q.delivery_rdp : null
  const displayTotal = q ? q.total_rdp : total
  const lineIssues = q ? quoteBlocksPurchase(q) : false
  const checkoutBlocked = hasOwnProducts || lineIssues

  return (
    <div style={{ minHeight: '100vh', background: BRAND.bg }}>
      <Navbar />

      <div className="page-row cart-layout" style={{ paddingTop: 28, paddingBottom: 28 }}>

        {/* Lista de items */}
        <div>
          <h1 style={{ fontSize: 'var(--text-h1)', fontWeight: 700, lineHeight: 'var(--leading-h1)', marginBottom: 20, color: BRAND.dark }}>
            {t('cartTitle', { count: items.length })}
          </h1>

          {items.length === 0 ? (
            <div style={{ background: 'var(--color-card-bg)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <p style={{ color: BRAND.gray, fontSize: 'var(--text-ui)', marginBottom: 16 }}>{t('emptyCart')}</p>
              <a
                href="/"
                style={{ display: 'inline-block', background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', padding: '10px 24px', borderRadius: 'var(--radius-control)', fontWeight: 600, fontSize: 'var(--text-ui)', boxShadow: 'var(--shadow-button)' }}
              >
                {t('exploreProducts')}
              </a>
            </div>
          ) : (
            items.map((item, index) => {
              const image = item.product.images?.[0]
              const isOwn = ownVendorId != null && item.product.vendor_id === ownVendorId
              const line = q?.lines.find(l => l.index === index)
              const problem = lineProblem(line)
              const unitPrice = line?.unit_price_rdp ?? item.variant_price_rdp ?? item.product.price_rdp
              const lineTotal = line?.line_total_rdp ?? unitPrice * item.quantity
              return (
                <div
                  key={`${item.product.id}-${item.variant_id ?? `${item.selected_size}-${item.selected_color}`}`}
                  className="cart-item"
                  style={{
                    background: 'var(--color-card-bg)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)',
                    padding: 16, marginBottom: 12, display: 'flex', gap: 14, alignItems: 'center',
                    border: isOwn || problem ? '1px solid #FDBA74' : undefined,
                  }}
                >
                  {/* Imagen */}
                  <div style={{ width: 64, height: 64, borderRadius: 8, background: BRAND.bg, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                    {image ? (
                      <Image src={image} alt={item.product.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>📦</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a
                      href={`/producto/${item.product.id}`}
                      style={{ fontWeight: 600, fontSize: 'var(--text-body)', marginBottom: 2, color: BRAND.dark, overflowWrap: 'break-word', textDecoration: 'none', display: 'block' }}
                    >
                      {item.product.name}
                    </a>
                    {(item.variant_label || item.selected_size || item.selected_color) && (
                      <div style={{ fontSize: 'var(--text-caption)', color: BRAND.gray, marginBottom: 2 }}>
                        {item.variant_label ?? [item.selected_size, item.selected_color].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <div style={{ fontSize: 'var(--text-caption)', color: BRAND.blue, fontWeight: 600 }}>
                      RD${(unitPrice / 100).toLocaleString('es-DO')}
                    </div>
                    {problem && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 'var(--text-badge)', color: '#C2410C', fontWeight: 600 }}>
                        <AlertTriangle size={12} /> {problem === 'unavailable' ? t('lineUnavailable') : t('onlyNLeft', { count: line?.available_quantity ?? 0 })}
                      </div>
                    )}
                    {isOwn && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 'var(--text-badge)', color: '#C2410C', fontWeight: 600 }}>
                        <AlertTriangle size={12} /> {t('ownProductWarning')}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="cart-item-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-price-card)', lineHeight: 'var(--leading-price)', color: BRAND.dark }}>
                      RD${(lineTotal / 100).toLocaleString('es-DO')}
                    </div>
                    <div style={{ display: 'flex', border: '1px solid #E0E0E0', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity - 1, item.variant_id, item.selected_size, item.selected_color)}
                        style={{ width: 26, height: 26, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND.dark }}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ width: 30, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-small)', fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity + 1, item.variant_id, item.selected_size, item.selected_color)}
                        style={{ width: 26, height: 26, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND.dark }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.variant_id, item.selected_size, item.selected_color)}
                      style={{ background: 'none', border: 'none', color: BRAND.gray, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-caption)' }}
                    >
                      <Trash2 size={13} /> {t('removeItem')}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Resumen */}
        {items.length > 0 && (
          <div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #EEE', position: 'sticky', top: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-h4)', marginBottom: 16, color: BRAND.dark }}>{t('orderSummary')}</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-small)', marginBottom: 8, color: BRAND.dark }}>
                <span>{t('subtotalLabel', { count: items.reduce((a, i) => a + i.quantity, 0) })}</span>
                <span>RD${(displaySubtotal / 100).toLocaleString('es-DO')}</span>
              </div>

              {!qualifiesFree ? (
                <div style={{ fontSize: 'var(--text-small)', fontWeight: 500, color: 'var(--color-primary)', background: 'var(--color-primary-subtle)', borderRadius: 'var(--radius-control)', padding: '8px 10px', marginBottom: 12 }}>
                  {t('freeShippingMissing', { amount: (Math.max(0, freeThreshold - displaySubtotal) / 100).toLocaleString('es-DO') })}
                </div>
              ) : (
                <div style={{ fontSize: 'var(--text-small)', color: 'var(--color-green)', background: 'var(--color-green-subtle)', borderRadius: 'var(--radius-control)', padding: '8px 10px', marginBottom: 12, fontWeight: 600 }}>
                  {t('freeShippingApplied')}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-small)', marginBottom: 8, color: BRAND.dark }}>
                <span>{t('shippingLabel')}</span>
                <span>
                  {qualifiesFree
                    ? <span style={{ color: 'var(--color-green)', fontWeight: 700 }}>{t('freeBadge')}</span>
                    : deliveryRdp !== null
                      ? `RD$${(deliveryRdp / 100).toLocaleString('es-DO')}`
                      : <span style={{ color: BRAND.gray }}>{t('shippingAtCheckout')}</span>}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-small)', marginBottom: 16, color: BRAND.dark }}>
                <span>{t('itbisLabel')}</span>
                <span>RD${(displayItbis / 100).toLocaleString('es-DO')}</span>
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 700, fontSize: 'var(--text-h4)', marginBottom: 16, color: BRAND.dark }}>
                <span>{t('totalLabel')}</span>
                <span style={{ fontSize: 'var(--text-price-card)', fontWeight: 700, lineHeight: 'var(--leading-price)', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', letterSpacing: 'var(--tracking-heading)' }}>
                  RD${(displayTotal / 100).toLocaleString('es-DO')}
                </span>
              </div>

              {quoteStatus === 'error' && (
                <div style={{ fontSize: 'var(--text-caption)', color: BRAND.gray, marginTop: -8, marginBottom: 12 }}>{t('estimatedTotalsNote')}</div>
              )}

              {checkoutBlocked ? (
                <div
                  style={{ background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 'var(--radius-control)', padding: 12, marginBottom: 10, display: 'flex', gap: 8, alignItems: 'flex-start', color: '#C2410C' }}
                >
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 'var(--text-caption)', fontWeight: 500 }}>{hasOwnProducts ? t('checkoutBlockedOwnProducts') : t('checkoutBlockedLineIssues')}</span>
                </div>
              ) : (
                <a
                  href="/checkout"
                  style={{ display: 'block', background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', textAlign: 'center', padding: 14, borderRadius: 'var(--radius-control)', fontWeight: 600, fontSize: 'var(--text-body)', marginBottom: 10, boxShadow: 'var(--shadow-button)' }}
                >
                  {t('proceedToCheckout')}
                </a>
              )}
              <a href="/" style={{ display: 'block', textAlign: 'center', fontSize: 'var(--text-small)', color: BRAND.gray, textDecoration: 'none' }}>
                {t('continueShopping')}
              </a>

              <div style={{ marginTop: 14, padding: 12, background: 'var(--color-green-subtle)', borderRadius: 'var(--radius-control)', display: 'flex', gap: 8, alignItems: 'flex-start', color: 'var(--color-green)' }}>
                <ShieldCheck size={16} color="currentColor" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 'var(--text-caption)', fontWeight: 600, marginBottom: 2 }}>{t('protectedPurchaseTitle')}</div>
                  <div style={{ fontSize: 'var(--text-badge)' }}>{t('protectedPurchaseSub')}</div>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 12, fontSize: 'var(--text-badge)', color: BRAND.gray }}>
                <span>💳 Azul</span>
                <span>🏦 CardNet</span>
                <span>{t('paymentTransfer')}</span>
                <span>{t('paymentCash')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
