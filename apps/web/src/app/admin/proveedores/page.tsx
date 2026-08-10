// ============================================================
// MercadoRD — Gestión de verificación de vendors (admin)
// Ruta: src/app/admin/proveedores/page.tsx
// ============================================================
// Página dedicada, separada de la tabla básica del dashboard general
// (/admin). Lista filtrable + panel de detalle con toda la info del
// wizard de registro + control de nivel de verificación (1-4).
// ============================================================

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { isCurrentUserAdmin, getAllVendorsForVerification, getVendorDetailForAdmin } from '@/lib/queries/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { VendorVerificationFilters } from '@/components/admin/VendorVerificationFilters'
import { VerificationLevelControl } from '@/components/admin/VerificationLevelControl'
import { VerificationBadge } from '@/components/vendor/VerificationBadge'
import { VendorOptionLabel } from '@/components/vendor/VendorOptionLabel'
import { BRAND } from '@/lib/colors'

export default async function AdminProveedoresPage(
  { searchParams }: { searchParams: Promise<{ vendor?: string; level?: string; businessType?: string }> }
) {
  const { vendor: vendorId, level: levelFilter, businessType: businessTypeFilter } = await searchParams

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) redirect('/admin')

  const [allVendors, selectedVendor] = await Promise.all([
    getAllVendorsForVerification(),
    vendorId ? getVendorDetailForAdmin(vendorId) : Promise.resolve(null),
  ])

  const vendors = allVendors.filter(v => {
    if (levelFilter && String(v.verification_level) !== levelFilter) return false
    if (businessTypeFilter && !v.business_types.includes(businessTypeFilter as any)) return false
    return true
  })

  const buildFilterQuery = (extra: Record<string, string>) => {
    const params = new URLSearchParams()
    if (levelFilter) params.set('level', levelFilter)
    if (businessTypeFilter) params.set('businessType', businessTypeFilter)
    Object.entries(extra).forEach(([k, v]) => params.set(k, v))
    return `?${params.toString()}`
  }

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh' }}>
      <AdminSidebar />

      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Verificación de proveedores</h1>
          <p style={{ color: '#666', fontSize: 14 }}>Revisa la información del wizard y asigna el nivel de confianza de cada vendor</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedVendor ? '1fr 1.3fr' : '1fr', gap: 20, alignItems: 'start' }} className="proveedores-grid">

          {/* Lista */}
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Vendors ({vendors.length})</div>
              <Suspense fallback={null}>
                <VendorVerificationFilters />
              </Suspense>
            </div>

            <div style={{ maxHeight: 720, overflowY: 'auto' }}>
              {vendors.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#999' }}>
                  Ningún vendor coincide con estos filtros.
                </div>
              ) : (
                vendors.map(v => {
                  const active = v.id === vendorId
                  return (
                    <a
                      key={v.id}
                      href={`/admin/proveedores${buildFilterQuery({ vendor: v.id })}`}
                      style={{
                        display: 'block', padding: '12px 18px', borderBottom: '1px solid #f8f8f8',
                        textDecoration: 'none', color: 'inherit',
                        background: active ? '#EAF1FC' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{v.business_name}</span>
                        <VerificationBadge level={v.verification_level} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        {v.business_types.slice(0, 3).map(bt => (
                          <span key={bt} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#F3F4F6', color: '#666', fontWeight: 600 }}>
                            <VendorOptionLabel category="businessType" value={bt} />
                          </span>
                        ))}
                        {!v.onboarding_completed && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#FEF9C3', color: '#713f12', fontWeight: 600 }}>
                            ⏳ Onboarding incompleto
                          </span>
                        )}
                      </div>
                      {v.province_name && (
                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>📍 {v.province_name}</div>
                      )}
                    </a>
                  )
                })
              )}
            </div>
          </div>

          {/* Detalle */}
          {selectedVendor && (
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '18px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: '#111' }}>{selectedVendor.business_name}</div>
                  {selectedVendor.legal_name && (
                    <div style={{ fontSize: 12, color: '#999' }}>{selectedVendor.legal_name}{selectedVendor.rnc && ` · RNC ${selectedVendor.rnc}`}</div>
                  )}
                </div>
                <a href={`/tienda/${selectedVendor.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: BRAND.blue, textDecoration: 'none', fontWeight: 600 }}>
                  Ver tienda pública ↗
                </a>
              </div>

              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Control de nivel */}
                <div>
                  <p style={sectionLabelStyle}>Nivel de verificación</p>
                  <VerificationLevelControl vendorId={selectedVendor.id} currentLevel={selectedVendor.verification_level} />
                </div>

                {/* Onboarding */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <InfoStat label="Onboarding" value={selectedVendor.onboarding_completed ? '✅ Completo' : `⏳ Paso ${selectedVendor.onboarding_step ?? 1}`} />
                  <InfoStat label="Productos" value={String(selectedVendor.product_count)} />
                  <InfoStat label="Plan" value={selectedVendor.plan} />
                  <InfoStat label="Provincia" value={selectedVendor.province_name ?? '—'} />
                </div>

                {/* Contacto */}
                <div>
                  <p style={sectionLabelStyle}>Contacto</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13, color: '#333' }}>
                    {selectedVendor.contact_full_name && <p>👤 {selectedVendor.contact_full_name}</p>}
                    {selectedVendor.whatsapp && <p>💬 WhatsApp: {selectedVendor.whatsapp}</p>}
                    {selectedVendor.instagram && <p>📷 Instagram: {selectedVendor.instagram}</p>}
                    {selectedVendor.address && <p>📍 {selectedVendor.address}{selectedVendor.municipio && `, ${selectedVendor.municipio}`}{selectedVendor.sector && ` (${selectedVendor.sector})`}</p>}
                    {!selectedVendor.contact_full_name && !selectedVendor.whatsapp && !selectedVendor.instagram && !selectedVendor.address && (
                      <p style={{ color: '#bbb' }}>Sin datos de contacto.</p>
                    )}
                  </div>
                </div>

                {/* Tipos de negocio */}
                <div>
                  <p style={sectionLabelStyle}>Tipos de negocio</p>
                  {selectedVendor.business_types.length > 0 ? (
                    <ChipList items={selectedVendor.business_types.map(bt => ({ key: bt, content: <VendorOptionLabel category="businessType" value={bt} /> }))} />
                  ) : <EmptyNote />}
                </div>

                {/* Categorías */}
                <div>
                  <p style={sectionLabelStyle}>Categorías</p>
                  {selectedVendor.categories.length > 0 ? (
                    <ChipList items={selectedVendor.categories.map(c => ({ key: String(c.id), content: `${c.emoji} ${c.name}` }))} />
                  ) : <EmptyNote />}
                </div>

                {/* Presencia física / fabricación */}
                <div>
                  <p style={sectionLabelStyle}>Presencia física</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13, color: '#333' }}>
                    <p>{selectedVendor.has_physical_store ? '✅' : '❌'} Tienda física</p>
                    <p>{selectedVendor.has_warehouse ? '✅' : '❌'} Almacén</p>
                    <p>{selectedVendor.has_workshop ? '✅' : '❌'} Taller</p>
                  </div>
                </div>

                <div>
                  <p style={sectionLabelStyle}>Estado de fabricación</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 13, color: '#333' }}>
                    {selectedVendor.manufacturing_status ? (
                      <>
                        <p>🏭 <VendorOptionLabel category="manufacturingStatus" value={selectedVendor.manufacturing_status} /></p>
                        {selectedVendor.production_time && (
                          <p>⏱️ Tiempo de producción: {selectedVendor.production_time === 'custom'
                            ? selectedVendor.production_time_custom
                            : <VendorOptionLabel category="productionTime" value={selectedVendor.production_time} />}
                          </p>
                        )}
                        {selectedVendor.accepts_private_label !== null && (
                          <p>🏷️ Marca privada: {selectedVendor.accepts_private_label ? 'Sí' : 'No'}</p>
                        )}
                        {selectedVendor.allows_customization && (
                          <p>🎨 Personalización: <VendorOptionLabel category="customizationOption" value={selectedVendor.allows_customization} /></p>
                        )}
                      </>
                    ) : <EmptyNote />}
                  </div>
                </div>

                {/* Servicios */}
                <div>
                  <p style={sectionLabelStyle}>Servicios</p>
                  {selectedVendor.services.length > 0 ? (
                    <ChipList items={selectedVendor.services.map(s => ({ key: s, content: <VendorOptionLabel category="service" value={s} /> }))} variant="check" />
                  ) : <EmptyNote />}
                </div>

                {/* MOQ */}
                <div>
                  <p style={sectionLabelStyle}>Cantidad mínima de compra</p>
                  {selectedVendor.min_order_quantity ? (
                    <p style={{ fontSize: 13, color: '#111', fontWeight: 600 }}>
                      {selectedVendor.min_order_quantity} {selectedVendor.min_order_unit ?? 'unidades'}
                    </p>
                  ) : <EmptyNote />}
                </div>

                {/* A quién vende */}
                <div>
                  <p style={sectionLabelStyle}>Clientes que atiende</p>
                  {selectedVendor.target_customers.length > 0 ? (
                    <ChipList items={selectedVendor.target_customers.map(c => ({ key: c, content: <VendorOptionLabel category="customerType" value={c} /> }))} />
                  ) : <EmptyNote />}
                </div>

              </div>
            </div>
          )}
        </div>

        <style>{`
          @media (max-width: 1100px) {
            .proveedores-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  )
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{value}</p>
    </div>
  )
}

function ChipList({ items, variant = 'plain' }: { items: { key: string; content: React.ReactNode }[]; variant?: 'plain' | 'check' }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: variant === 'check' ? 12 : 6 }}>
      {items.map(item => (
        variant === 'check' ? (
          <span key={item.key} style={{ fontSize: 13, color: '#333' }}>
            <span style={{ color: BRAND.green, fontWeight: 700 }}>✓</span> {item.content}
          </span>
        ) : (
          <span key={item.key} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: '#F3F4F6', color: '#666', fontWeight: 600 }}>
            {item.content}
          </span>
        )
      ))}
    </div>
  )
}

function EmptyNote() {
  return <p style={{ fontSize: 12, color: '#bbb' }}>Sin datos.</p>
}
