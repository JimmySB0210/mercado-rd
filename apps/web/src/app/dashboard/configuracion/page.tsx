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
import { LogoSection } from '@/components/vendor/settings/LogoSection'
import { BasicInfoSection } from '@/components/vendor/settings/BasicInfoSection'
import { PhysicalPresenceSection } from '@/components/vendor/settings/PhysicalPresenceSection'
import { ContactSection } from '@/components/vendor/settings/ContactSection'
import { BusinessTypeSection } from '@/components/vendor/settings/BusinessTypeSection'
import { CategoriesSection } from '@/components/vendor/settings/CategoriesSection'
import { ManufacturingSection } from '@/components/vendor/settings/ManufacturingSection'
import { ServicesSection } from '@/components/vendor/settings/ServicesSection'
import { CustomersSection } from '@/components/vendor/settings/CustomersSection'
import { PaymentSection } from '@/components/vendor/settings/PaymentSection'
import { IdentityVerificationSection } from '@/components/vendor/settings/IdentityVerificationSection'
import { FaqSection } from '@/components/vendor/settings/FaqSection'
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

      const [provsRes, categoriesRes, businessTypesRes, categoryIdsRes, servicesRes, targetCustomersRes] = await Promise.all([
        supabase.from('provinces_rd').select('id, name').order('name'),
        supabase.from('categories').select('id, name, slug, emoji, sort_order, parent_id').order('sort_order'),
        supabase.from('vendor_business_types').select('business_type').eq('vendor_id', vendorData.id),
        supabase.from('vendor_categories').select('category_id').eq('vendor_id', vendorData.id),
        supabase.from('vendor_services').select('service').eq('vendor_id', vendorData.id),
        supabase.from('vendor_target_customers').select('customer_type').eq('vendor_id', vendorData.id),
      ])
      setProvinces(provsRes.data ?? [])
      setCategories(categoriesRes.data ?? [])
      setBusinessTypes((businessTypesRes.data ?? []).map(r => r.business_type))
      setCategoryIds((categoryIdsRes.data ?? []).map(r => r.category_id))
      setServices((servicesRes.data ?? []).map(r => r.service))
      setTargetCustomers((targetCustomersRes.data ?? []).map(r => r.customer_type))

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

        <div style={{ maxWidth: 560 }}>
          <LogoSection vendorId={vendor.id} userId={userId} initialLogoUrl={vendor.logo_url} />

          <BasicInfoSection
            vendorId={vendor.id}
            provinces={provinces}
            initial={{
              businessName: vendor.business_name ?? '',
              description: vendor.description ?? '',
              provinceId: vendor.province_id ? String(vendor.province_id) : '',
              address: vendor.address ?? '',
              legalName: vendor.legal_name ?? '',
              contactFullName: vendor.contact_full_name ?? '',
              municipio: vendor.municipio ?? '',
              sector: vendor.sector ?? '',
            }}
          />

          <PhysicalPresenceSection
            vendorId={vendor.id}
            initial={{
              hasPhysicalStore: vendor.has_physical_store,
              hasWarehouse: vendor.has_warehouse,
              hasWorkshop: vendor.has_workshop,
            }}
          />

          <ContactSection
            vendorId={vendor.id}
            initial={{ whatsapp: vendor.whatsapp ?? '', instagram: vendor.instagram ?? '' }}
          />

          <BusinessTypeSection vendorId={vendor.id} initialBusinessTypes={businessTypes} />

          <CategoriesSection vendorId={vendor.id} categories={categories} initialCategoryIds={categoryIds} />

          <ManufacturingSection
            vendorId={vendor.id}
            initial={{
              manufacturingStatus: vendor.manufacturing_status,
              productionTime: vendor.production_time,
              productionTimeCustom: vendor.production_time_custom ?? '',
              acceptsPrivateLabel: vendor.accepts_private_label,
              allowsCustomization: vendor.allows_customization,
            }}
          />

          <ServicesSection vendorId={vendor.id} initialServices={services} />

          <CustomersSection
            vendorId={vendor.id}
            initialTargetCustomers={targetCustomers}
            initial={{
              minOrderQuantity: vendor.min_order_quantity ? String(vendor.min_order_quantity) : '',
              minOrderUnit: vendor.min_order_unit ?? 'unidades',
            }}
          />

          <PaymentSection
            vendorId={vendor.id}
            initial={{ bankName: vendor.bank_name ?? '', bankAccount: vendor.bank_account ?? '' }}
          />

          <FaqSection vendorId={vendor.id} categoryIds={categoryIds} />

          <IdentityVerificationSection userId={userId} />
        </div>
      </div>
    </div>
  )
}
