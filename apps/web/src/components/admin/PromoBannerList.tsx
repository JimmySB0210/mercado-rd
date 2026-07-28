'use client'
// ============================================================
// MercadoRD — Lista de banners promocionales (admin)
// Ruta: src/components/admin/PromoBannerList.tsx
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { deleteImage } from '@/lib/storage/upload'
import { BRAND } from '@/lib/colors'
import type { PromoBanner } from '@/types/database.types'

interface Props {
  banners: PromoBanner[]
  setBanners: React.Dispatch<React.SetStateAction<PromoBanner[]>>
  onEdit: (banner: PromoBanner) => void
}

// Expirado = tiene expires_at Y ya pasó — distinto de "inactivo" (desactivado a mano)
function isExpired(banner: PromoBanner): boolean {
  return !!banner.expires_at && new Date(banner.expires_at).getTime() < Date.now()
}

export function PromoBannerList({ banners, setBanners, onEdit }: Props) {
  const supabase = createClient()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const move = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= banners.length) return

    const a = banners[index]
    const b = banners[targetIndex]
    setLoadingId(a.id)

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('promo_banners').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('promo_banners').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    setLoadingId(null)

    if (e1 || e2) {
      console.error('[PromoBannerList] move', e1 ?? e2)
      return
    }

    const next = [...banners]
    next[index] = { ...a, sort_order: b.sort_order }
    next[targetIndex] = { ...b, sort_order: a.sort_order }
    next.sort((x, y) => x.sort_order - y.sort_order)
    setBanners(next)
  }

  const toggleActive = async (banner: PromoBanner) => {
    setLoadingId(banner.id)
    const { error } = await supabase
      .from('promo_banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id)
    setLoadingId(null)

    if (error) {
      console.error('[PromoBannerList] toggle', error)
      return
    }
    setBanners(prev => prev.map(b => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b)))
  }

  const remove = async (banner: PromoBanner) => {
    const confirmed = window.confirm(
      `¿Eliminar el banner "${banner.title ?? 'sin título'}"? Esta acción no se puede deshacer.`
    )
    if (!confirmed) return

    setLoadingId(banner.id)
    const { error } = await supabase.from('promo_banners').delete().eq('id', banner.id)
    setLoadingId(null)

    if (error) {
      console.error('[PromoBannerList] delete', error)
      return
    }
    setBanners(prev => prev.filter(b => b.id !== banner.id))

    // Limpieza de los archivos en Storage — no bloquea la UI si falla
    const path = banner.image_url.split('/banners/')[1]
    if (path) deleteImage('banners', path)
    if (banner.mobile_image_url) {
      const mobilePath = banner.mobile_image_url.split('/banners/')[1]
      if (mobilePath) deleteImage('banners', mobilePath)
    }
  }

  if (banners.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#999' }}>
        Todavía no hay banners promocionales. Crea el primero abajo.
      </div>
    )
  }

  return (
    <div>
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
            borderBottom: i < banners.length - 1 ? '1px solid #f0f0f0' : 'none',
            opacity: loadingId === banner.id ? 0.5 : 1,
            flexWrap: 'wrap',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.image_url}
            alt={banner.title ?? 'Banner promocional'}
            style={{ width: 72, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#f0f0f0' }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {banner.title || <span style={{ color: '#bbb', fontWeight: 400 }}>Sin título</span>}
            </div>
            <div style={{ fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ flexShrink: 0 }}>Orden: {banner.sort_order}</span>
              {banner.link_url && (
                <>
                  <span style={{ flexShrink: 0 }}>·</span>
                  <a
                    href={banner.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#999', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap', display: 'inline-block',
                    }}
                  >
                    {banner.link_url}
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Agrupados para que, si no caben en una línea, bajen juntos a
              una segunda fila en vez de empujarse fuera del contenedor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 10, flexShrink: 0,
                background: banner.is_active ? '#DCFCE7' : '#F3F4F6',
                color: banner.is_active ? '#166534' : '#666',
              }}
            >
              {banner.is_active ? 'Activo' : 'Inactivo'}
            </span>

            {isExpired(banner) && (
              <span
                style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 10, flexShrink: 0,
                  background: '#FEF3C7', color: '#92400E',
                }}
              >
                ⏱️ Expirado
              </span>
            )}

            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0 || loadingId !== null}
                title="Subir"
                style={{ width: 26, height: 26, border: '1px solid #e5e5e5', borderRadius: 6, background: '#fff', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.4 : 1, fontSize: 12 }}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === banners.length - 1 || loadingId !== null}
                title="Bajar"
                style={{ width: 26, height: 26, border: '1px solid #e5e5e5', borderRadius: 6, background: '#fff', cursor: i === banners.length - 1 ? 'not-allowed' : 'pointer', opacity: i === banners.length - 1 ? 0.4 : 1, fontSize: 12 }}
              >
                ↓
              </button>
            </div>

            <button
              type="button"
              onClick={() => toggleActive(banner)}
              disabled={loadingId !== null}
              style={{
                fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 6, flexShrink: 0,
                background: banner.is_active ? '#fff' : BRAND.blue,
                color: banner.is_active ? '#666' : '#fff',
                border: banner.is_active ? '1px solid #ddd' : 'none',
                cursor: loadingId !== null ? 'not-allowed' : 'pointer',
              }}
            >
              {banner.is_active ? 'Desactivar' : 'Activar'}
            </button>

            <button
              type="button"
              onClick={() => onEdit(banner)}
              disabled={loadingId !== null}
              style={{ fontSize: 11, fontWeight: 700, color: BRAND.blue, background: 'transparent', border: 'none', cursor: loadingId !== null ? 'not-allowed' : 'pointer', flexShrink: 0 }}
            >
              Editar
            </button>

            <button
              type="button"
              onClick={() => remove(banner)}
              disabled={loadingId !== null}
              style={{ fontSize: 11, fontWeight: 700, color: BRAND.red, background: 'transparent', border: 'none', cursor: loadingId !== null ? 'not-allowed' : 'pointer', flexShrink: 0 }}
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
