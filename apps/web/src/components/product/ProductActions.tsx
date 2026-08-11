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
import type { VariantDynamicDimension, VariantDynamicValuesMap } from '@/app/producto/[id]/ProductPageContent'

interface ProductActionProps {
  // Recibe el producto completo para pasarlo íntegro al store
  product: Product
  variants?: ProductVariant[]
  // Presentes solo si el producto usa atributos dinámicos de variante
  // (ej. Capacidad + Color). Si vienen vacíos, el selector se comporta
  // exactamente igual que con el sistema viejo de Talla/Color.
  dynamicDimensions?: VariantDynamicDimension[]
  variantDynamicValues?: VariantDynamicValuesMap
}

export function ProductActions({
  product, variants = [], dynamicDimensions = [], variantDynamicValues = {},
}: ProductActionProps) {
  const { t } = useTranslation('products')
  const addItem = useCartStore(s => s.addItem)
  const hasVariants = variants.length > 0
  const hasDynamicDims = dynamicDimensions.length > 0

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

  // ─── Selección de dimensiones dinámicas (ej. Capacidad, Color) ───────
  const [selectedDynamicValues, setSelectedDynamicValues] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {}
    for (const dim of dynamicDimensions) {
      init[dim.attributeId] = dim.options.length === 1 ? dim.options[0].value : null
    }
    return init
  })

  const dynamicColorDim = dynamicDimensions.find(d => d.key.toLowerCase() === 'color') ?? null
  const dynamicColorImageMap = new Map<string, string>()
  if (dynamicColorDim) {
    for (const v of variants) {
      const code = variantDynamicValues[v.id]?.[dynamicColorDim.attributeId]
      if (code && v.image_url && !dynamicColorImageMap.has(code)) {
        dynamicColorImageMap.set(code, v.image_url)
      }
    }
  }

  const dynamicSelectionComplete = dynamicDimensions.every(d => !!selectedDynamicValues[d.attributeId])
  const dynamicMatchedVariant = hasDynamicDims && dynamicSelectionComplete
    ? variants.find(v =>
        dynamicDimensions.every(d => (variantDynamicValues[v.id]?.[d.attributeId] ?? null) === selectedDynamicValues[d.attributeId])
      ) ?? null
    : null

  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const needsSize = !hasDynamicDims && sizes.length > 0
  const needsColor = !hasDynamicDims && colors.length > 0
  const selectionComplete = (!needsSize || selectedSize) && (!needsColor || selectedColor)

  const matchedVariant = !hasDynamicDims && hasVariants && selectionComplete
    ? variants.find(v => (v.size ?? null) === selectedSize && (v.color ?? null) === selectedColor) ?? null
    : null

  // Variante activa, sea del sistema viejo (Talla/Color) o del dinámico
  const activeMatchedVariant = hasDynamicDims ? dynamicMatchedVariant : matchedVariant

  const effectiveStock = hasVariants ? (activeMatchedVariant?.stock ?? 0) : product.stock
  const isOutOfStock = hasVariants ? (activeMatchedVariant !== null && activeMatchedVariant.stock === 0) : product.stock === 0

  const canAdd = hasVariants
    ? !!activeMatchedVariant && activeMatchedVariant.stock > 0
    : product.stock > 0 && selectionComplete

  // Etiqueta ya armada para el carrito (ej. "Capacidad: 128 GB · Color: Negro")
  // — usa las labels de attribute_options, no los códigos guardados.
  const dynamicVariantLabel = hasDynamicDims && dynamicSelectionComplete
    ? dynamicDimensions
        .map(dim => {
          const value = selectedDynamicValues[dim.attributeId]
          const label = dim.options.find(o => o.value === value)?.label ?? value
          return `${dim.label}: ${label}`
        })
        .join(' · ')
    : undefined

  const handleAdd = () => {
    if (!canAdd) return

    addItem(
      product,
      quantity,
      hasDynamicDims ? undefined : (selectedSize ?? undefined),
      hasDynamicDims ? undefined : (selectedColor ?? undefined),
      activeMatchedVariant?.id,
      activeMatchedVariant?.price_rdp ?? undefined,
      dynamicVariantLabel,
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

      {/* Selectores de dimensiones dinámicas (ej. Capacidad, Color) */}
      {hasDynamicDims && dynamicDimensions.map(dim => {
        const selectedValue = selectedDynamicValues[dim.attributeId] ?? null
        const selectedLabel = dim.options.find(o => o.value === selectedValue)?.label ?? null
        const isColorDim = dim.attributeId === dynamicColorDim?.attributeId

        return (
          <div key={dim.attributeId}>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {dim.label}
              {selectedLabel && <span className="ml-2 text-gray-400 font-normal">{selectedLabel}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {dim.options.map(opt => {
                const isSelected = selectedValue === opt.value
                const select = () => setSelectedDynamicValues(prev => ({ ...prev, [dim.attributeId]: opt.value }))
                const thumbUrl = isColorDim ? dynamicColorImageMap.get(opt.value) : undefined

                return thumbUrl ? (
                  <button
                    key={opt.value}
                    onClick={select}
                    title={opt.label}
                    aria-label={opt.label}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-[var(--brand-blue)]' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl} alt={opt.label} className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <button
                    key={opt.value}
                    onClick={select}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-[var(--brand-blue)] text-[var(--brand-blue)] bg-[color-mix(in_srgb,var(--brand-blue)_8%,transparent)]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Info de la variante dinámica seleccionada */}
      {hasDynamicDims && dynamicMatchedVariant && (
        <p className="text-xs text-gray-500 -mt-2">
          {dynamicMatchedVariant.price_rdp !== null && (
            <span className="font-medium text-gray-700">{formatPrice(dynamicMatchedVariant.price_rdp)} · </span>
          )}
          {dynamicMatchedVariant.stock === 0 ? (
            <span className="font-medium text-red-500">{t('outOfStock')}</span>
          ) : (
            <span>{t('stockAvailable', { count: dynamicMatchedVariant.stock })}</span>
          )}
        </p>
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
          ? (hasDynamicDims ? t('selectOption') : (needsSize && !selectedSize ? t('selectSize') : t('selectColor')))
          : added
          ? t('addedToCart')
          : t('addToCart')}
      </button>

    </div>
  )
}
