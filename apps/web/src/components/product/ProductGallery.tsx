'use client'
// ============================================================
// MercadoRD — Galería de imágenes del producto
// Ruta: src/components/product/ProductGallery.tsx
// ============================================================

import { useState } from 'react'
import Image from 'next/image'
import { Check, Share2 } from 'lucide-react'
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/utils'
import { WishlistButton } from '@/components/shop/WishlistButton'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Props {
  productId: string
  images: string[]
  name: string
  // Video opcional, uno solo — complementa la galería de fotos, no la
  // reemplaza. Si viene, se agrega como primer elemento (antes de las
  // fotos); si no, la galería se comporta exactamente igual que antes.
  videoUrl?: string | null
}

type MediaItem = { type: 'image'; src: string } | { type: 'video'; src: string }

// Botón de compartir — puramente client-side (Web Share API con
// fallback a copiar el enlace), sin datos nuevos ni backend.
function ShareButton() {
  const { t } = useTranslation('products')
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title })
      } catch {
        // Cancelado por la persona — no es un error real, no hace nada
      }
      return
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={t('shareProductAria')}
      title={copied ? t('linkCopied') : t('shareProductAria')}
      className="absolute top-11 right-2 z-10 w-7 h-7 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center hover:bg-white/90 hover:scale-110 border-none cursor-pointer transition-transform"
    >
      {copied ? <Check size={14} className="text-[var(--color-green)]" /> : <Share2 size={14} className="text-gray-500" />}
    </button>
  )
}

export function ProductGallery({ productId, images, name, videoUrl }: Props) {
  const imageItems: MediaItem[] = (images.length > 0 ? images : [PLACEHOLDER_PRODUCT_IMAGE]).map(src => ({ type: 'image', src }))
  const all: MediaItem[] = videoUrl ? [{ type: 'video', src: videoUrl }, ...imageItems] : imageItems
  const [selected, setSelected] = useState(0)
  const current = all[selected]

  return (
    // Mobile: imagen arriba, miniaturas en fila debajo (como siempre).
    // Desde sm (640px): miniaturas en columna A LA IZQUIERDA de la
    // imagen — mismo orden en el DOM (miniaturas primero), flex-col-reverse
    // en mobile las manda debajo sin necesidad de order-*.
    <div className="flex flex-col-reverse sm:flex-row gap-3">

      {/* Miniaturas — solo si hay más de un elemento */}
      {all.length > 1 && (
        <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible sm:overflow-y-auto pb-1 sm:pb-0 sm:w-16 sm:flex-shrink-0 sm:max-h-[520px]">
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

      {/* Elemento principal */}
      <div
        className="relative aspect-square overflow-hidden bg-gray-100 border border-gray-100 flex-1 min-w-0"
        style={{ borderRadius: 'var(--radius-card)' }}
      >
        <WishlistButton productId={productId} />
        <ShareButton />
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
    </div>
  )
}
