'use client'
// ============================================================
// MercadoRD — Configuración (vendor dashboard)
// Ruta: src/app/dashboard/configuracion/page.tsx
// ============================================================
// Cada sección es un componente independiente con su propio estado
// y guardado (ver components/vendor/settings/) — si una falla, las
// demás no se ven afectadas. Esta página solo hace la carga inicial
// (vendor + provincias/categorías) y reparte los datos como props.
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { VendorSettingsWizard } from '@/components/vendor/settings/VendorSettingsWizard'
import type { Vendor, Category, BusinessType, VendorService, CustomerType } from '@/types/database.types'

interface Province {
  id: number
  name: string
}

export default function VendorSettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([])
  const [categoryIds, setCategoryIds] = useState<number[]>([])
  const [services, setServices] = useState<VendorService[]>([])
  const [targetCustomers, setTargetCustomers] = useState<CustomerType[]>([])
  const [hasIdentitySubmitted, setHasIdentitySubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasMfa, setHasMfa] = useState(true)

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

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!vendorData) {
        router.push('/vendor/register')
        return
      }
      setVendor(vendorData)

      const [provsRes, categoriesRes, businessTypesRes, categoryIdsRes, servicesRes, targetCustomersRes, identityRes] = await Promise.all([
        supabase.from('provinces_rd').select('id, name').order('name'),
        supabase.from('categories').select('id, name, name_en, name_fr, slug, emoji, sort_order, parent_id, requires_age_confirmation').order('sort_order'),
        supabase.from('vendor_business_types').select('business_type').eq('vendor_id', vendorData.id),
        supabase.from('vendor_categories').select('category_id').eq('vendor_id', vendorData.id),
        supabase.from('vendor_services').select('service').eq('vendor_id', vendorData.id),
        supabase.from('vendor_target_customers').select('customer_type').eq('vendor_id', vendorData.id),
        // Único dato que faltaba a nivel de página para alimentar
        // computeStoreCompleteness/el stepper -- antes solo lo sabía
        // IdentityVerificationSection, internamente.
        supabase.from('external_verifications').select('id').eq('verification_type', 'identity_kyc').eq('target_type', 'user').eq('target_id', user.id).limit(1).maybeSingle(),
      ])
      setProvinces(provsRes.data ?? [])
      setCategories(categoriesRes.data ?? [])
      setBusinessTypes((businessTypesRes.data ?? []).map(r => r.business_type))
      setCategoryIds((categoryIdsRes.data ?? []).map(r => r.category_id))
      setServices((servicesRes.data ?? []).map(r => r.service))
      setTargetCustomers((targetCustomersRes.data ?? []).map(r => r.customer_type))
      setHasIdentitySubmitted(!!identityRes.data)

      setLoading(false)
    }
    load()
  }, [router, supabase])

  if (loading || !vendor || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <DashboardSidebar />

      <div style={{ padding: 28, background: '#f5f5f5' }}>
        {!hasMfa && (
          <a
            href="/perfil/seguridad"
            style={{
              display: 'block', background: '#FEF9C3', color: '#713f12', borderRadius: 10,
              padding: '12px 16px', fontSize: 13, fontWeight: 600, marginBottom: 20,
              textDecoration: 'none', maxWidth: 1180,
            }}
          >
            🔒 Activa la verificación en dos pasos para proteger tu tienda →
          </a>
        )}

        <VendorSettingsWizard
          vendor={vendor}
          userId={userId}
          provinces={provinces}
          categories={categories}
          businessTypes={businessTypes}
          categoryIds={categoryIds}
          services={services}
          targetCustomers={targetCustomers}
          hasIdentitySubmitted={hasIdentitySubmitted}
        />
      </div>
    </div>
  )
}
