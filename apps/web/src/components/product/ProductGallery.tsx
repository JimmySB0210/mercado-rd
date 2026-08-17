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
}

export function ProductGallery({ images, name }: Props) {
  const all = images.length > 0 ? images : [PLACEHOLDER_PRODUCT_IMAGE]
  const [selected, setSelected] = useState(0)

  return (
    <div className="flex flex-col gap-3">
      {/* Imagen principal */}
      <div
        className="relative aspect-square overflow-hidden bg-gray-100 border border-gray-100"
        style={{ borderRadius: 'var(--radius-card)' }}
      >
        <Image
          src={all[selected]}
          alt={name}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Miniaturas — solo si hay más de una */}
      {all.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {all.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === selected
                  ? 'border-[var(--brand-blue)] opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`${name} ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
