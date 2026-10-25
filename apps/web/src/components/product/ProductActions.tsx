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
import { useRouter } from 'next/navigation'
import { ShoppingCart, Zap } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { useExpressCheckoutStore } from '@/lib/store/expressCheckout'
import { formatPrice } from '@/types/database.types'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { sortSizes } from '@/lib/productSizes'
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
  const router = useRouter()
  const addItem = useCartStore(s => s.addItem)
  const setExpressItem = useExpressCheckoutStore(s => s.setItem)
  const hasVariants = variants.length > 0
  const hasDynamicDims = dynamicDimensions.length > 0

  // Sin variantes: usa los arrays planos del producto (comportamiento de siempre)
  const legacySizes = product.sizes ?? []
  const legacyColors = product.colors ?? []

  // Con variantes: valores únicos derivados de las filas de product_variants.
  // Las tallas van ordenadas (la BD no garantiza el orden de las filas):
  // 5, 5.5, 6 ... 14 en calzado, XS ... XXL en ropa. Las tallas sueltas de
  // un producto sin variantes también (nunca se ordenaron: salían como las
  // escribió quien lo publicó).
  const variantSizes = sortSizes([...new Set(variants.map(v => v.size).filter((s): s is string => !!s))])
  const variantColors = [...new Set(variants.map(v => v.color).filter((c): c is string => !!c))]

  const sizes = hasVariants ? variantSizes : sortSizes(legacySizes)
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

  // ─── Tallas en cuadrícula de botones (como Nike) ──────────────────────
  // Toda talla se muestra así — calzado, ropa y cualquier otra medida
  // ("128GB", "Grande"), con variantes, con las tallas sueltas de un
  // producto sin variantes o con la talla dinámica de Camisetas/Gorras —:
  // se ven todas a la vez y las que ya no tienen stock salen tachadas y no
  // se pueden elegir. Las demás dimensiones dinámicas (Capacidad, Color…)
  // usan sus propios selectores, más abajo.

  // ¿Queda stock de esa talla? Con variantes: en el color elegido si ya hay
  // uno, si no en cualquiera de sus colores. Sin variantes no hay stock por
  // talla: vale el del producto.
  const sizeInStock = (size: string, color: string | null = selectedColor): boolean =>
    hasVariants
      ? variants.some(v => (v.size ?? null) === size && (color === null || (v.color ?? null) === color) && v.stock > 0)
      : product.stock > 0

  // Elegir otro color puede dejar sin stock la talla que ya estaba marcada
  // (queda tachada y deshabilitada): se desmarca en vez de dejar una talla
  // elegida que no se puede comprar.
  const handleSelectColor = (color: string | null) => {
    setSelectedColor(color)
    if (selectedSize && !sizeInStock(selectedSize, color)) setSelectedSize(null)
  }

  // ─── Selección de dimensiones dinámicas (ej. Capacidad, Color, Talla) ──
  const sizeLikeKeys = ['talla', 'size']
  const isSizeLikeDim = (dim: VariantDynamicDimension) => sizeLikeKeys.includes(dim.key.toLowerCase())

  // dim.options trae TODAS las opciones del atributo (XS … XXL), no solo las
  // que este producto vende: en la cuadrícula de tallas salen únicamente las
  // que alguna variante tiene (si ninguna la tuviera, todas, para no dejarla
  // vacía).
  const usedOptionsOf = (dim: VariantDynamicDimension) => {
    const used = dim.options.filter(o => variants.some(v => variantDynamicValues[v.id]?.[dim.attributeId] === o.value))
    return used.length > 0 ? used : dim.options
  }

  const [selectedDynamicValues, setSelectedDynamicValues] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {}
    for (const dim of dynamicDimensions) {
      const choices = isSizeLikeDim(dim) ? usedOptionsOf(dim) : dim.options
      init[dim.attributeId] = choices.length === 1 ? choices[0].value : null
    }
    return init
  })

  // ¿Queda stock de esa opción? Combinada con lo ya elegido en las otras
  // dimensiones (el color, por ejemplo); si todavía no se eligió nada más,
  // con cualquier combinación.
  const dynamicOptionInStock = (
    dim: VariantDynamicDimension,
    value: string,
    selection: Record<string, string | null> = selectedDynamicValues,
  ): boolean =>
    variants.some(v =>
      v.stock > 0 &&
      variantDynamicValues[v.id]?.[dim.attributeId] === value &&
      dynamicDimensions.every(d =>
        d.attributeId === dim.attributeId ||
        !selection[d.attributeId] ||
        variantDynamicValues[v.id]?.[d.attributeId] === selection[d.attributeId]
      )
    )

  // Elegir una opción puede dejar sin stock la talla que ya estaba marcada
  // (p. ej. al cambiar de color): se desmarca, igual que en el sistema de
  // Talla/Color de arriba, en vez de dejar elegida una talla que no se puede
  // comprar.
  const selectDynamicValue = (attributeId: string, value: string | null) => {
    setSelectedDynamicValues(prev => {
      const next = { ...prev, [attributeId]: value }
      for (const dim of dynamicDimensions) {
        const current = next[dim.attributeId]
        if (dim.attributeId !== attributeId && isSizeLikeDim(dim) && current && !dynamicOptionInStock(dim, current, next)) {
          next[dim.attributeId] = null
        }
      }
      return next
    })
  }

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
  // Con variantes está agotado cuando la combinación elegida no tiene stock,
  // pero también cuando NINGUNA variante tiene (o, en la cuadrícula, ninguna
  // talla del color elegido): antes el botón decía "Selecciona talla" aunque
  // todas estuvieran en 0 y solo al elegir una salía "Agotado".
  const allVariantsOut = hasVariants && variants.every(v => v.stock <= 0)
  const selectedColorSoldOut = needsSize && selectedColor !== null && !sizes.some(s => sizeInStock(s, selectedColor))
  // Lo mismo con la talla dinámica (Camisetas, Gorras): con lo ya elegido
  // (el color, por ejemplo) no queda ninguna talla con stock.
  const dynamicSelectionSoldOut = dynamicDimensions.some(
    dim => isSizeLikeDim(dim) && !usedOptionsOf(dim).some(o => dynamicOptionInStock(dim, o.value))
  )
  const isOutOfStock = hasVariants
    ? (allVariantsOut || selectedColorSoldOut || dynamicSelectionSoldOut || (activeMatchedVariant !== null && activeMatchedVariant.stock === 0))
    : product.stock === 0
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

  // "Comprar ahora" — NO toca el carrito real (ni lo suma, ni se fusiona
  // con una línea existente de la misma variante). Guarda este único
  // ítem en useExpressCheckoutStore y manda a /checkout?modo=express —
  // ese flag es lo único que hace que checkout use este ítem aislado en
  // vez del carrito completo (ver ese archivo). El id del producto va
  // también en la URL para poder volver a su página si el ítem express
  // ya no está (ej. sessionStorage se limpió entre el click y la carga).
  const handleBuyNow = () => {
    if (!canAdd) return

    setExpressItem({
      product,
      quantity,
      selected_size: hasDynamicDims ? undefined : (selectedSize ?? undefined),
      selected_color: hasDynamicDims ? undefined : (selectedColor ?? undefined),
      variant_id: activeMatchedVariant?.id,
      variant_price_rdp: activeMatchedVariant?.price_rdp ?? undefined,
      variant_label: dynamicVariantLabel,
    })

    router.push(`/checkout?modo=express&producto=${product.id}`)
  }

  return {
    t, hasVariants, hasDynamicDims,
    sizes, colors, colorImageMap,
    selectedSize, setSelectedSize, selectedColor, setSelectedColor, handleSelectColor,
    sizeInStock,
    dynamicDimensions, selectedDynamicValues, selectDynamicValue,
    isSizeLikeDim, usedOptionsOf, dynamicOptionInStock,
    dynamicColorDim, dynamicColorImageMap, dynamicMatchedVariant,
    quantity, quantityInput, setQuantityInput, setQuantity, handleQuantityBlur,
    needsSize, needsColor, matchedVariant, effectiveStock, isOutOfStock,
    canAdd, added, handleAdd, handleBuyNow,
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

// Variante que NO explota fuera del Provider — usada por componentes que
// se reusan en dos lugares de la página de producto, uno adentro del
// árbol de ProductActionsProvider (ej. el buy-box) y otro afuera (ej. la
// pestaña "Envío y entrega", que vive en un array de tabs renderizado
// como hermano del Provider, no como hijo). Devuelve null en ese segundo
// caso en vez de forzar a todo lo demás a tolerar null.
export function useOptionalProductActionsContext(): ProductActionsState | null {
  return useContext(ProductActionsContext)
}

export function ProductActionsProvider({ children, ...props }: ProductActionsProps & { children: React.ReactNode }) {
  const state = useProductActionsState(props)
  return <ProductActionsContext.Provider value={state}>{children}</ProductActionsContext.Provider>
}

// Cuadrícula de tallas (como Nike): todas visibles a la vez, la elegida con
// borde azul, las que no tienen stock tachadas y deshabilitadas. En móvil y en
// escritorio por igual. La usan las tallas de siempre (calzado, ropa, sueltas
// de un producto sin variantes) y la talla dinámica de Camisetas/Gorras.
interface SizeGridOption { value: string; label: string; inStock: boolean }

function SizeGrid({ title, options, selected, onSelect }: {
  title: string
  options: SizeGridOption[]
  selected: string | null
  onSelect: (value: string) => void
}) {
  const { t } = useTranslation('products')
  // Una talla marcada que ya no tiene stock no cuenta como elegida
  const selectedLabel = options.find(o => o.value === selected && o.inStock)?.label ?? null

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">
        {title}
        {selectedLabel && <span className="ml-2 text-gray-400 font-normal">{selectedLabel}</span>}
      </p>
      {/* Las columnas se acomodan al ANCHO DEL BLOQUE (no al de la pantalla): 3 en
          el móvil, 4 en la ficha de escritorio y las que quepan donde la columna
          es angosta (la vista previa del asistente), sin partir «Única» en dos. */}
      <div role="group" aria-label={title} className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
        {options.map(opt => {
          const isSelected = selected === opt.value && opt.inStock
          return (
            <button
              key={opt.value}
              type="button"
              disabled={!opt.inStock}
              aria-pressed={isSelected}
              aria-label={opt.inStock ? undefined : t('sizeSoldOutAria', { size: opt.label })}
              title={opt.inStock ? undefined : t('outOfStock')}
              onClick={() => onSelect(opt.value)}
              className="min-h-[44px] min-w-0 px-2 text-sm font-semibold break-words"
              style={{
                borderRadius: 'var(--radius-control)',
                border: `1px solid ${isSelected ? 'var(--color-primary)' : opt.inStock ? 'var(--color-border)' : 'var(--color-divider)'}`,
                // 2.º "borde" del botón elegido sin mover el resto de la cuadrícula
                boxShadow: isSelected ? '0 0 0 1px var(--color-primary)' : 'none',
                background: isSelected ? 'var(--color-primary-subtle)' : 'transparent',
                color: !opt.inStock ? 'var(--color-text-tertiary)' : isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                textDecoration: opt.inStock ? 'none' : 'line-through',
                cursor: opt.inStock ? 'pointer' : 'not-allowed',
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
}

// Talla / Color / dimensiones dinámicas / Cantidad — sin el botón
export function ProductSelectors() {
  const {
    t, hasDynamicDims, sizes, colors, colorImageMap,
    selectedSize, setSelectedSize, selectedColor, handleSelectColor,
    sizeInStock,
    dynamicDimensions, selectedDynamicValues, selectDynamicValue,
    isSizeLikeDim, usedOptionsOf, dynamicOptionInStock,
    dynamicColorDim, dynamicColorImageMap, dynamicMatchedVariant,
    quantity, quantityInput, setQuantityInput, setQuantity, handleQuantityBlur,
    needsSize, needsColor, matchedVariant, effectiveStock, hasVariants,
  } = useProductActionsContext()

  return (
    <div className="flex flex-col gap-4">

      {/* Tallas de siempre (Talla/Color fijos o tallas sueltas de un producto
          sin variantes) */}
      {needsSize && (
        <SizeGrid
          title={t('sizeLabel')}
          options={sizes.map(size => ({ value: size, label: size, inStock: sizeInStock(size) }))}
          selected={selectedSize}
          onSelect={setSelectedSize}
        />
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
                  onClick={() => handleSelectColor(color)}
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
                  onClick={() => handleSelectColor(color)}
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

      {/* Selectores de dimensiones dinámicas (ej. Capacidad, Color, Talla) */}
      {hasDynamicDims && dynamicDimensions.map(dim => {
        const selectedValue = selectedDynamicValues[dim.attributeId] ?? null
        const selectedLabel = dim.options.find(o => o.value === selectedValue)?.label ?? null
        const isColorDim = dim.attributeId === dynamicColorDim?.attributeId

        // Talla dinámica (Camisetas, Gorras…): la misma cuadrícula de arriba,
        // con las tallas que el producto tiene y las agotadas (con el color
        // ya elegido) tachadas.
        if (isSizeLikeDim(dim)) {
          return (
            <SizeGrid
              key={dim.attributeId}
              title={dim.label}
              options={usedOptionsOf(dim).map(o => ({ value: o.value, label: o.label, inStock: dynamicOptionInStock(dim, o.value) }))}
              selected={selectedValue}
              onSelect={value => selectDynamicValue(dim.attributeId, value)}
            />
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
                const select = () => selectDynamicValue(dim.attributeId, opt.value)
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

// Acción principal — CTA amarillo (var(--color-yellow-cta)), acá vive
// en el flujo de compra junto al resto de la ficha. Lee el mismo estado
// que ProductSelectors.
export function AddToCartButton() {
  const { t, hasVariants, hasDynamicDims, needsSize, selectedSize, canAdd, added, isOutOfStock, handleAdd } = useProductActionsContext()

  return (
    <button
      onClick={handleAdd}
      disabled={!canAdd}
      className={`w-full py-3.5 font-semibold text-body flex items-center justify-center gap-2 ${
        added
          ? 'bg-[var(--color-green)] text-white'
          : canAdd
          ? 'active:scale-[0.98]'
          : 'bg-gray-300 cursor-not-allowed text-white'
      }`}
      style={{
        borderRadius: 'var(--radius-control)',
        background: canAdd && !added ? 'var(--color-yellow-cta)' : undefined,
        color: canAdd && !added ? 'var(--color-text-primary)' : undefined,
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

// "Comprar ahora" — agrega al carrito y va directo a /checkout, sin
// quedarse en la página. Mismo estado/validación que AddToCartButton
// (talla/color/cantidad/stock), nunca navega si la selección no está
// completa.
export function BuyNowButton() {
  const { t, hasVariants, hasDynamicDims, needsSize, selectedSize, canAdd, isOutOfStock, handleBuyNow } = useProductActionsContext()

  return (
    <button
      onClick={handleBuyNow}
      disabled={!canAdd}
      className={`w-full py-3.5 font-semibold text-white text-body flex items-center justify-center gap-2 ${
        canAdd ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:scale-[0.98]' : 'bg-gray-300 cursor-not-allowed'
      }`}
      style={{
        borderRadius: 'var(--radius-control)',
        boxShadow: canAdd ? 'var(--shadow-button)' : 'none',
        transition: 'background-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)',
      }}
    >
      {canAdd && <Zap size={18} />}
      {isOutOfStock
        ? (hasVariants ? t('outOfStock') : t('noStock'))
        : !canAdd
        ? (hasDynamicDims ? t('selectOption') : (needsSize && !selectedSize ? t('selectSize') : t('selectColor')))
        : t('buyNowButton')}
    </button>
  )
}
