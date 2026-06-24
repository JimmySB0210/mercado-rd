'use client'
// ============================================================
// MercadoRD — Cupones (vendor dashboard)
// Ruta: src/app/dashboard/cupones/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { formatPrice } from '@/types/database.types'
import { BRAND } from '@/lib/colors'

interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_rdp: number | null
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export default function VendorCouponsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [vendorId, setVendorId] = useState<string | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minOrder: '',
    maxUses: '',
    expiresAt: '',
  })

  const loadCoupons = async (vId: string) => {
    const { data, error: loadError } = await supabase
      .from('coupons')
      .select('*')
      .eq('vendor_id', vId)
      .order('created_at', { ascending: false })

    if (loadError) console.error('[VendorCouponsPage load]', loadError)
    setCoupons(data ?? [])
  }

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard/cupones')
        return
      }

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!vendor) {
        router.push('/vendor/register')
        return
      }

      setVendorId(vendor.id)
      await loadCoupons(vendor.id)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!vendorId) return
    if (!form.code.trim()) {
      setError('El código es obligatorio')
      return
    }

    const valueNum = parseFloat(form.value)
    if (isNaN(valueNum) || valueNum <= 0) {
      setError('El valor debe ser un número mayor a 0')
      return
    }
    if (form.type === 'percentage' && valueNum > 100) {
      setError('El porcentaje no puede superar 100')
      return
    }

    setSaving(true)

    const { error: insertError } = await supabase.from('coupons').insert({
      vendor_id: vendorId,
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: form.type === 'fixed' ? Math.round(valueNum * 100) : Math.round(valueNum),
      min_order_rdp: form.minOrder ? Math.round(parseFloat(form.minOrder) * 100) : null,
      max_uses: form.maxUses ? parseInt(form.maxUses) : null,
      expires_at: form.expiresAt || null,
      is_active: true,
    })

    setSaving(false)

    if (insertError) {
      console.error('[VendorCouponsPage create]', insertError)
      setError(
        insertError.code === '23505'
          ? 'Ya tienes un cupón con ese código'
          : 'No se pudo crear el cupón. Intenta de nuevo.'
      )
      return
    }

    setForm({ code: '', type: 'percentage', value: '', minOrder: '', maxUses: '', expiresAt: '' })
    await loadCoupons(vendorId)
  }

  const handleToggleActive = async (coupon: Coupon) => {
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id)

    if (updateError) {
      console.error('[VendorCouponsPage toggle]', updateError)
      return
    }

    setCoupons(prev => prev.map(c => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c)))
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#999', fontSize: 14 }}>Cargando...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'inherit', display: 'grid', gridTemplateColumns: '220px 1fr' }}>

      <DashboardSidebar />

      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Cupones</h1>
          <p style={{ color: '#666', fontSize: 14 }}>Crea descuentos para tus clientes</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }} className="coupons-grid">

          {/* Lista */}
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15 }}>
              Tus cupones ({coupons.length})
            </div>

            {coupons.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#999' }}>
                Aún no has creado ningún cupón.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f8f8' }}>
                      {['Código', 'Tipo', 'Valor', 'Usos', 'Vence', 'Estado', ''].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, color: '#999', textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                        <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: BRAND.blue }}>{c.code}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#666' }}>
                          {c.type === 'percentage' ? 'Porcentaje' : 'Monto fijo'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>
                          {c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value)}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>
                          {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>
                          {c.expires_at
                            ? new Date(c.expires_at).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Sin vencimiento'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            background: c.is_active ? '#DCFCE7' : '#F3F4F6',
                            color: c.is_active ? '#166534' : '#666',
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          }}>
                            {c.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button
                            onClick={() => handleToggleActive(c)}
                            style={{
                              border: '1px solid #ddd', background: '#fff', borderRadius: 6,
                              padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#333',
                            }}
                          >
                            {c.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Formulario */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', alignSelf: 'start' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Nuevo cupón</h2>

            <form onSubmit={handleCreate} style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Código *</label>
                <input
                  name="code"
                  value={form.code}
                  onChange={handleCodeChange}
                  placeholder="VERANO20"
                  style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Tipo *</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box', background: '#fff' }}
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo (RD$)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
                  {form.type === 'percentage' ? 'Porcentaje de descuento *' : 'Monto del descuento (RD$) *'}
                </label>
                <input
                  name="value"
                  type="number"
                  step={form.type === 'percentage' ? '1' : '0.01'}
                  min="0"
                  value={form.value}
                  onChange={handleChange}
                  placeholder={form.type === 'percentage' ? '20' : '500.00'}
                  style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Monto mínimo de compra (opcional)</label>
                <input
                  name="minOrder"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.minOrder}
                  onChange={handleChange}
                  placeholder="RD$"
                  style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Límite de usos (opcional)</label>
                <input
                  name="maxUses"
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={handleChange}
                  placeholder="Sin límite"
                  style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Fecha de vencimiento (opcional)</label>
                <input
                  name="expiresAt"
                  type="date"
                  value={form.expiresAt}
                  onChange={handleChange}
                  style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>

              {error && (
                <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#c00' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: '100%', background: saving ? '#ccc' : BRAND.blue, color: '#fff', border: 'none',
                  padding: '11px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 4,
                }}
              >
                {saving ? 'Creando...' : 'Crear cupón'}
              </button>
            </form>
          </div>

        </div>

        <style>{`
          @media (max-width: 900px) {
            .coupons-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
