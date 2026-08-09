'use client'
// ============================================================
// MercadoRD — Registro de vendor (wizard de 6 pasos)
// Ruta: src/app/vendor/register/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'
import { VendorRegisterWizard } from '@/components/vendor/VendorRegisterWizard'
import type { Vendor, Category } from '@/types/database.types'
import type { VendorWizardM2MData } from '@/components/vendor/wizard/vendorWizardTypes'

interface ProvinceOption { id: number; name: string }

export default function VendorRegisterPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [checking, setChecking] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [initialM2M, setInitialM2M] = useState<VendorWizardM2MData | undefined>(undefined)
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // Si ya completó el onboarding, no necesita pasar por el wizard de
  // nuevo — si tiene un vendor a medias, retoma en su onboarding_step
  // con las selecciones muchos-a-muchos que ya había guardado
  useEffect(() => {
    if (authLoading) return
    if (!user) { setChecking(false); return }

    const supabase = createClient()
    supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (data?.onboarding_completed) {
          setRedirecting(true)
          router.push('/dashboard')
          return
        }

        if (data) {
          const [businessTypesRes, categoriesRes, servicesRes, customersRes] = await Promise.all([
            supabase.from('vendor_business_types').select('business_type').eq('vendor_id', data.id),
            supabase.from('vendor_categories').select('category_id').eq('vendor_id', data.id),
            supabase.from('vendor_services').select('service').eq('vendor_id', data.id),
            supabase.from('vendor_target_customers').select('customer_type').eq('vendor_id', data.id),
          ])
          setInitialM2M({
            businessTypes: (businessTypesRes.data ?? []).map(r => r.business_type),
            categoryIds: (categoriesRes.data ?? []).map(r => r.category_id),
            services: (servicesRes.data ?? []).map(r => r.service),
            targetCustomers: (customersRes.data ?? []).map(r => r.customer_type),
          })
        }

        setVendor(data ?? null)
        setChecking(false)
      })
  }, [user, authLoading, router])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('provinces_rd')
      .select('id, name')
      .order('name')
      .then(({ data }) => setProvinces(data ?? []))
    supabase
      .from('categories')
      .select('id, name, slug, emoji, sort_order, parent_id')
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  if (authLoading || checking || redirecting) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: BRAND.gray, fontSize: 14 }}>Cargando...</p>
      </div>
    )
  }

  // Sin sesión — pedir que inicie sesión o se registre primero
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="auth-card" style={{ background: '#fff', borderRadius: 12, maxWidth: 440, width: '100%', boxShadow: '0 2px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 8 }}>
            <span style={{ color: BRAND.blue }}>Mercado</span><span style={{ color: BRAND.red }}>RD</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: BRAND.dark }}>
            Necesitas una cuenta para vender en MercadoRD
          </h1>
          <p style={{ color: BRAND.gray, marginBottom: 24, fontSize: 14 }}>
            Inicia sesión o crea una cuenta gratis para registrar tu tienda.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a
              href="/login?redirect=/vendor/register"
              style={{ background: BRAND.blue, color: '#fff', textDecoration: 'none', padding: 14, borderRadius: 8, fontWeight: 600, fontSize: 15, textAlign: 'center' }}
            >
              Iniciar sesión
            </a>
            <a
              href="/register?redirect=/vendor/register"
              style={{ background: '#fff', color: BRAND.blue, border: `1px solid ${BRAND.blue}`, textDecoration: 'none', padding: 14, borderRadius: 8, fontWeight: 600, fontSize: 15, textAlign: 'center' }}
            >
              Crear cuenta gratis
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <VendorRegisterWizard
      userId={user.id}
      initialVendor={vendor}
      initialStep={vendor?.onboarding_step ?? 1}
      initialM2M={initialM2M}
      provinces={provinces}
      categories={categories}
    />
  )
}
