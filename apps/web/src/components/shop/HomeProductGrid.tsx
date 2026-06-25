'use client'
// ============================================================
// MercadoRD — HomeProductGrid
// Ruta: src/components/shop/HomeProductGrid.tsx
// ============================================================
// Client Component — carga los productos con createPublicClient()
// (no createServerClient(), para no romper el ISR de la homepage)
// y pagina con un botón "Ver más productos" que acumula resultados.
// Cuando no hay productos reales usa el mock hardcodeado como fallback.
// El resto del componente (tiendas, trust bar) no cambia.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { Star, ShieldCheck, Users, BadgeCheck, Truck } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { ProductCard } from '@/components/product/ProductCard'
import { createPublicClient } from '@/lib/supabase/public'
import type { Product } from '@/types'

const PAGE_SIZE = 12

// ─── Mock fallback (solo cuando BD no tiene datos) ────────────
const MOCK_PRODUCTS = [
  { id:'1', name:'Samsung Galaxy S23', price:32500, old:38500, badge:'-16%', vendor:'TechStore RD', rating:4.8, reviews:124, e:'📱' },
  { id:'2', name:"Nike Air Force 1 '07", price:5200, badge:'Nuevo', vendor:'SportStore', rating:4.7, reviews:89, e:'👟' },
  { id:'3', name:'Audífonos Inalámbricos', price:1850, vendor:'TechStore RD', rating:4.6, reviews:72, e:'🎧' },
  { id:'4', name:'Juego de Sala Moderno', price:28000, vendor:'Hogar Perfecto', rating:4.9, reviews:31, e:'🛋️' },
  { id:'5', name:'Reloj Curren Elegante', price:2450, old:2900, badge:'-10%', vendor:'AccesoriosRD', rating:4.5, reviews:64, e:'⌚' },
]

const STORES = [
  { name:'TechStore RD',   cat:'Electrónica', rating:4.9, reviews:320, e:'📱', bg:BRAND.blue },
  { name:'Moda Urbana',    cat:'Moda',        rating:4.8, reviews:250, e:'👕', bg:BRAND.dark },
  { name:'Hogar Perfecto', cat:'Hogar',       rating:4.7, reviews:180, e:'🛋️', bg:'#8D6E63' },
  { name:'Belleza Total',  cat:'Belleza',     rating:4.9, reviews:210, e:'💄', bg:BRAND.red  },
  { name:'AutoPartes RD',  cat:'Autos',       rating:4.6, reviews:160, e:'🚗', bg:BRAND.green},
]

const TRUST = [
  { icon: ShieldCheck, title:'Compra 100% segura',   sub:'Protegemos tu dinero' },
  { icon: Users,       title:'Miles de compradores', sub:'Confían en nosotros'  },
  { icon: BadgeCheck,  title:'Productos de calidad', sub:'Verificados'          },
  { icon: Truck,       title:'+32 provincias',       sub:'Envíos a todo el país'},
]

const IMAGE_RATIOS = ['1/1', '4/5', '5/4', '1/1', '5/6']

async function fetchProductsPage(offset: number): Promise<Product[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(id, business_name, is_verified, province_id),
      category:categories(id, name, slug, emoji),
      province:provinces_rd(id, name)
    `)
    .eq('is_active', true)
    .order('sold_count', { ascending: false })
    .order('id', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) { console.error('[HomeProductGrid]', error); return [] }
  return (data ?? []) as Product[]
}

export function HomeProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    let active = true
    fetchProductsPage(0)
      .then(data => {
        if (!active) return
        setProducts(data)
        setHasMore(data.length === PAGE_SIZE)
      })
      .catch(error => {
        console.error('[HomeProductGrid]', error)
        if (!active) return
        setHasMore(false)
      })
      .finally(() => {
        if (!active) return
        setLoadingInitial(false)
      })
    return () => { active = false }
  }, [])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return

    setLoadingMore(true)
    try {
      const next = await fetchProductsPage(products.length)
      setProducts(prev => [...prev, ...next])
      setHasMore(next.length === PAGE_SIZE)
    } catch (error) {
      console.error('[HomeProductGrid]', error)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, products.length])

  const hasReal = !loadingInitial && products.length > 0
  const showMock = !loadingInitial && !hasReal

  return (
    <div id="productos" style={{maxWidth:1400, margin:'0 auto', padding:'8px 24px 40px'}}>

      {/* Ofertas destacadas */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', margin:'20px 0 16px'}}>
        <h2 style={{fontSize:18, fontWeight:700, color:BRAND.dark, margin:0}}>Ofertas destacadas</h2>
        <a href='/categoria/electronica' style={{color:BRAND.blue, fontSize:13, fontWeight:600, textDecoration:'none'}}>
          Ver todas →
        </a>
      </div>

      {/* Grid de productos — real o mock */}
      {hasReal && (
        <div className="grid-products">
          {products.map(p => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      )}

      {showMock && (
        <div className="grid-products">
          {MOCK_PRODUCTS.map((p, idx) => (
            <div
              key={p.id}
              style={{background:'#fff', border:'1px solid #EEE', borderRadius:10, overflow:'hidden', cursor:'pointer'}}
            >
              <div style={{aspectRatio:IMAGE_RATIOS[idx % IMAGE_RATIOS.length], background:BRAND.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, position:'relative'}}>
                {p.e}
                {p.badge && (
                  <span style={{position:'absolute', top:8, left:8, background: p.badge === 'Nuevo' ? BRAND.dark : BRAND.red, color:'#fff', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4}}>
                    {p.badge}
                  </span>
                )}
              </div>
              <div style={{padding:14}}>
                <div style={{fontWeight:600, fontSize:14, color:BRAND.dark, marginBottom:6, lineHeight:1.3}}>{p.name}</div>
                <div style={{display:'flex', alignItems:'baseline', gap:6, marginBottom:6}}>
                  <span style={{fontWeight:700, fontSize:15, color:BRAND.dark}}>RD${(p.price || 0).toLocaleString()}</span>
                  {p.old && <span style={{fontSize:12, color:'#bbb', textDecoration:'line-through'}}>RD${p.old.toLocaleString()}</span>}
                </div>
                <div style={{display:'flex', alignItems:'center', gap:4, fontSize:12, color:BRAND.gray}}>
                  <Star size={12} fill='#F5A623' color='#F5A623' />
                  {p.rating} ({p.reviews})
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ver más productos — solo si hay productos reales y quedan más por cargar */}
      {hasReal && hasMore && (
        <div style={{display:'flex', justifyContent:'center', margin:'24px 0 0'}}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              background:BRAND.blue,
              color:'#fff',
              border:'none',
              borderRadius:8,
              padding:'12px 28px',
              fontSize:14,
              fontWeight:600,
              cursor: loadingMore ? 'wait' : 'pointer',
              opacity: loadingMore ? 0.7 : 1,
            }}
          >
            {loadingMore ? 'Cargando...' : 'Ver más productos'}
          </button>
        </div>
      )}

      {/* Tiendas destacadas */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', margin:'36px 0 16px'}}>
        <h2 style={{fontSize:18, fontWeight:700, color:BRAND.dark, margin:0}}>Tiendas destacadas</h2>
        <a href='/tiendas' style={{color:BRAND.blue, fontSize:13, fontWeight:600, textDecoration:'none'}}>Ver todas →</a>
      </div>

      <div className="grid-stores" style={{marginBottom:36}}>
        {STORES.map((s,i) => (
          <div key={i} style={{background:'#fff', border:'1px solid #EEE', borderRadius:10, padding:18, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:10}}>
            <div style={{width:48, height:48, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22}}>
              {s.e}
            </div>
            <div>
              <div style={{fontWeight:600, fontSize:13, color:BRAND.dark}}>{s.name}</div>
              <div style={{fontSize:12, color:BRAND.gray}}>{s.cat}</div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:4, fontSize:12, color:BRAND.gray}}>
              <Star size={12} fill='#F5A623' color='#F5A623' />
              {s.rating} ({s.reviews})
            </div>
          </div>
        ))}
      </div>

      {/* Trust bar */}
      <div className="grid-trust" style={{background:'#fff', border:'1px solid #EEE', borderRadius:10, padding:'22px 0'}}>
        {TRUST.map((t,i) => {
          const Icon = t.icon
          return (
            <div key={i} style={{display:'flex', alignItems:'center', gap:10, justifyContent:'center'}}>
              <Icon size={20} color={BRAND.blue} />
              <div>
                <div style={{fontWeight:600, fontSize:13, color:BRAND.dark}}>{t.title}</div>
                <div style={{fontSize:11, color:BRAND.gray}}>{t.sub}</div>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
