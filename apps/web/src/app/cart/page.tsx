'use client'
// ============================================================
// MercadoRD — Carrito
// Ruta: src/app/cart/page.tsx
// ============================================================

import { ShoppingCart, Trash2, Minus, Plus, ShieldCheck } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { useCartStore, useCartSubtotal, useCartItbis, useCartTotal } from '@/lib/store/cart'
import { Navbar } from '@/components/shop/Navbar'
import Image from 'next/image'

export default function CartPage() {
  const { items, updateQty, removeItem } = useCartStore()
  const subtotal = useCartSubtotal()
  const itbis = useCartItbis()
  const total = useCartTotal()
  const ENVIO = items.length > 0 ? 18000 : 0 // RD$180 en centavos

  return (
    <div style={{ minHeight: '100vh', background: BRAND.bg }}>
      <Navbar />

      <div className="page-row cart-layout" style={{ paddingTop: 28, paddingBottom: 28 }}>

        {/* Lista de items */}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: BRAND.dark }}>
            Tu carrito ({items.length})
          </h1>

          {items.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 10, padding: 40, textAlign: 'center', border: '1px solid #EEE' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <p style={{ color: BRAND.gray, fontSize: 14, marginBottom: 16 }}>Tu carrito está vacío</p>
              <a
                href="/"
                style={{ display: 'inline-block', background: BRAND.blue, color: '#fff', textDecoration: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}
              >
                Explorar productos
              </a>
            </div>
          ) : (
            items.map((item) => {
              const image = item.product.images?.[0]
              return (
                <div
                  key={`${item.product.id}-${item.selected_size}-${item.selected_color}`}
                  className="cart-item"
                  style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, display: 'flex', gap: 14, alignItems: 'center', border: '1px solid #EEE' }}
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
                      style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, color: BRAND.dark, overflowWrap: 'break-word', textDecoration: 'none', display: 'block' }}
                    >
                      {item.product.name}
                    </a>
                    {(item.selected_size || item.selected_color) && (
                      <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 2 }}>
                        {[item.selected_size, item.selected_color].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: BRAND.blue, fontWeight: 600 }}>
                      RD${((item.variant_price_rdp ?? item.product.price_rdp) / 100).toLocaleString('es-DO')}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="cart-item-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: BRAND.dark }}>
                      RD${(((item.variant_price_rdp ?? item.product.price_rdp) * item.quantity) / 100).toLocaleString('es-DO')}
                    </div>
                    <div style={{ display: 'flex', border: '1px solid #E0E0E0', borderRadius: 6, overflow: 'hidden' }}>
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity - 1)}
                        style={{ width: 26, height: 26, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND.dark }}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ width: 30, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.product.id, item.quantity + 1)}
                        style={{ width: 26, height: 26, border: 'none', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: BRAND.dark }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      style={{ background: 'none', border: 'none', color: BRAND.gray, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                    >
                      <Trash2 size={13} /> Eliminar
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
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: BRAND.dark }}>Resumen del pedido</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: BRAND.dark }}>
                <span>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} artículos)</span>
                <span>RD${(subtotal / 100).toLocaleString('es-DO')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, color: BRAND.dark }}>
                <span>Envío</span>
                <span>RD${(ENVIO / 100).toLocaleString('es-DO')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 16, color: BRAND.dark }}>
                <span>ITBIS (18%)</span>
                <span>RD${(itbis / 100).toLocaleString('es-DO')}</span>
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: 14, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 17, marginBottom: 16, color: BRAND.dark }}>
                <span>Total</span>
                <span>RD${((total + ENVIO) / 100).toLocaleString('es-DO')}</span>
              </div>

              <a
                href="/checkout"
                style={{ display: 'block', background: BRAND.red, color: '#fff', textDecoration: 'none', textAlign: 'center', padding: 14, borderRadius: 8, fontWeight: 700, fontSize: 15, marginBottom: 10 }}
              >
                Proceder al pago
              </a>
              <a href="/" style={{ display: 'block', textAlign: 'center', fontSize: 13, color: BRAND.gray, textDecoration: 'none' }}>
                ← Seguir comprando
              </a>

              <div style={{ marginTop: 14, padding: 12, background: '#F0FDF4', borderRadius: 8, border: '1px solid #C8E6C9', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <ShieldCheck size={16} color={BRAND.green} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#1B5E20', fontWeight: 600, marginBottom: 2 }}>Compra protegida</div>
                  <div style={{ fontSize: 11, color: '#1B5E20' }}>Si el producto no llega te devolvemos tu dinero</div>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 12, fontSize: 11, color: BRAND.gray }}>
                <span>💳 Azul</span>
                <span>🏦 CardNet</span>
                <span>🏧 Transferencia</span>
                <span>💵 Efectivo</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
