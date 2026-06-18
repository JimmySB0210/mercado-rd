'use client'
// ============================================================
// MercadoRD — Checkout
// Ruta: src/app/checkout/page.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ChevronDown } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { useCartStore } from '@/lib/store/cart'
import { useAuth } from '@/lib/hooks/useAuth'
import { Navbar } from '@/components/shop/Navbar'
import Image from 'next/image'

const PROVINCES = [
  'Azua','Bahoruco','Barahona','Dajabón','Distrito Nacional','Duarte',
  'Elías Piña','El Seibo','Espaillat','Hato Mayor','Hermanas Mirabal',
  'Independencia','La Altagracia','La Romana','La Vega','María Trinidad Sánchez',
  'Monseñor Nouel','Monte Cristi','Monte Plata','Pedernales','Peravia',
  'Puerto Plata','Samaná','San Cristóbal','San José de Ocoa','San Juan',
  'San Pedro de Macorís','Sánchez Ramírez','Santiago','Santiago Rodríguez',
  'Santo Domingo','Valverde',
]

const PAYMENT_METHODS = [
  { id: 'azul',     label: 'Tarjeta (Azul)',    emoji: '💳' },
  { id: 'cardnet',  label: 'Tarjeta (CardNet)', emoji: '🏦' },
  { id: 'transfer', label: 'Transferencia',     emoji: '🏧' },
  { id: 'cash',     label: 'Efectivo',          emoji: '💵' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { items, subtotal, itbis, total, clearCart } = useCartStore()
  const ENVIO = items.length > 0 ? 18000 : 0

  const [form, setForm] = useState({
    fullName:   profile?.full_name || '',
    phone:      profile?.phone || '',
    address:    '',
    province:   '',
    notes:      '',
    payMethod:  'azul',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!user) { router.push('/login?redirect=/checkout'); return }
    if (!form.fullName || !form.phone || !form.address || !form.province) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }
    if (items.length === 0) { router.push('/'); return }

    setLoading(true)
    setError(null)

    try {
      // Por ahora guardamos la orden en Supabase vía API route (a implementar)
      // De momento simulamos éxito y limpiamos el carrito
      await new Promise(r => setTimeout(r, 1200)) // simular latencia
      clearCart()
      router.push('/confirm')
    } catch {
      setError('Ocurrió un error al procesar tu pedido. Intenta de nuevo.')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.bg }}>
        <Navbar />
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: BRAND.dark, marginBottom: 8 }}>Tu carrito está vacío</h2>
          <p style={{ color: BRAND.gray, fontSize: 14, marginBottom: 24 }}>Agrega productos antes de ir al checkout</p>
          <a href="/" style={{ display: 'inline-block', background: BRAND.blue, color: '#fff', textDecoration: 'none', padding: '12px 28px', borderRadius: 8, fontWeight: 600 }}>
            Explorar productos
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
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: BRAND.dark }}>Dirección de entrega</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nombre completo *"
                style={{ width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Teléfono *"
                style={{ width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Dirección completa *"
                style={{ width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ position: 'relative' }}>
                <select
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  style={{ width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', appearance: 'none', background: '#fff', color: form.province ? BRAND.dark : BRAND.gray }}
                >
                  <option value="">Selecciona tu provincia *</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown size={16} color={BRAND.gray} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Instrucciones de entrega (opcional)"
                rows={2}
                style={{ width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          {/* Método de pago */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #EEE' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: BRAND.dark }}>Método de pago</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {PAYMENT_METHODS.map(m => (
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
                  <span style={{ fontSize: 13, fontWeight: 500, color: BRAND.dark }}>{m.label}</span>
                </label>
              ))}
            </div>

            {(form.payMethod === 'azul' || form.payMethod === 'cardnet') && (
              <div style={{ marginTop: 14, padding: 12, background: '#FFF8E1', borderRadius: 8, border: '1px solid #FFE082', fontSize: 12, color: '#5D4037' }}>
                💡 Serás redirigido al portal seguro de {form.payMethod === 'azul' ? 'Azul' : 'CardNet'} para completar el pago.
              </div>
            )}
          </div>
        </div>

        {/* Resumen lateral */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #EEE', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: BRAND.dark }}>
              Tu pedido ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})
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
                    RD${((item.product.price_rdp * item.quantity) / 100).toLocaleString('es-DO')}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #EEE', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: BRAND.dark }}>
                <span>Subtotal</span><span>RD${(subtotal / 100).toLocaleString('es-DO')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: BRAND.dark }}>
                <span>Envío</span><span>RD${(ENVIO / 100).toLocaleString('es-DO')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: BRAND.dark }}>
                <span>ITBIS (18%)</span><span>RD${(itbis / 100).toLocaleString('es-DO')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, borderTop: '1px solid #EEE', paddingTop: 10, marginTop: 4, color: BRAND.dark }}>
                <span>Total</span>
                <span>RD${((total + ENVIO) / 100).toLocaleString('es-DO')}</span>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FFF0F0', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C62828', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              display: 'block', width: '100%', background: loading ? '#ccc' : BRAND.red,
              color: '#fff', border: 'none', padding: 14, borderRadius: 8,
              fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: 10,
            }}
          >
            {loading ? 'Procesando...' : 'Confirmar y pagar'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#F0FDF4', borderRadius: 8, border: '1px solid #C8E6C9' }}>
            <ShieldCheck size={15} color={BRAND.green} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#1B5E20' }}>Pago seguro — tu información está protegida</span>
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
