'use client'
// ============================================================
// MercadoRD — Configuración (vendor dashboard)
// Ruta: src/app/dashboard/configuracion/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateImageFile } from '@/lib/storage/upload'
import { validateText, validatePhone } from '@/lib/validation'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { BRAND } from '@/lib/colors'

interface Province {
  id: number
  name: string
}

export default function VendorSettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [vendorId, setVendorId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    businessName: '',
    description: '',
    provinceId: '',
    address: '',
    whatsapp: '',
    instagram: '',
    bankName: '',
    bankAccount: '',
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [hasMfa, setHasMfa] = useState(true)
  const [businessNameError, setBusinessNameError] = useState<string | null>(null)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const [addressError, setAddressError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard/configuracion')
        return
      }
      setUserId(user.id)

      const { data: factorsData } = await supabase.auth.mfa.listFactors()
      setHasMfa(!!factorsData?.totp.some(f => f.status === 'verified'))

      const { data: vendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!vendor) {
        router.push('/vendor/register')
        return
      }

      setVendorId(vendor.id)
      setForm({
        businessName: vendor.business_name ?? '',
        description: vendor.description ?? '',
        provinceId: vendor.province_id ? String(vendor.province_id) : '',
        address: vendor.address ?? '',
        whatsapp: vendor.whatsapp ?? '',
        instagram: vendor.instagram ?? '',
        bankName: vendor.bank_name ?? '',
        bankAccount: vendor.bank_account ?? '',
      })
      setLogoPreview(vendor.logo_url)

      const { data: provs } = await supabase
        .from('provinces_rd')
        .select('id, name')
        .order('name')

      setProvinces(provs ?? [])
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setLogoError(validationError)
      return
    }
    setLogoError(null)

    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setBusinessNameError(null)
    setWhatsappError(null)
    setDescriptionError(null)
    setAddressError(null)

    if (!vendorId || !userId) return
    if (!form.businessName) {
      setError('El nombre de la tienda es obligatorio')
      return
    }

    const businessNameErr = validateText(form.businessName, 'El nombre de la tienda', 3, 80)
    if (businessNameErr) { setBusinessNameError(businessNameErr); return }

    if (form.whatsapp.trim().length > 0) {
      const whatsappErr = validatePhone(form.whatsapp)
      if (whatsappErr) { setWhatsappError(whatsappErr); return }
    }

    const descriptionErr = validateText(form.description, 'La descripción', 0, 500)
    if (descriptionErr) { setDescriptionError(descriptionErr); return }

    if (form.address.trim().length > 0) {
      const addressErr = validateText(form.address, 'Dirección', 10, 200)
      if (addressErr) { setAddressError(addressErr); return }
    }

    setSaving(true)

    try {
      let logoUrl = logoPreview

      // Subir nuevo logo si se seleccionó uno
      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const filename = `${userId}/logo-${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('vendors')
          .upload(filename, logoFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('vendors').getPublicUrl(filename)
        logoUrl = data.publicUrl
      }

      const { error: updateError } = await supabase
        .from('vendors')
        .update({
          business_name: form.businessName,
          description: form.description || null,
          province_id: form.provinceId ? parseInt(form.provinceId) : null,
          address: form.address.trim() || null,
          whatsapp: form.whatsapp || null,
          instagram: form.instagram || null,
          bank_name: form.bankName || null,
          bank_account: form.bankAccount || null,
          logo_url: logoUrl,
        })
        .eq('id', vendorId)

      if (updateError) throw updateError

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('[VendorSettings]', err)
      setError('Ocurrió un error al guardar los cambios. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'inherit', display: 'grid', gridTemplateColumns: '220px 1fr' }}>

      <DashboardSidebar />

      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Configuración</h1>
          <p style={{ color: '#666', fontSize: 14 }}>Edita la información de tu tienda</p>
        </div>

        {!hasMfa && (
          <a
            href="/perfil/seguridad"
            style={{
              display: 'block', background: '#FEF9C3', color: '#713f12', borderRadius: 10,
              padding: '12px 16px', fontSize: 13, fontWeight: 600, marginBottom: 20,
              textDecoration: 'none', maxWidth: 560,
            }}
          >
            🔒 Activa la verificación en dos pasos para proteger tu tienda →
          </a>
        )}

        <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>

          {/* Logo */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Logo de la tienda</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: 12, background: BRAND.bg, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 28 }}>🏪</span>
                )}
              </div>
              <label style={{ cursor: 'pointer' }}>
                <span style={{ display: 'inline-block', border: '1px solid #ddd', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#333' }}>
                  Cambiar logo
                </span>
                <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" style={{ display: 'none' }} />
              </label>
            </div>
            {logoError && <p style={{ fontSize: 12, color: '#c00', marginTop: 10 }}>{logoError}</p>}
          </div>

          {/* Info básica */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Información de la tienda</h2>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Nombre de la tienda *</label>
              <input
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                style={{ width: '100%', border: `1px solid ${businessNameError ? '#c00' : '#ddd'}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }}
              />
              {businessNameError && <p style={{ fontSize: 12, color: '#c00', marginTop: 6 }}>{businessNameError}</p>}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Descripción</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                style={{ width: '100%', border: `1px solid ${descriptionError ? '#c00' : '#ddd'}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
              {descriptionError && <p style={{ fontSize: 12, color: '#c00', marginTop: 6 }}>{descriptionError}</p>}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Provincia</label>
              <select
                name="provinceId"
                value={form.provinceId}
                onChange={handleChange}
                style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', background: '#fff' }}
              >
                <option value="">Selecciona provincia</option>
                {provinces.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Dirección del negocio</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={2}
                placeholder="Ej: Calle Duarte #45, Sector Villa Consuelo, cerca del colmado Los Hermanos"
                style={{ width: '100%', border: `1px solid ${addressError ? '#c00' : '#ddd'}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
              {addressError && <p style={{ fontSize: 12, color: '#c00', marginTop: 6 }}>{addressError}</p>}
            </div>
          </div>

          {/* Contacto */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Contacto</h2>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>WhatsApp (con código de país, sin +)</label>
              <input
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="18095550000"
                style={{ width: '100%', border: `1px solid ${whatsappError ? '#c00' : '#ddd'}`, borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }}
              />
              {whatsappError && <p style={{ fontSize: 12, color: '#c00', marginTop: 6 }}>{whatsappError}</p>}
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Instagram (sin @)</label>
              <input
                name="instagram"
                value={form.instagram}
                onChange={handleChange}
                placeholder="mitiendard"
                style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Pagos */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Cuenta para recibir pagos</h2>
            <p style={{ fontSize: 12, color: '#999', marginBottom: 14 }}>Solo tú puedes ver esta información</p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Banco</label>
              <input
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
                placeholder="Banco Popular, BHD, etc."
                style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Número de cuenta</label>
              <input
                name="bankAccount"
                value={form.bankAccount}
                onChange={handleChange}
                style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#c00', marginBottom: 16 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#efe', border: '1px solid #cfc', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#070', marginBottom: 16 }}>
              ✓ Cambios guardados correctamente
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{ width: '100%', background: saving ? '#ccc' : '#111', color: '#fff', border: 'none', padding: '14px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>

        </form>
      </div>
    </div>
  )
}
