'use client'
// ============================================================
// MercadoRD — Registro de vendor
// Ruta: src/app/vendor/register/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { validateText, validatePhone } from '@/lib/validation'
import { BRAND } from '@/lib/colors'

const inputStyle = {
  width:'100%',
  border:'1px solid #E0E0E0',
  borderRadius:8,
  padding:'11px 13px',
  fontSize:14,
  outline:'none',
  boxSizing:'border-box' as const,
};

interface CategoryOption { id: number; name: string; emoji: string }
interface ProvinceOption { id: number; name: string }

export default function VendorRegisterPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [checkingVendor, setCheckingVendor] = useState(true)
  const [hasVendor, setHasVendor] = useState(false)

  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])

  const [form, setForm] = useState({
    businessName: '',
    categoryId: '',
    provinceId: '',
    whatsapp: '',
  })
  const [businessNameError, setBusinessNameError] = useState<string | null>(null)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Si ya tiene una tienda, no necesita registrar otra
  useEffect(() => {
    if (authLoading) return
    if (!user) { setCheckingVendor(false); return }

    const supabase = createClient()
    supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setHasVendor(true)
          router.push('/dashboard')
          return
        }
        setCheckingVendor(false)
      })
  }, [user, authLoading, router])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('categories')
      .select('id, name, emoji')
      .order('name')
      .then(({ data }) => setCategories(data ?? []))
    supabase
      .from('provinces_rd')
      .select('id, name')
      .order('name')
      .then(({ data }) => setProvinces(data ?? []))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusinessNameError(null)
    setWhatsappError(null)

    const businessNameErr = validateText(form.businessName, 'El nombre del negocio', 3, 80)
    if (businessNameErr) { setBusinessNameError(businessNameErr); return }

    if (!form.categoryId) { setError('Selecciona una categoría'); return }
    if (!form.provinceId) { setError('Selecciona una provincia'); return }

    if (form.whatsapp.trim().length > 0) {
      const whatsappErr = validatePhone(form.whatsapp)
      if (whatsappErr) { setWhatsappError(whatsappErr); return }
    }

    if (!user) {
      router.push('/login?redirect=/vendor/register')
      return
    }

    setSubmitting(true)

    const category = categories.find(c => c.id === Number(form.categoryId))
    const province = provinces.find(p => p.id === Number(form.provinceId))
    const description = `Tienda de ${category?.name ?? 'productos'} en ${province?.name ?? 'República Dominicana'}`

    const supabase = createClient()
    const { error: insertError } = await supabase.from('vendors').insert({
      user_id: user.id,
      business_name: form.businessName.trim(),
      category_id: Number(form.categoryId),
      province_id: Number(form.provinceId),
      whatsapp: form.whatsapp.trim() || null,
      description,
      plan: 'free',
      is_verified: false,
    })

    if (insertError) {
      console.error('[VendorRegister]', insertError)
      setError('Ocurrió un error al crear tu tienda. Intenta de nuevo.')
      setSubmitting(false)
      return
    }

    router.push('/dashboard')
  }

  // Cargando sesión, o verificando si ya tiene tienda (y redirigiendo)
  if (authLoading || checkingVendor || hasVendor) {
    return (
      <div style={{minHeight:'100vh',background:BRAND.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <p style={{color:BRAND.gray,fontSize:14}}>Cargando...</p>
      </div>
    )
  }

  // Sin sesión — pedir que inicie sesión o se registre primero
  if (!user) {
    return (
      <div style={{minHeight:'100vh',background:BRAND.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
        <div className="auth-card" style={{background:'#fff',borderRadius:12,maxWidth:440,width:'100%',boxShadow:'0 2px 20px rgba(0,0,0,0.08)',textAlign:'center'}}>
          <div style={{fontWeight:700,fontSize:24,marginBottom:8}}>
            <span style={{color:BRAND.blue}}>Mercado</span><span style={{color:BRAND.red}}>RD</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,marginBottom:10,color:BRAND.dark}}>
            Necesitas una cuenta para vender en MercadoRD
          </h1>
          <p style={{color:BRAND.gray,marginBottom:24,fontSize:14}}>
            Inicia sesión o crea una cuenta gratis para registrar tu tienda.
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <a
              href="/login?redirect=/vendor/register"
              style={{background:BRAND.blue,color:'#fff',textDecoration:'none',padding:14,borderRadius:8,fontWeight:600,fontSize:15,textAlign:'center'}}
            >
              Iniciar sesión
            </a>
            <a
              href="/register?redirect=/vendor/register"
              style={{background:'#fff',color:BRAND.blue,border:`1px solid ${BRAND.blue}`,textDecoration:'none',padding:14,borderRadius:8,fontWeight:600,fontSize:15,textAlign:'center'}}
            >
              Crear cuenta gratis
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:BRAND.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div className="auth-card" style={{background:'#fff',borderRadius:12,maxWidth:500,width:'100%',boxShadow:'0 2px 20px rgba(0,0,0,0.08)'}}>
        <div style={{fontWeight:700,fontSize:24,marginBottom:8}}>
          <span style={{color:BRAND.blue}}>Mercado</span><span style={{color:BRAND.red}}>RD</span>
        </div>
        <h1 style={{fontSize:26,fontWeight:700,marginBottom:6,color:BRAND.dark}}>Registra tu negocio</h1>
        <p style={{color:BRAND.gray,marginBottom:28,fontSize:14}}>Únete a miles de vendedores dominicanos</p>

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <input
              name="businessName"
              style={inputStyle}
              placeholder="Nombre del negocio *"
              value={form.businessName}
              onChange={handleChange}
            />
            {businessNameError && (
              <p style={{color:BRAND.red,fontSize:12,marginTop:4}}>{businessNameError}</p>
            )}
          </div>

          <select
            name="categoryId"
            style={{...inputStyle,background:'#fff'}}
            value={form.categoryId}
            onChange={handleChange}
          >
            <option value="">Selecciona tu categoría...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>

          <select
            name="provinceId"
            style={{...inputStyle,background:'#fff'}}
            value={form.provinceId}
            onChange={handleChange}
          >
            <option value="">Selecciona tu provincia...</option>
            {provinces.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <div>
            <input
              name="whatsapp"
              style={inputStyle}
              placeholder="WhatsApp (opcional)"
              value={form.whatsapp}
              onChange={handleChange}
            />
            {whatsappError && (
              <p style={{color:BRAND.red,fontSize:12,marginTop:4}}>{whatsappError}</p>
            )}
          </div>

          {error && (
            <div style={{background:'#FEF2F2',border:'1px solid #FECACA',color:'#B91C1C',fontSize:13,borderRadius:8,padding:'10px 12px'}}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              background:BRAND.blue,color:'#fff',border:'none',padding:14,borderRadius:8,
              fontWeight:600,fontSize:15,cursor: submitting ? 'default' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Creando tu tienda...' : 'Crear mi tienda gratis'}
          </button>
        </form>

        <p style={{textAlign:'center',marginTop:18,fontSize:13,color:BRAND.gray}}>
          ¿Ya tienes cuenta? <a href="/login" style={{color:BRAND.blue,fontWeight:600,textDecoration:'none'}}>Iniciar sesión</a>
        </p>
      </div>
    </div>
  );
}
