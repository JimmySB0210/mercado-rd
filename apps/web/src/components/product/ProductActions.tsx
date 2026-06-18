'use client'
// ============================================================
// MercadoRD — Acciones del producto (talla, color, carrito)
// Ruta: src/components/product/ProductActions.tsx
// ============================================================

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import type { Product } from '@/types'

interface ProductActionProps {
  // Recibe el producto completo para pasarlo íntegro al store
  product: Product
}

export function ProductActions({ product }: ProductActionProps) {
  const addItem = useCartStore(s => s.addItem)

  // Normalizar arrays opcionales — Product.sizes y .colors son optativos en el tipo
  const sizes = product.sizes ?? []
  const colors = product.colors ?? []

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
  const canAdd =
    product.stock > 0 &&
    (!needsSize || selectedSize) &&
    (!needsColor || selectedColor)

  const handleAdd = () => {
    if (!canAdd) return

    addItem(
      product,
      quantity,
      selectedSize ?? undefined,
      selectedColor ?? undefined,
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
            Talla
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
            Color
            {selectedColor && <span className="ml-2 text-gray-400 font-normal">{selectedColor}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => (
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
            ))}
          </div>
        </div>
      )}

      {/* Cantidad */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Cantidad</p>
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
            onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            disabled={quantity >= product.stock}
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
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        {product.stock === 0
          ? 'Sin stock'
          : !canAdd
          ? `Selecciona ${needsSize && !selectedSize ? 'talla' : 'color'}`
          : added
          ? '✓ Añadido al carrito'
          : 'Añadir al carrito'}
      </button>

    </div>
  )
}
