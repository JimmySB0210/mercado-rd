'use client'
// ============================================================
// MercadoRD — Acciones del producto (talla, color, carrito)
// Ruta: src/components/product/ProductActions.tsx
// ============================================================

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { formatPrice } from '@/types/database.types'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { ProductVariant } from '@/types/database.types'
import type { Product } from '@/types'

interface ProductActionProps {
  // Recibe el producto completo para pasarlo íntegro al store
  product: Product
  variants?: ProductVariant[]
}

export function ProductActions({ product, variants = [] }: ProductActionProps) {
  const { t } = useTranslation('products')
  const addItem = useCartStore(s => s.addItem)
  const hasVariants = variants.length > 0

  // Sin variantes: usa los arrays planos del producto (comportamiento de siempre)
  const legacySizes = product.sizes ?? []
  const legacyColors = product.colors ?? []

  // Con variantes: valores únicos derivados de las filas de product_variants
  const variantSizes = [...new Set(variants.map(v => v.size).filter((s): s is string => !!s))]
  const variantColors = [...new Set(variants.map(v => v.color).filter((c): c is string => !!c))]

  const sizes = hasVariants ? variantSizes : legacySizes
  const colors = hasVariants ? variantColors : legacyColors

  // Primera variante con image_url de cada color — usada para la miniatura
  const colorImageMap = new Map<string, string>()
  for (const v of variants) {
    if (v.color && v.image_url && !colorImageMap.has(v.color)) {
      colorImageMap.set(v.color, v.image_url)
    }
  }

  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.length === 1 ? sizes[0] : null
  )
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colors.length === 1 ? colors[0] : null
  )
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const needsSize = sizes.length > 0
  const needsColor = colors.length > 0
  const selectionComplete = (!needsSize || selectedSize) && (!needsColor || selectedColor)

  const matchedVariant = hasVariants && selectionComplete
    ? variants.find(v => (v.size ?? null) === selectedSize && (v.color ?? null) === selectedColor) ?? null
    : null

  const effectiveStock = hasVariants ? (matchedVariant?.stock ?? 0) : product.stock
  const isOutOfStock = hasVariants ? (matchedVariant !== null && matchedVariant.stock === 0) : product.stock === 0

  const canAdd = hasVariants
    ? !!matchedVariant && matchedVariant.stock > 0
    : product.stock > 0 && selectionComplete

  const handleAdd = () => {
    if (!canAdd) return

    addItem(
      product,
      quantity,
      selectedSize ?? undefined,
      selectedColor ?? undefined,
      matchedVariant?.id,
      matchedVariant?.price_rdp ?? undefined,
    )

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Selector de talla */}
      {needsSize && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            {t('sizeLabel')}
            {selectedSize && <span className="ml-2 text-gray-400 font-normal">{selectedSize}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  selectedSize === size
                    ? 'border-[var(--brand-blue)] text-[var(--brand-blue)] bg-[color-mix(in_srgb,var(--brand-blue)_8%,transparent)]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selector de color */}
      {needsColor && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            {t('colorLabel')}
            {selectedColor && <span className="ml-2 text-gray-400 font-normal">{selectedColor}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => {
              const thumbUrl = colorImageMap.get(color)
              return thumbUrl ? (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                  aria-label={color}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedColor === color
                      ? 'border-[var(--brand-blue)]'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl} alt={color} className="w-full h-full object-cover" />
                </button>
              ) : (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    selectedColor === color
                      ? 'border-[var(--brand-blue)] text-[var(--brand-blue)] bg-[color-mix(in_srgb,var(--brand-blue)_8%,transparent)]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {color}
                </button>
              )
            })}
          </div>
          {/* Info de la variante seleccionada — integrada, no corta el flujo Talla → Color → Cantidad */}
          {hasVariants && matchedVariant && (
            <p className="text-xs text-gray-500 mt-2">
              {matchedVariant.price_rdp !== null && (
                <span className="font-medium text-gray-700">{formatPrice(matchedVariant.price_rdp)} · </span>
              )}
              {matchedVariant.stock === 0 ? (
                <span className="font-medium text-red-500">{t('outOfStock')}</span>
              ) : (
                <span>{t('stockAvailable', { count: matchedVariant.stock })}</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Cantidad */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">{t('quantityLabel')}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            disabled={quantity <= 1}
          >
            −
          </button>
          <span className="w-8 text-center font-medium text-gray-900">{quantity}</span>
          <button
            onClick={() => setQuantity(q => Math.min(effectiveStock, q + 1))}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            disabled={quantity >= effectiveStock}
          >
            +
          </button>
        </div>
      </div>

      {/* Botón añadir al carrito */}
      <button
        onClick={handleAdd}
        disabled={!canAdd}
        className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all ${
          added
            ? 'bg-green-500'
            : canAdd
            ? 'bg-[var(--brand-red)] hover:brightness-90 active:scale-[0.98]'
            : 'bg-gray-300 cursor-not-allowed text-white'
        }`}
      >
        {isOutOfStock
          ? (hasVariants ? t('outOfStock') : t('noStock'))
          : !canAdd
          ? (needsSize && !selectedSize ? t('selectSize') : t('selectColor'))
          : added
          ? t('addedToCart')
          : t('addToCart')}
      </button>

    </div>
  )
}
