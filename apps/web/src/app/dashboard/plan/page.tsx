'use client'
// ============================================================
// MercadoRD — Upgrade a plan Pro (vendor dashboard)
// Ruta: src/app/dashboard/plan/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { processPayment } from '@/lib/payments/azul'
import { BRAND } from '@/lib/colors'

const PRO_PRICE_RDP = 49900 // RD$499 en centavos

export default function VendorPlanPage() {
  const router = useRouter()
  const supabase = createClient()

  const [vendor, setVendor] = useState<{ id: string; business_name: string; plan: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [cardNumber, setCardNumber] = useState('')
  const [expiration, setExpiration] = useState('')
  const [cvc, setCvc] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard/plan')
        return
      }

      const { data } = await supabase
        .from('vendors')
        .select('id, business_name, plan')
        .eq('user_id', user.id)
        .single()

      if (!data) {
        router.push('/vendor/register')
        return
      }

      setVendor(data)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const handleUpgrade = async () => {
    if (!vendor) return
    setError(null)

    if (!cardNumber || !expiration || !cvc) {
      setError('Completa los datos de tu tarjeta')
      return
    }

    setProcessing(true)

    try {
      const result = await processPayment({
        orderId: `PRO-${vendor.id}-${Date.now()}`,
        amountCents: PRO_PRICE_RDP,
        itbisCents: 0, // suscripciones de software exentas de ITBIS
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiration,
        cvc,
        customerName: vendor.business_name,
      })

      if (!result.success) {
        setError(`Pago rechazado: ${result.responseMessage}`)
        setProcessing(false)
        return
      }

      const { error: activateError } = await supabase.rpc('activate_pro_plan', {
        p_vendor_id: vendor.id,
        p_amount_rdp: PRO_PRICE_RDP,
        p_azul_order_id: result.azulOrderId,
        p_auth_code: result.authCode,
      })

      if (activateError) throw activateError

      setSuccess(true)
      setTimeout(() => router.refresh(), 2000)
    } catch (err) {
      console.error('[VendorPlanPage]', err)
      setError('Ocurrió un error al activar tu plan. Intenta de nuevo.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  const isPro = vendor?.plan === 'pro'

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'inherit', display: 'grid', gridTemplateColumns: '220px 1fr' }}>

      <DashboardSidebar />

      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Tu plan</h1>
          <p style={{ color: '#666', fontSize: 14 }}>Elige el plan que mejor se ajuste a tu negocio</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 760 }} className="plan-grid">

          {/* Plan Free */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: !isPro ? `2px solid ${BRAND.blue}` : '1px solid #eee' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#666', marginBottom: 4 }}>📦 FREE</div>
            <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 16 }}>RD$0<span style={{ fontSize: 13, fontWeight: 400, color: '#999' }}>/mes</span></div>
            {['Hasta 5 productos activos', 'Tienda básica con logo', 'Botón de WhatsApp', 'Recibe reseñas', 'KPIs básicos'].map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: '#555', padding: '6px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: '#999' }}>·</span>{f}
              </div>
            ))}
            {!isPro && (
              <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, fontWeight: 700, color: BRAND.blue, background: '#EFF6FF', padding: 8, borderRadius: 8 }}>
                Tu plan actual
              </div>
            )}
          </div>

          {/* Plan Pro */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: isPro ? `2px solid ${BRAND.blue}` : `1.5px solid #DBEAFE` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: BRAND.blue, marginBottom: 4 }}>⭐ PRO</div>
            <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 16 }}>RD$499<span style={{ fontSize: 13, fontWeight: 400, color: '#999' }}>/mes</span></div>
            {['Productos ilimitados', 'Badge de verificado ✓', 'Comisión reducida por venta', 'Soporte prioritario'].map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: '#333', fontWeight: 600, padding: '6px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: BRAND.blue }}>✓</span>{f}
              </div>
            ))}

            {isPro ? (
              <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: 8, borderRadius: 8 }}>
                ✓ Plan activo
              </div>
            ) : (
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #f0f0f0' }}>
                {success ? (
                  <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: 12, borderRadius: 8 }}>
                    ✓ ¡Plan Pro activado! Actualizando...
                  </div>
                ) : (
                  <>
                    <input
                      type="text" placeholder="Número de tarjeta" value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        type="text" placeholder="MM/AA" value={expiration}
                        onChange={e => setExpiration(e.target.value)}
                        style={{ flex: 1, border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 13, boxSizing: 'border-box' }}
                      />
                      <input
                        type="text" placeholder="CVC" value={cvc}
                        onChange={e => setCvc(e.target.value)}
                        style={{ flex: 1, border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 13, boxSizing: 'border-box' }}
                      />
                    </div>
                    <p style={{ fontSize: 10, color: '#999', marginBottom: 10 }}>
                      💡 Modo simulado: cualquier tarjeta funciona, excepto las terminadas en 0000
                    </p>
                    {error && (
                      <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#c00', marginBottom: 10 }}>
                        {error}
                      </div>
                    )}
                    <button
                      onClick={handleUpgrade}
                      disabled={processing}
                      style={{ width: '100%', background: processing ? '#ccc' : BRAND.blue, color: '#fff', border: 'none', padding: 12, borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: processing ? 'not-allowed' : 'pointer' }}
                    >
                      {processing ? 'Procesando...' : 'Actualizar a Pro — RD$499/mes'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

        </div>

        <style jsx global>{`
          @media (max-width: 700px) {
            .plan-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
