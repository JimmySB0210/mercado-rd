'use client'
// ============================================================
// MercadoRD — Galería de imágenes del producto
// Ruta: src/components/product/ProductGallery.tsx
// ============================================================

import { useState } from 'react'
import Image from 'next/image'
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/utils'

interface Props {
  images: string[]
  name: string
  // Video opcional, uno solo — complementa la galería de fotos, no la
  // reemplaza. Si viene, se agrega como primer elemento (antes de las
  // fotos); si no, la galería se comporta exactamente igual que antes.
  videoUrl?: string | null
}

type MediaItem = { type: 'image'; src: string } | { type: 'video'; src: string }

export function ProductGallery({ images, name, videoUrl }: Props) {
  const imageItems: MediaItem[] = (images.length > 0 ? images : [PLACEHOLDER_PRODUCT_IMAGE]).map(src => ({ type: 'image', src }))
  const all: MediaItem[] = videoUrl ? [{ type: 'video', src: videoUrl }, ...imageItems] : imageItems
  const [selected, setSelected] = useState(0)
  const current = all[selected]

  return (
    <div className="flex flex-col gap-3">
      {/* Elemento principal */}
      <div
        className="relative aspect-square overflow-hidden bg-gray-100 border border-gray-100"
        style={{ borderRadius: 'var(--radius-card)' }}
      >
        {current.type === 'video' ? (
          <video
            src={current.src}
            controls
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Image
            src={current.src}
            alt={name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
      </div>

      {/* Miniaturas — solo si hay más de un elemento */}
      {all.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {all.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === selected
                  ? 'border-[var(--brand-blue)] opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {item.type === 'video' ? (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white text-xl">
                  ▶️
                </div>
              ) : (
                <Image
                  src={item.src}
                  alt={`${name} ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
