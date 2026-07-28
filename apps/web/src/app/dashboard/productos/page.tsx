// ============================================================
// MercadoRD — Mis Productos (vendor dashboard)
// Ruta: src/app/dashboard/productos/page.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentVendor, getVendorProducts } from '@/lib/queries/vendor-dashboard'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { FeatureToggleButton } from '@/components/vendor/FeatureToggleButton'
import { ProductActiveToggle } from '@/components/vendor/ProductActiveToggle'
import { formatPrice } from '@/types/database.types'
import { BRAND } from '@/lib/colors'

export default async function VendorProductsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/productos')

  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/vendor/register')

  const products = await getVendorProducts(vendor.id)

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'inherit', display: 'grid', gridTemplateColumns: '220px 1fr' }}>

      <DashboardSidebar />

      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Mis Productos</h1>
            <p style={{ color: '#666', fontSize: 14 }}>
              {products.length} {products.length === 1 ? 'producto publicado' : 'productos publicados'}
            </p>
          </div>
          <a
            href="/dashboard/productos/nuevo"
            style={{ background: '#111', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            + Nuevo producto
          </a>
        </div>

        {products.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <p style={{ color: '#999', fontSize: 14, marginBottom: 16 }}>Aún no has publicado ningún producto.</p>
            <a
              href="/dashboard/productos/nuevo"
              style={{ display: 'inline-block', background: BRAND.blue, color: '#fff', textDecoration: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}
            >
              Publicar mi primer producto
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {products.map((p: any) => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ aspectRatio: '1/1', background: BRAND.bg, position: 'relative' }}>
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📦</div>
                  )}
                  {!p.is_active && (
                    <span style={{ position: 'absolute', top: 8, left: 8, background: '#666', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                      Inactivo
                    </span>
                  )}
                  {p.stock === 0 && (
                    <span style={{ position: 'absolute', top: 8, right: 8, background: BRAND.red, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                      Sin stock
                    </span>
                  )}
                </div>
                <div style={{ padding: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 6, lineHeight: 1.3, minHeight: 34, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {p.name}
                  </p>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 4 }}>
                    {formatPrice(p.price_rdp)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 10 }}>
                    <span>Stock: {p.stock}</span>
                    <span>{p.sold_count} vendidos</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <FeatureToggleButton
                      productId={p.id}
                      initialFeatured={p.is_featured ?? false}
                      isPro={vendor.plan === 'pro'}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <a
                        href={`/dashboard/productos/${p.id}/editar`}
                        style={{ fontSize: 11, fontWeight: 600, color: BRAND.blue, textDecoration: 'none' }}
                      >
                        Editar
                      </a>
                      <ProductActiveToggle productId={p.id} initialActive={p.is_active} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
