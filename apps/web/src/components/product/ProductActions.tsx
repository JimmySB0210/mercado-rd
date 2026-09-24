'use client'
// ============================================================
// MercadoRD — Acciones del producto (talla, color, carrito)
// Ruta: src/components/product/ProductActions.tsx
// ============================================================
// Split en 3 piezas (2026-09-24, a pedido explícito de la referencia
// visual): antes era un solo bloque con selectores + botón juntos; el
// mockup los separa en dos columnas distintas de la página —
// Talla/Color/Cantidad en la columna de info, "Agregar al carrito" en
// el buy-box. Como ambas necesitan el MISMO estado (qué talla/color
// está elegido, para saber qué variante agregar), ese estado se elevó
// a un hook (useProductActionsState) detrás de un Context, en vez de
// vivir local a un solo componente — la lógica de negocio en sí
// (matching de variantes, clamp de cantidad, la llamada a addItem) es
// exactamente la misma de siempre, ni una línea cambió.
//
//   <ProductActionsProvider product=... variants=... ...>
//     ...                        ← cualquier otra cosa de la página
//     <ProductSelectors />       ← talla / color / dimensiones dinámicas / cantidad
//     ...
//     <AddToCartButton />        ← el botón, en otro lugar del árbol
//   </ProductActionsProvider>
//
// Ambos deben vivir dentro del mismo Provider (da igual en qué
// columna); si AddToCartButton se usa fuera de un Provider, lanza un
// error claro en vez de fallar en silencio.
// ============================================================

import { createContext, useContext, useEffect, useState } from 'react'
import { ChevronDown, ShoppingCart } from 'lucide-react'
import { BRAND } from '@/lib/colors'
import { useCartStore } from '@/lib/store/cart'
import { formatPrice } from '@/types/database.types'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { ProductVariant } from '@/types/database.types'
import type { Product } from '@/types'
import type { VariantDynamicDimension, VariantDynamicValuesMap } from '@/app/producto/[id]/ProductPageContent'

interface ProductActionsProps {
  // Recibe el producto completo para pasarlo íntegro al store
  product: Product
  variants?: ProductVariant[]
  // Presentes solo si el producto usa atributos dinámicos de variante
  // (ej. Capacidad + Color). Si vienen vacíos, el selector se comporta
  // exactamente igual que con el sistema viejo de Talla/Color.
  dynamicDimensions?: VariantDynamicDimension[]
  variantDynamicValues?: VariantDynamicValuesMap
}

// ─── Estado + lógica compartida — sin cambios respecto al componente
// monolítico original, solo movida a un hook para poder compartirla ───
function useProductActionsState({
  product, variants = [], dynamicDimensions = [], variantDynamicValues = {},
}: ProductActionsProps) {
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
  const sizeLikeKeys = ['talla', 'size']
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
  const [quantityInput, setQuantityInput] = useState('1')
  const [added, setAdded] = useState(false)

  // El input se mantiene en sincronía con quantity cuando este cambia
  // por los botones +/− — pero mientras la persona escribe, onChange
  // solo actualiza quantityInput (ver más abajo), nunca quantity
  // directamente, así el valor no salta ni se corrige a mitad de tecleo.
  useEffect(() => {
    setQuantityInput(String(quantity))
  }, [quantity])

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
  // Aplica el techo de stock y el piso de 1 — solo se llama al perder
  // el foco, nunca en cada tecla (no interrumpe mientras escribe).
  // MOQ por producto queda pendiente: hoy min_order_quantity vive en
  // vendors (info general del wizard de manufactura), no es un campo
  // por producto — aplicarlo como bloqueo duro es una decisión aparte.
  const clampQuantity = (raw: number): number => {
    let next = Number.isFinite(raw) ? Math.trunc(raw) : 1
    if (next > effectiveStock) next = effectiveStock
    if (next < 1) next = 1
    return next
  }

  const handleQuantityBlur = () => {
    const parsed = Number(quantityInput)
    setQuantity(clampQuantity(parsed))
  }

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

  return {
    t, hasVariants, hasDynamicDims,
    sizes, colors, colorImageMap,
    selectedSize, setSelectedSize, selectedColor, setSelectedColor,
    dynamicDimensions, selectedDynamicValues, setSelectedDynamicValues,
    dynamicColorDim, sizeLikeKeys, dynamicColorImageMap, dynamicMatchedVariant,
    quantity, quantityInput, setQuantityInput, setQuantity, handleQuantityBlur,
    needsSize, needsColor, matchedVariant, effectiveStock, isOutOfStock,
    canAdd, added, handleAdd,
  }
}

type ProductActionsState = ReturnType<typeof useProductActionsState>

const ProductActionsContext = createContext<ProductActionsState | null>(null)

function useProductActionsContext(): ProductActionsState {
  const ctx = useContext(ProductActionsContext)
  if (!ctx) {
    throw new Error('ProductSelectors/AddToCartButton deben usarse dentro de <ProductActionsProvider>')
  }
  return ctx
}

export function ProductActionsProvider({ children, ...props }: ProductActionsProps & { children: React.ReactNode }) {
  const state = useProductActionsState(props)
  return <ProductActionsContext.Provider value={state}>{children}</ProductActionsContext.Provider>
}

// Talla / Color / dimensiones dinámicas / Cantidad — sin el botón
export function ProductSelectors() {
  const {
    t, hasDynamicDims, sizes, colors, colorImageMap,
    selectedSize, setSelectedSize, selectedColor, setSelectedColor,
    dynamicDimensions, selectedDynamicValues, setSelectedDynamicValues,
    dynamicColorDim, sizeLikeKeys, dynamicColorImageMap, dynamicMatchedVariant,
    quantity, quantityInput, setQuantityInput, setQuantity, handleQuantityBlur,
    needsSize, needsColor, matchedVariant, effectiveStock, hasVariants,
  } = useProductActionsContext()

  return (
    <div className="flex flex-col gap-4">

      {/* Selector de talla — dropdown, no pills */}
      {needsSize && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">{t('sizeLabel')}</p>
          <div className="relative">
            <select
              value={selectedSize ?? ''}
              onChange={e => setSelectedSize(e.target.value || null)}
              className="w-full appearance-none"
              style={{
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)',
                padding: '11px 40px 11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                background: '#fff', color: selectedSize ? BRAND.dark : BRAND.gray, cursor: 'pointer',
              }}
            >
              <option value="">{t('selectSizePlaceholder')}</option>
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <ChevronDown size={16} color={BRAND.gray} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
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
                  className="w-10 h-10 rounded-full overflow-hidden border-2 transition-all"
                  style={{ borderColor: selectedColor === color ? 'var(--color-primary)' : 'var(--color-border)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl} alt={color} className="w-full h-full object-cover" />
                </button>
              ) : (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-1.5 text-sm font-medium ${
                    selectedColor === color ? 'text-white' : 'text-gray-600 hover:border-gray-300'
                  }`}
                  style={{
                    borderRadius: 'var(--radius-pill)',
                    border: `1px solid ${selectedColor === color ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: selectedColor === color ? 'var(--color-primary)' : 'transparent',
                    transition: 'all var(--transition-fast)',
                  }}
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
        const isSizeLikeDim = sizeLikeKeys.includes(dim.key.toLowerCase())

        // Talla / Size dinámica — mismo dropdown que el sistema viejo, en vez de pills
        if (isSizeLikeDim) {
          return (
            <div key={dim.attributeId}>
              <p className="text-sm font-medium text-gray-700 mb-2">{dim.label}</p>
              <div className="relative">
                <select
                  value={selectedValue ?? ''}
                  onChange={e => setSelectedDynamicValues(prev => ({ ...prev, [dim.attributeId]: e.target.value || null }))}
                  className="w-full appearance-none"
                  style={{
                    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)',
                    padding: '11px 40px 11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    background: '#fff', color: selectedValue ? BRAND.dark : BRAND.gray, cursor: 'pointer',
                  }}
                >
                  <option value="">{t('selectSizePlaceholder')}</option>
                  {dim.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} color={BRAND.gray} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
          )
        }

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
                    className="w-10 h-10 rounded-full overflow-hidden border-2 transition-all"
                    style={{ borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl} alt={opt.label} className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <button
                    key={opt.value}
                    onClick={select}
                    className={`px-4 py-1.5 text-sm font-medium ${
                      isSelected ? 'text-white' : 'text-gray-600 hover:border-gray-300'
                    }`}
                    style={{
                      borderRadius: 'var(--radius-pill)',
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: isSelected ? 'var(--color-primary)' : 'transparent',
                      transition: 'all var(--transition-fast)',
                    }}
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
          <input
            type="number"
            value={quantityInput}
            onChange={e => setQuantityInput(e.target.value)}
            onBlur={handleQuantityBlur}
            onFocus={e => e.target.select()}
            className="w-16 text-center font-medium text-gray-900 border border-gray-200 rounded-lg py-1.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => setQuantity(q => Math.min(effectiveStock, q + 1))}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            disabled={quantity >= effectiveStock}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

// Solo el botón — vive en el buy-box, lee el mismo estado que ProductSelectors
export function AddToCartButton() {
  const { t, hasVariants, hasDynamicDims, needsSize, selectedSize, canAdd, added, isOutOfStock, handleAdd } = useProductActionsContext()

  return (
    <button
      onClick={handleAdd}
      disabled={!canAdd}
      className={`w-full py-3.5 font-semibold text-white flex items-center justify-center gap-2 ${
        added
          ? 'bg-[var(--color-green)]'
          : canAdd
          ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:scale-[0.98]'
          : 'bg-gray-300 cursor-not-allowed text-white'
      }`}
      style={{
        borderRadius: 'var(--radius-control)',
        boxShadow: canAdd && !added ? 'var(--shadow-button)' : 'none',
        transition: 'background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)',
      }}
    >
      {canAdd && !added && <ShoppingCart size={18} />}
      {isOutOfStock
        ? (hasVariants ? t('outOfStock') : t('noStock'))
        : !canAdd
        ? (hasDynamicDims ? t('selectOption') : (needsSize && !selectedSize ? t('selectSize') : t('selectColor')))
        : added
        ? t('addedToCart')
        : t('addToCart')}
    </button>
  )
}
