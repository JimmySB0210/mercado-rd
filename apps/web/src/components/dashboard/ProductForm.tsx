'use client'
// ============================================================
// MercadoRD — Formulario de producto (crear / editar), vendor
// Ruta: src/components/dashboard/ProductForm.tsx
// ============================================================
// Compartido entre app/dashboard/productos/nuevo/page.tsx y
// app/dashboard/productos/[id]/editar/page.tsx. En 'crear' hace
// INSERT a products + product_variants. En 'editar' hace UPDATE
// a products y DELETE+INSERT de product_variants (no hay FK
// externa a product_variants, así que reemplazarlas es seguro).
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateImageFile, getImageDimensions, uploadProductImage, MIN_PRODUCT_IMAGE_DIMENSION, LOW_RESOLUTION_WARNING, validateProductVideoFile, uploadProductVideo, deleteImage } from '@/lib/storage/upload'
import { DANGEROUS_PATTERN } from '@/lib/validation'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { getCategoryName } from '@/lib/utils'
import { ProductAttributesSection, type AttributeValue, type AttributeValuesState } from '@/components/dashboard/ProductAttributesSection'
import { PricingTiersSection, type TierRow } from '@/components/vendor/PricingTiersSection'
import { ProductPreviewModal } from '@/components/dashboard/ProductPreviewModal'
import { ProductPageContent } from '@/app/producto/[id]/ProductPageContent'
import { Navbar } from '@/components/shop/Navbar'
import { computePublishQuality, qualityTier, QUALITY_TIER_EMOJI, QUALITY_TIER_COLOR } from '@/lib/productQuality'
import { BRAND } from '@/lib/colors'
import { formatPrice, discountPercent } from '@/types/database.types'
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/utils'
import type { DashboardDict } from '@/lib/i18n/es/dashboard'
import type { Product, ProductVariant, CategoryAttribute, AttributeOption, VendorService } from '@/types/database.types'

interface Category {
  id: number
  name: string
  name_en: string
  name_fr: string
  emoji: string
  slug: string
  parent_id: number | null
}

interface Province {
  id: number
  name: string
}

interface ProductFormProps {
  mode: 'crear' | 'editar'
  vendorId: string
  initialData?: {
    product: Product
    variants: ProductVariant[]
    existingImages: string[]
  }
}

interface VariantRow {
  size: string
  color: string
  stock: string
  price: string
  imageUrl: string | null
}

// Fila de variante cuando la categoría define atributos con
// applies_to_variant = true (ej. Color + Capacidad en Smartphones) — en
// vez de Talla/Color fijos, cada dimensión es un category_attribute_id.
interface DynamicVariantRow {
  values: Record<number, string>
  stock: string
  price: string
  imageUrl: string | null
}

// "Talla" también se usa para variantes que no son ropa (ej. "128GB"
// en electrónicos) — de ahí la opción "Otra" con texto libre.
const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const OTHER_SIZE = '__otra__'

// Garantía: texto libre en la BD (migración 017), sin verificación del
// sistema — estos presets son solo el atajo del <select>; "Otra" cae al
// mismo patrón de texto libre que "Otra" en Talla arriba.
const WARRANTY_PRESETS = ['Sin garantía', '7 días', '30 días', '90 días', '6 meses', '1 año']
const WARRANTY_OTHER = '__otra_garantia__'

// Mismo tipo que devuelve useTranslation('dashboard') — nunca un
// `string` genérico, para que TS siga marcando keys de traducción
// inexistentes en estos dos componentes igual que en el resto del form.
type TFunc = (key: keyof DashboardDict, params?: Record<string, string | number>) => string

// ─── Sidebar: checklist visual de calidad ────────────────────────────
// Puramente de presentación — no recalcula nada, solo pinta el
// `qualityPercent`/checks que ProductForm ya calculó (misma fórmula de
// lib/productQuality.ts que usa la lista de productos).
function QualitySidebarCard({ percent, checks, t }: {
  percent: number
  checks: { label: string; done: boolean }[]
  t: TFunc
}) {
  const tier = qualityTier(percent)
  const allDone = checks.every(c => c.done)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-form-label font-semibold text-gray-700">{t('qualityChecklistHeading')}</h3>
        <span className="text-sm font-bold" style={{ color: QUALITY_TIER_COLOR[tier].text }}>{percent}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, background: QUALITY_TIER_COLOR[tier].text }}
        />
      </div>
      <ul className="space-y-1.5 mb-2">
        {checks.map(c => (
          <li key={c.label} className="flex items-center gap-2 text-xs" style={{ color: c.done ? BRAND.dark : '#9CA3AF' }}>
            <span style={{ color: c.done ? BRAND.green : '#F59E0B', flexShrink: 0 }}>{c.done ? '✓' : '⚠'}</span>
            {c.label}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-400">{allDone ? t('qualityHintComplete') : t('qualityHintMissing')}</p>
    </div>
  )
}

// ─── Sidebar: mini vista previa siempre visible ──────────────────────
// Compacta a propósito (no es un segundo ProductPageContent) — usa los
// mismos datos que arma buildPreviewData() en ProductForm, la misma
// fuente que alimenta ProductPreviewModal y el paso "Vista previa"
// completo; acá solo se renderiza un subconjunto chico.
function PreviewSidebarCard({ data, t }: {
  data: { previewProduct: any; previewVariants: any[] }
  t: TFunc
}) {
  const { t: tp } = useTranslation('products')
  const { previewProduct, previewVariants } = data

  const image = previewProduct.images?.[0] ?? PLACEHOLDER_PRODUCT_IMAGE
  const sizes = [...new Set(previewVariants.map(v => v.size).filter(Boolean))] as string[]
  const colors = [...new Set(previewVariants.map(v => v.color).filter(Boolean))] as string[]
  const hasDiscount = !!(previewProduct.compare_rdp && previewProduct.compare_rdp > previewProduct.price_rdp)
  const chipCls = 'text-xs font-semibold rounded-full px-2.5 py-1 border border-gray-200 text-gray-700'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-form-label font-semibold text-gray-700 mb-3">{t('previewSidebarHeading')}</h3>

      <div className="rounded-xl overflow-hidden bg-gray-50 mb-3" style={{ aspectRatio: '1' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="w-full h-full object-cover" />
      </div>

      <p className="text-body font-semibold text-gray-900 leading-snug line-clamp-2 mb-1">
        {previewProduct.name || t('previewUntitledProduct')}
      </p>
      {/* Mismo criterio honesto que la página real: sin reseñas todavía
          (previewProduct.rating_count siempre 0 acá, producto nuevo) no
          se inventa una calificación — la línea simplemente no aparece,
          igual que le pasaría a un producto recién publicado. */}
      {previewProduct.rating_count > 0 && (
        <p className="text-xs text-gray-400 mb-1">
          ⭐ {previewProduct.rating_avg.toFixed(1)} · {previewProduct.sold_count} {tp('soldSuffix')}
        </p>
      )}

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-form-section font-bold" style={{ color: BRAND.blue }}>
          {formatPrice(previewProduct.price_rdp || 0)}
        </span>
        {hasDiscount && (
          <span className="text-xs text-gray-400 line-through">{formatPrice(previewProduct.compare_rdp)}</span>
        )}
      </div>

      {sizes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {sizes.map(s => <span key={s} className={chipCls}>{s}</span>)}
        </div>
      )}
      {colors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {colors.map(c => <span key={c} className={chipCls}>{c}</span>)}
        </div>
      )}

      {/* Selector de cantidad — decorativo (mismo look que verá el
          comprador en ProductSelectors), sin estado propio acá */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-400">{tp('quantityLabel')}</span>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button type="button" disabled className="w-7 h-7 flex items-center justify-center text-gray-400 cursor-default bg-white">−</button>
          <span className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-gray-700 border-x border-gray-200">1</span>
          <button type="button" disabled className="w-7 h-7 flex items-center justify-center text-gray-400 cursor-default bg-white">+</button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div
          className="w-full text-center text-xs font-semibold text-white rounded-lg py-2 flex items-center justify-center gap-1.5"
          style={{ background: BRAND.blue }}
        >
          🛒 {tp('addToCart')}
        </div>
        <div
          className="w-full text-center text-xs font-semibold rounded-lg py-2 border"
          style={{ color: BRAND.blue, borderColor: BRAND.blue }}
        >
          {tp('askVendorButton')}
        </div>
      </div>
    </div>
  )
}

export function ProductForm({ mode, vendorId, initialData }: ProductFormProps) {
  const { t, language } = useTranslation('dashboard')
  // Reuso de la barra de confianza real que ya existe en products.ts
  // (Navbar) — no se duplica texto nuevo para la tarjeta de confianza
  // del costado.
  const { t: tp } = useTranslation('products')
  // Labels de servicios ya existentes (t('service.manufacturing') etc,
  // mismo namespace que usa ProviderFilters.tsx) — no se duplican acá.
  const { t: tv } = useTranslation('vendorOptions')
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [planLimitReached, setPlanLimitReached] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [stockError, setStockError] = useState<string | null>(null)
  const [lowStockThresholdError, setLowStockThresholdError] = useState<string | null>(null)

  const [form, setForm] = useState(() => {
    if (initialData) {
      const p = initialData.product
      return {
        name: p.name,
        description: p.description ?? '',
        categoryId: p.category_id ? String(p.category_id) : '',
        provinceId: p.province_id ? String(p.province_id) : '',
        price: (p.price_rdp / 100).toString(),
        comparePrice: p.compare_rdp !== null ? (p.compare_rdp / 100).toString() : '',
        stock: String(p.stock),
        lowStockThreshold: p.low_stock_threshold != null ? String(p.low_stock_threshold) : '',
        sku: p.sku ?? '',
        barcode: p.barcode ?? '',
        warranty: p.warranty ?? '',
        weightKg: p.weight_kg != null ? String(p.weight_kg) : '',
        lengthCm: p.length_cm != null ? String(p.length_cm) : '',
        widthCm: p.width_cm != null ? String(p.width_cm) : '',
        heightCm: p.height_cm != null ? String(p.height_cm) : '',
      }
    }
    return {
      name: '', description: '', categoryId: '', provinceId: '', price: '', comparePrice: '',
      stock: '', lowStockThreshold: '', sku: '', barcode: '', warranty: '',
      weightKg: '', lengthCm: '', widthCm: '', heightCm: '',
    }
  })

  // ─── Categoría → Subcategoría → ... (cascada RECURSIVA sobre el
  // mismo `categories` plano de siempre, usando parent_id) —
  // form.categoryId sigue siendo el id final (hoja, sin hijos propios)
  // que ya consume todo el resto del formulario (atributos dinámicos,
  // guardado); esto solo controla CÓMO se llega a ese valor. No asume
  // ninguna profundidad fija: sigue agregando un <select> más mientras
  // la categoría elegida en el último nivel tenga hijos reales -- hoy
  // hay categorías de 2 niveles (la mayoría) y de 3 (Smartphones,
  // Gorras), y esto sigue funcionando igual si mañana hay una de 4.
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>([])

  const [customWarranty, setCustomWarranty] = useState(() => {
    const w = initialData?.product.warranty
    return !!w && !WARRANTY_PRESETS.includes(w)
  })

  const [variantRows, setVariantRows] = useState<VariantRow[]>(() => {
    if (!initialData?.variants?.length) {
      return [{ size: '', color: '', stock: '', price: '', imageUrl: null }]
    }
    return initialData.variants.map(v => ({
      size: v.size ?? '',
      color: v.color ?? '',
      stock: String(v.stock),
      price: v.price_rdp !== null ? (v.price_rdp / 100).toString() : '',
      imageUrl: v.image_url,
    }))
  })
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null)
  const [variantImageError, setVariantImageError] = useState<string | null>(null)

  // Filas cuya "Talla" es libre (seleccionaron "Otra" o traían un valor
  // existente que no coincide con ningún preset, ej. "128GB")
  const [customSizeIndexes, setCustomSizeIndexes] = useState<Set<number>>(() => {
    const initial = new Set<number>()
    variantRows.forEach((row, i) => {
      if (row.size && !PRESET_SIZES.includes(row.size)) initial.add(i)
    })
    return initial
  })

  const addVariantRow = () => {
    setVariantRows(prev => [...prev, { size: '', color: '', stock: '', price: '', imageUrl: null }])
  }

  // ─── Generar combinaciones (Talla × Color) — solo para el sistema
  // fijo (sin variantCategoryAttributes); reemplaza las filas actuales
  // por el producto cartesiano de las tallas marcadas y los colores
  // escritos. El vendor sigue pudiendo agregar/editar/quitar filas
  // sueltas después con los controles de siempre — esto es un atajo
  // para armar la tabla inicial, no un sistema aparte.
  const [autoGenSizes, setAutoGenSizes] = useState<string[]>([])
  const [autoGenColorsText, setAutoGenColorsText] = useState('')

  const toggleAutoGenSize = (size: string) => {
    setAutoGenSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])
  }

  const generateVariantCombinations = () => {
    const colors = autoGenColorsText.split(',').map(c => c.trim()).filter(Boolean)
    if (autoGenSizes.length === 0 && colors.length === 0) return

    const sizeList = autoGenSizes.length > 0 ? autoGenSizes : ['']
    const colorList = colors.length > 0 ? colors : ['']
    const rows: VariantRow[] = []
    for (const size of sizeList) {
      for (const color of colorList) {
        rows.push({ size, color, stock: '', price: '', imageUrl: null })
      }
    }

    setVariantRows(rows)
    setCustomSizeIndexes(new Set(
      rows.map((r, i) => (r.size && !PRESET_SIZES.includes(r.size) ? i : -1)).filter(i => i >= 0)
    ))
  }

  const updateVariantRow = (index: number, field: keyof Omit<VariantRow, 'imageUrl'>, value: string) => {
    setVariantRows(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const handleSizeSelectChange = (index: number, value: string) => {
    if (value === OTHER_SIZE) {
      setCustomSizeIndexes(prev => new Set(prev).add(index))
      updateVariantRow(index, 'size', '')
    } else {
      setCustomSizeIndexes(prev => {
        const next = new Set(prev)
        next.delete(index)
        return next
      })
      updateVariantRow(index, 'size', value)
    }
  }

  const removeVariantRow = (index: number) => {
    setVariantRows(prev => prev.filter((_, i) => i !== index))
    setCustomSizeIndexes(prev => {
      const next = new Set<number>()
      prev.forEach(i => {
        if (i < index) next.add(i)
        else if (i > index) next.add(i - 1)
      })
      return next
    })
  }

  // El vendor solo necesita subir la foto en UNA fila por color — al enviar
  // el formulario se propaga a las demás filas del mismo color (ver handleSubmit)
  const handleVariantImageSelect = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setVariantImageError(validationError)
      return
    }
    setVariantImageError(null)
    setUploadingVariantIndex(index)

    const { url, error: uploadError } = await uploadProductImage(file, vendorId)

    if (uploadError || !url) {
      console.error('[handleVariantImageSelect]', uploadError)
      setVariantImageError(t('imageUploadError'))
      setUploadingVariantIndex(null)
      return
    }

    setVariantRows(prev => prev.map((row, i) => (i === index ? { ...row, imageUrl: url } : row)))
    setUploadingVariantIndex(null)
  }

  const removeVariantImage = (index: number) => {
    setVariantRows(prev => prev.map((row, i) => (i === index ? { ...row, imageUrl: null } : row)))
  }

  // ─── Variantes dinámicas (categoría con applies_to_variant) ──────────
  const [dynamicVariantRows, setDynamicVariantRows] = useState<DynamicVariantRow[]>([
    { values: {}, stock: '', price: '', imageUrl: null },
  ])
  const [uploadingDynamicVariantIndex, setUploadingDynamicVariantIndex] = useState<number | null>(null)

  // ─── Precios por cantidad en modo "crear" (sin product_id todavía) ──
  // Mismo patrón que dynamicVariantRows arriba: vive en memoria acá, se
  // inserta recién en handleSubmit cuando ya existe un product_id real.
  // En modo "editar" PricingTiersSection sigue manejando su propio
  // estado y pegando directo contra Supabase -- esto no se usa ahí.
  const [pendingPricingTiers, setPendingPricingTiers] = useState<TierRow[]>([])

  const addDynamicVariantRow = () => {
    setDynamicVariantRows(prev => [...prev, { values: {}, stock: '', price: '', imageUrl: null }])
  }

  const updateDynamicVariantValue = (index: number, attributeId: number, value: string) => {
    setDynamicVariantRows(prev =>
      prev.map((row, i) => (i === index ? { ...row, values: { ...row.values, [attributeId]: value } } : row))
    )
  }

  const updateDynamicVariantField = (index: number, field: 'stock' | 'price', value: string) => {
    setDynamicVariantRows(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const removeDynamicVariantRow = (index: number) => {
    setDynamicVariantRows(prev => prev.filter((_, i) => i !== index))
  }

  const handleDynamicVariantImageSelect = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setVariantImageError(validationError)
      return
    }
    setVariantImageError(null)
    setUploadingDynamicVariantIndex(index)

    const { url, error: uploadError } = await uploadProductImage(file, vendorId)

    if (uploadError || !url) {
      console.error('[handleDynamicVariantImageSelect]', uploadError)
      setVariantImageError(t('imageUploadError'))
      setUploadingDynamicVariantIndex(null)
      return
    }

    setDynamicVariantRows(prev => prev.map((row, i) => (i === index ? { ...row, imageUrl: url } : row)))
    setUploadingDynamicVariantIndex(null)
  }

  const removeDynamicVariantImage = (index: number) => {
    setDynamicVariantRows(prev => prev.map((row, i) => (i === index ? { ...row, imageUrl: null } : row)))
  }

  // Imágenes principales — existentes (modo editar) + nuevas (ambos modos)
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(initialData?.existingImages ?? [])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageWarning, setImageWarning] = useState<string | null>(null)

  const totalImageCount = existingImageUrls.length + imageFiles.length

  // Video principal — opcional, uno solo (no es una galería como images)
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(initialData?.product.video_url ?? null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)

  // Atributos dinámicos de la categoría seleccionada (tipo de producto) —
  // fixedCategoryAttributes son los que se muestran como campos normales
  // del producto; variantCategoryAttributes (applies_to_variant = true)
  // se usan más adelante como dimensiones de la tabla de variantes en vez
  // de Talla/Color fijos. Si la categoría no tiene ninguno, ambos quedan
  // vacíos y el formulario se comporta exactamente igual que antes.
  const [fixedCategoryAttributes, setFixedCategoryAttributes] = useState<CategoryAttribute[]>([])
  const [variantCategoryAttributes, setVariantCategoryAttributes] = useState<CategoryAttribute[]>([])
  const [attributeOptionsMap, setAttributeOptionsMap] = useState<Map<number, AttributeOption[]>>(new Map())
  const [attributeValues, setAttributeValues] = useState<AttributeValuesState>({})
  const [loadingAttributes, setLoadingAttributes] = useState(false)

  useEffect(() => {
    if (!form.categoryId) {
      setFixedCategoryAttributes([])
      setVariantCategoryAttributes([])
      setAttributeOptionsMap(new Map())
      setAttributeValues({})
      setDynamicVariantRows([{ values: {}, stock: '', price: '', imageUrl: null }])
      return
    }

    let active = true
    setLoadingAttributes(true)

    const categoryIdNum = parseInt(form.categoryId)
    // Precarga desde product_attribute_values/variant_attribute_values si
    // la categoría seleccionada sigue siendo la del producto original —
    // se recalcula en cada corrida del efecto (sin bandera de "una sola
    // vez") para que sea idempotente: no depende de qué tan tarde resuelva
    // el fetch, así no hay condición de carrera con el doble-render de
    // efectos de React 18 en desarrollo.
    const shouldPrefillFromExisting =
      mode === 'editar' &&
      !!initialData &&
      initialData.product.category_id === categoryIdNum

    supabase
      .from('category_attributes')
      .select('id, category_id, attribute_key, attribute_label, attribute_type, unit, is_required, is_recommended, applies_to_variant, sort_order')
      .eq('category_id', categoryIdNum)
      .order('sort_order')
      .then(async ({ data: attrs, error: attrsError }) => {
        if (!active) return

        if (attrsError) {
          console.error('[ProductForm categoryAttributes]', attrsError)
          setFixedCategoryAttributes([])
          setVariantCategoryAttributes([])
          setAttributeOptionsMap(new Map())
          setAttributeValues({})
          setDynamicVariantRows([{ values: {}, stock: '', price: '', imageUrl: null }])
          setLoadingAttributes(false)
          return
        }

        const allAttrs = (attrs ?? []) as CategoryAttribute[]
        setFixedCategoryAttributes(allAttrs.filter(a => !a.applies_to_variant))
        setVariantCategoryAttributes(allAttrs.filter(a => a.applies_to_variant))

        const selectLikeIds = allAttrs
          .filter(a => a.attribute_type === 'select' || a.attribute_type === 'multiselect')
          .map(a => a.id)

        if (selectLikeIds.length > 0) {
          const { data: options, error: optionsError } = await supabase
            .from('attribute_options')
            .select('id, category_attribute_id, value, label, sort_order, depends_on_attribute_key, depends_on_value')
            .in('category_attribute_id', selectLikeIds)
            .order('sort_order')

          if (!active) return

          if (optionsError) {
            console.error('[ProductForm attributeOptions]', optionsError)
            setAttributeOptionsMap(new Map())
          } else {
            const map = new Map<number, AttributeOption[]>()
            for (const opt of (options ?? []) as AttributeOption[]) {
              const list = map.get(opt.category_attribute_id) ?? []
              list.push(opt)
              map.set(opt.category_attribute_id, list)
            }
            setAttributeOptionsMap(map)
          }
        } else {
          setAttributeOptionsMap(new Map())
        }

        if (shouldPrefillFromExisting && initialData) {
          const { data: existingAttrValues } = await supabase
            .from('product_attribute_values')
            .select('category_attribute_id, value_text, value_number, value_boolean')
            .eq('product_id', initialData.product.id)

          if (!active) return

          const prefilledValues: AttributeValuesState = {}
          for (const v of existingAttrValues ?? []) {
            const attr = allAttrs.find(a => a.id === v.category_attribute_id)
            if (!attr) continue
            if (attr.attribute_type === 'boolean') prefilledValues[attr.id] = !!v.value_boolean
            else if (attr.attribute_type === 'multiselect') prefilledValues[attr.id] = v.value_text ? v.value_text.split(',') : []
            else if (attr.attribute_type === 'number') prefilledValues[attr.id] = v.value_number != null ? String(v.value_number) : ''
            else prefilledValues[attr.id] = v.value_text ?? ''
          }
          setAttributeValues(prefilledValues)

          const variantAttrIds = allAttrs.filter(a => a.applies_to_variant).map(a => a.id)
          if (variantAttrIds.length > 0 && initialData.variants.length > 0) {
            const variantIds = initialData.variants.map(v => v.id)
            const { data: existingVariantAttrValues } = await supabase
              .from('variant_attribute_values')
              .select('variant_id, category_attribute_id, value_text')
              .in('variant_id', variantIds)

            if (!active) return

            const byVariant = new Map<string, Record<number, string>>()
            for (const v of existingVariantAttrValues ?? []) {
              const bucket = byVariant.get(v.variant_id) ?? {}
              bucket[v.category_attribute_id] = v.value_text ?? ''
              byVariant.set(v.variant_id, bucket)
            }

            const prefilledDynamicRows: DynamicVariantRow[] = initialData.variants.map(v => ({
              values: byVariant.get(v.id) ?? {},
              stock: String(v.stock),
              price: v.price_rdp !== null ? (v.price_rdp / 100).toString() : '',
              imageUrl: v.image_url,
            }))

            setDynamicVariantRows(
              prefilledDynamicRows.length > 0
                ? prefilledDynamicRows
                : [{ values: {}, stock: '', price: '', imageUrl: null }]
            )
          }
        } else {
          setAttributeValues({})
          setDynamicVariantRows([{ values: {}, stock: '', price: '', imageUrl: null }])
        }

        setLoadingAttributes(false)
      })

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.categoryId])

  const handleAttributeChange = (attributeId: number, value: AttributeValue) => {
    setAttributeValues(prev => ({ ...prev, [attributeId]: value }))
  }

  // Arma las filas de product_attribute_values a partir de attributeValues —
  // multiselect se guarda como value_text separado por comas (mismo formato
  // que se lee de vuelta en el prefill de arriba).
  const buildAttributeValueRows = (productId: string) => {
    const rows: { product_id: string; category_attribute_id: number; value_text: string | null; value_number: number | null; value_boolean: boolean | null }[] = []

    for (const attr of fixedCategoryAttributes) {
      const v = attributeValues[attr.id]
      if (v === undefined) continue

      if (attr.attribute_type === 'boolean') {
        rows.push({ product_id: productId, category_attribute_id: attr.id, value_text: null, value_number: null, value_boolean: v as boolean })
        continue
      }

      if (attr.attribute_type === 'multiselect') {
        const arr = Array.isArray(v) ? v : []
        if (arr.length === 0) continue
        rows.push({ product_id: productId, category_attribute_id: attr.id, value_text: arr.join(','), value_number: null, value_boolean: null })
        continue
      }

      const strVal = typeof v === 'string' ? v.trim() : ''
      if (!strVal) continue

      if (attr.attribute_type === 'number') {
        const num = parseFloat(strVal)
        if (isNaN(num)) continue
        rows.push({ product_id: productId, category_attribute_id: attr.id, value_text: null, value_number: num, value_boolean: null })
        continue
      }

      rows.push({ product_id: productId, category_attribute_id: attr.id, value_text: strVal, value_number: null, value_boolean: null })
    }

    return rows
  }

  // Calidad de publicación en vivo — misma fórmula que la lista
  // (lib/productQuality.ts), aplicada al estado actual del formulario en
  // vez de a filas ya guardadas en la BD.
  const requiredAttrs = fixedCategoryAttributes.filter(a => a.is_required)
  const recommendedAttrs = fixedCategoryAttributes.filter(a => !a.is_required && a.is_recommended)
  const isAttrFilled = (attr: CategoryAttribute) => {
    const v = attributeValues[attr.id]
    if (attr.attribute_type === 'boolean') return v !== undefined
    if (attr.attribute_type === 'multiselect') return Array.isArray(v) && v.length > 0
    return typeof v === 'string' && v.trim() !== ''
  }
  const qualityPercent = computePublishQuality({
    totalRequired: requiredAttrs.length,
    filledRequired: requiredAttrs.filter(isAttrFilled).length,
    totalRecommended: recommendedAttrs.length,
    filledRecommended: recommendedAttrs.filter(isAttrFilled).length,
    hasPhoto: totalImageCount > 0,
    hasDescription: form.description.trim() !== '',
    hasName: form.name.trim() !== '',
    hasCategory: form.categoryId !== '',
    hasPrice: form.price.trim() !== '' && parseFloat(form.price) > 0,
    hasStock: form.stock.trim() !== '',
  })

  // ─── Vista previa (sin guardar) ───────────────────────────────────────
  const [showPreview, setShowPreview] = useState(false)
  const [previewVendor, setPreviewVendor] = useState<{
    id: string; business_name: string; is_verified: boolean
    whatsapp?: string; rating_avg?: number; total_sales?: number
  } | null>(null)
  const [loadingPreviewVendor, setLoadingPreviewVendor] = useState(false)

  // Servicios de envío/entrega que el vendor ya declaró a nivel tienda
  // (vendor_services) — de solo lectura en el paso "Envío", ver fetch
  // en el useEffect de categorías/provincias/vendor más abajo.
  const [vendorShippingServices, setVendorShippingServices] = useState<VendorService[]>([])

  const canPreview = mode === 'editar' && initialData?.product.status === 'draft'

  const handleOpenPreview = async () => {
    if (!previewVendor) {
      setLoadingPreviewVendor(true)
      const { data } = await supabase
        .from('vendors')
        .select('id, business_name, is_verified, whatsapp, rating_avg, total_sales')
        .eq('id', vendorId)
        .single()
      setLoadingPreviewVendor(false)
      if (data) setPreviewVendor(data)
    }
    setShowPreview(true)
  }

  const buildPreviewData = () => {
    const selectedCategory = categories.find(c => String(c.id) === form.categoryId)
    const selectedProvince = provinces.find(p => String(p.id) === form.provinceId)
    const previewImages = [...existingImageUrls, ...imagePreviews]
    const priceRdp = form.price ? Math.round(parseFloat(form.price) * 100) : 0
    const compareRdp = form.comparePrice ? Math.round(parseFloat(form.comparePrice) * 100) : null
    const previewProductId = initialData?.product.id ?? 'preview'

    const previewProduct = {
      id: previewProductId,
      vendor_id: vendorId,
      category_id: form.categoryId ? parseInt(form.categoryId) : null,
      province_id: form.provinceId ? parseInt(form.provinceId) : null,
      name: form.name || t('previewUntitledProduct'),
      description: form.description || null,
      price_rdp: priceRdp,
      compare_rdp: compareRdp,
      images: previewImages,
      stock: form.stock ? parseInt(form.stock) : 0,
      sizes: [],
      colors: [],
      video_url: videoPreviewUrl ?? existingVideoUrl,
      sku: form.sku || null,
      barcode: form.barcode || null,
      status: initialData?.product.status ?? 'draft',
      is_active: false,
      rating_avg: 0,
      rating_count: 0,
      sold_count: 0,
      view_count: 0,
      created_at: initialData?.product.created_at ?? new Date().toISOString(),
      category: selectedCategory ? { slug: selectedCategory.slug, emoji: selectedCategory.emoji, name: selectedCategory.name } : null,
      province: selectedProvince ? { name: selectedProvince.name } : null,
    }

    const previewVariants = variantCategoryAttributes.length > 0
      ? dynamicVariantRows
          .filter(row => Object.values(row.values).some(v => v && v.trim()))
          .map((row, i) => ({
            id: `preview-dynamic-${i}`,
            product_id: previewProductId,
            size: null,
            color: null,
            stock: row.stock ? parseInt(row.stock) : 0,
            price_rdp: row.price ? Math.round(parseFloat(row.price) * 100) : null,
            sku: null,
            image_url: row.imageUrl,
            is_active: true,
            created_at: new Date().toISOString(),
          }))
      : variantRows
          .filter(row => row.size.trim() || row.color.trim())
          .map((row, i) => ({
            id: `preview-fixed-${i}`,
            product_id: previewProductId,
            size: row.size.trim() || null,
            color: row.color.trim() || null,
            stock: row.stock ? parseInt(row.stock) : 0,
            price_rdp: row.price ? Math.round(parseFloat(row.price) * 100) : null,
            sku: null,
            image_url: row.imageUrl,
            is_active: true,
            created_at: new Date().toISOString(),
          }))

    return { previewProduct, previewVariants }
  }

  // Cargar categorías, provincias y datos del vendor (para la vista
  // previa, ver más abajo) al montar. El vendor se carga de una vez acá
  // -- ya no bajo demanda como antes -- porque ahora la vista previa
  // (mini tarjeta del costado + paso "Vista previa") es un panel
  // siempre visible, no algo que se abre ocasionalmente con un botón.
  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('id, name, name_en, name_fr, emoji, slug, parent_id').order('sort_order'),
      supabase.from('provinces_rd').select('id, name').order('name'),
      supabase.from('vendors').select('id, business_name, is_verified, whatsapp, rating_avg, total_sales').eq('id', vendorId).single(),
      // Servicios de envío/entrega ya declarados por el vendor (nivel
      // tienda, vendor_services) -- se muestran de solo lectura en el
      // paso "Envío"; no hay (ni se inventa) un campo por producto para
      // esto, ver comentario en ese paso.
      supabase.from('vendor_services').select('service').eq('vendor_id', vendorId).in('service', ['national_shipping', 'delivery', 'pickup']),
    ]).then(([{ data: cats }, { data: provs }, { data: vendorRow }, { data: shippingServices }]) => {
      setCategories(cats ?? [])
      setProvinces(provs ?? [])
      if (vendorRow) setPreviewVendor(vendorRow)
      setVendorShippingServices((shippingServices ?? []).map(s => s.service))
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Deriva el path completo (raíz → ... → hoja) a partir del
  // category_id (hoja) que ya trae el producto en editar — camina
  // hacia ARRIBA por parent_id las veces que haga falta (nunca un
  // número fijo de saltos), solo una vez, apenas cargan las
  // categorías (no se puede antes: hace falta el árbol completo para
  // resolver los padres reales de esa hoja).
  useEffect(() => {
    if (selectedCategoryPath.length > 0 || categories.length === 0 || !form.categoryId) return
    const byId = new Map(categories.map(c => [c.id, c]))
    const path: string[] = []
    let current = byId.get(Number(form.categoryId))
    while (current) {
      path.unshift(String(current.id))
      current = current.parent_id != null ? byId.get(current.parent_id) : undefined
    }
    if (path.length > 0) setSelectedCategoryPath(path)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories])

  // Categorías agrupadas por su padre (null = nivel raíz) -- una sola
  // estructura sirve para CUALQUIER nivel de profundidad, a diferencia
  // de un Map<number, Category[]> que solo servía para "hijos directos
  // de un top-level".
  const categoriesByParent = new Map<number | null, Category[]>()
  for (const c of categories) {
    const list = categoriesByParent.get(c.parent_id) ?? []
    list.push(c)
    categoriesByParent.set(c.parent_id, list)
  }

  // Arma la lista de <select> a renderizar: empieza en la raíz (parent
  // null) y agrega un nivel más mientras la categoría elegida en el
  // nivel anterior tenga hijos reales -- se detiene sola apenas llega
  // a una hoja (sin hijos) o a un nivel todavía sin elegir. Ningún
  // número de niveles hardcodeado.
  const categoryLevels: { options: Category[]; value: string }[] = []
  {
    let parentId: number | null = null
    let levelIndex = 0
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const options = categoriesByParent.get(parentId) ?? []
      if (options.length === 0) break
      const value = selectedCategoryPath[levelIndex] ?? ''
      categoryLevels.push({ options, value })
      if (!value) break
      parentId = Number(value)
      levelIndex++
    }
  }

  // Elegir un nivel trunca cualquier selección más profunda que ya
  // hubiera (cambiar la categoría de arriba invalida lo elegido
  // debajo) y fija form.categoryId de una vez SOLO si la categoría
  // recién elegida no tiene hijos propios -- ahí es una hoja real. Si
  // tiene hijos, categoryId queda vacío hasta llegar a la hoja
  // (el motor de atributos dinámicos, más abajo, es hoja-específico).
  const handleCategoryLevelChange = (levelIndex: number, value: string) => {
    setSelectedCategoryPath(prev => [...prev.slice(0, levelIndex), value])
    const children = value ? categoriesByParent.get(Number(value)) ?? [] : []
    setForm(f => ({ ...f, categoryId: (value && children.length === 0) ? value : '' }))
  }

  const handleWarrantySelectChange = (value: string) => {
    if (value === WARRANTY_OTHER) {
      setCustomWarranty(true)
      setForm(f => ({ ...f, warranty: '' }))
    } else {
      setCustomWarranty(false)
      setForm(f => ({ ...f, warranty: value }))
    }
  }

  // Libera el object URL del preview de video al desmontar o al reemplazarlo
  // — a diferencia de las fotos (FileReader → data URL), un video puede
  // pesar hasta 50MB y no conviene mantenerlo en memoria como base64.
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    }
  }, [videoPreviewUrl])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - totalImageCount)
    if (files.length === 0) return

    setImageError(null)
    setImageWarning(null)

    const validFiles: File[] = []

    for (const file of files) {
      const typeOrSizeError = validateImageFile(file)
      if (typeOrSizeError) {
        setImageError(typeOrSizeError)
        continue
      }
      validFiles.push(file)

      try {
        const { width, height } = await getImageDimensions(file)
        if (width < MIN_PRODUCT_IMAGE_DIMENSION || height < MIN_PRODUCT_IMAGE_DIMENSION) {
          setImageWarning(LOW_RESOLUTION_WARNING)
        }
      } catch {
        // si no se pueden leer las dimensiones, no bloqueamos la imagen
      }
    }

    if (validFiles.length === 0) return

    setImageFiles(prev => [...prev, ...validFiles])

    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImagePreviews(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // URLs de fotos ya existentes que el vendor quitó en esta sesión de edición
  // — el archivo real en Storage solo se borra si el guardado se confirma
  // (ver handleSubmit); si el vendor navega fuera sin guardar, esta lista se
  // descarta con el resto del estado del formulario y el archivo no se toca.
  // Es un ref, no un state, porque no necesita provocar un re-render — la UI
  // ya refleja el "quitar" al instante a través de existingImageUrls.
  const removedExistingImagesRef = useRef<string[]>([])

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => {
      const removed = prev[index]
      if (removed) removedExistingImagesRef.current.push(removed)
      return prev.filter((_, i) => i !== index)
    })
  }

  // "Reemplazar" es simplemente quitar + subir uno nuevo (mismo patrón que
  // las fotos, que tampoco tienen un botón de reemplazo dedicado)
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const validationError = validateProductVideoFile(file)
    if (validationError) {
      setVideoError(validationError)
      return
    }

    setVideoError(null)
    setVideoFile(file)
    setVideoPreviewUrl(URL.createObjectURL(file))
    setExistingVideoUrl(null)
  }

  const removeVideo = () => {
    setVideoFile(null)
    setVideoPreviewUrl(null)
    setExistingVideoUrl(null)
  }

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = []

    for (const file of imageFiles) {
      const { url, error: uploadError } = await uploadProductImage(file, vendorId)
      if (uploadError || !url) {
        console.error('[uploadImages]', uploadError)
        continue
      }
      urls.push(url)
    }

    return urls
  }

  // Best-effort igual que uploadImages() — si falla la subida, se guarda el
  // producto sin video en vez de bloquear todo el guardado por esto
  const uploadVideo = async (): Promise<string | null> => {
    if (!videoFile) return existingVideoUrl

    const { url, error: uploadError } = await uploadProductVideo(videoFile, vendorId)
    if (uploadError || !url) {
      console.error('[uploadVideo]', uploadError)
      setVideoError(t('videoUploadError'))
      return existingVideoUrl
    }
    return url
  }

  // targetStatus solo importa en modo crear -- en editar, "Guardar
  // cambios" nunca toca status (eso sigue siendo el trabajo aparte de
  // handlePublish, sin cambios). Firma de evento genérica porque el
  // botón "Publicar producto" en crear no es un submit real (type=
  // "button"), así que dispara esto desde un click, no un submit.
  const handleSubmit = async (e: { preventDefault: () => void }, targetStatus: 'draft' | 'published' = 'draft') => {
    e.preventDefault()
    setError(null)
    setPlanLimitReached(false)
    setNameError(null)
    setDescriptionError(null)
    setPriceError(null)
    setStockError(null)
    setLowStockThresholdError(null)

    if (!form.name || !form.price || !form.categoryId) {
      setError(t('fillRequiredFields'))
      return
    }

    // Mismo mínimo que enforce_minimum_product_photos() en la BD --
    // chequeo instantáneo en el cliente antes de intentar guardar; el
    // trigger sigue siendo la fuente de verdad real (ver catch abajo,
    // que ya muestra el mensaje textual si este chequeo se saltara algo).
    if (mode !== 'editar' && targetStatus === 'published' && totalImageCount < 4) {
      setError(t('publishNeedsPhotosError', { count: totalImageCount }))
      return
    }

    const missingRequiredAttribute = fixedCategoryAttributes.find(attr => {
      if (!attr.is_required) return false
      const v = attributeValues[attr.id]
      if (attr.attribute_type === 'boolean') return v === undefined
      if (attr.attribute_type === 'multiselect') return !Array.isArray(v) || v.length === 0
      return typeof v !== 'string' || v.trim() === ''
    })
    if (missingRequiredAttribute) {
      setError(t('requiredAttributesMissing'))
      return
    }

    // Misma lógica que lib/validation.ts validateText() (longitud +
    // DANGEROUS_PATTERN), pero con el mensaje traducido — validateText
    // arma el string completo en español y lo comparten otros
    // componentes fuera del alcance de este namespace, así que no se toca.
    const nameTrimmed = form.name.trim()
    if (nameTrimmed.length < 3 || nameTrimmed.length > 100) {
      setNameError(t('nameLengthError', { min: 3, max: 100 }))
      return
    }
    if (DANGEROUS_PATTERN.test(nameTrimmed)) {
      setNameError(t('nameInvalidChars'))
      return
    }

    if (form.description.trim().length > 0) {
      const descriptionTrimmed = form.description.trim()
      if (descriptionTrimmed.length < 10 || descriptionTrimmed.length > 1000) {
        setDescriptionError(t('descriptionLengthError', { min: 10, max: 1000 }))
        return
      }
      if (DANGEROUS_PATTERN.test(descriptionTrimmed)) {
        setDescriptionError(t('descriptionInvalidChars'))
        return
      }
    }

    const priceNum = parseFloat(form.price)
    if (isNaN(priceNum) || priceNum <= 0) {
      setError(t('invalidPriceError'))
      return
    }

    const priceCents = Math.round(priceNum * 100) // pesos → centavos
    // validatePrice() solo se usa aquí — replicamos su único chequeo
    // alcanzable en este punto (los demás ya quedaron cubiertos arriba)
    // con el mensaje traducido, en vez de tocar la función compartida.
    if (priceCents > 99999999) {
      setPriceError(t('priceTooLargeError'))
      return
    }

    const stockNum = form.stock ? parseInt(form.stock) : 0
    if (isNaN(stockNum) || stockNum < 0 || stockNum > 9999) {
      setStockError(t('stockRangeError'))
      return
    }

    // Vacío = sin alerta configurada (null) — no requerido, a diferencia
    // de stock. Si el vendor sí escribe algo, debe ser un entero >= 0.
    let lowStockThresholdNum: number | null = null
    if (form.lowStockThreshold.trim() !== '') {
      lowStockThresholdNum = parseInt(form.lowStockThreshold)
      if (isNaN(lowStockThresholdNum) || lowStockThresholdNum < 0 || lowStockThresholdNum > 9999) {
        setLowStockThresholdError(t('lowStockThresholdError'))
        return
      }
    }

    setSaving(true)

    try {
      const uploadedUrls = await uploadImages()
      const finalImages = [...existingImageUrls, ...uploadedUrls]
      const finalVideoUrl = await uploadVideo()

      const productPayload = {
        vendor_id: vendorId,
        category_id: parseInt(form.categoryId),
        province_id: form.provinceId ? parseInt(form.provinceId) : null,
        name: form.name,
        description: form.description || null,
        price_rdp: priceCents,
        compare_rdp: form.comparePrice ? Math.round(parseFloat(form.comparePrice) * 100) : null,
        stock: stockNum,
        low_stock_threshold: lowStockThresholdNum,
        images: finalImages,
        video_url: finalVideoUrl,
        sku: form.sku.trim() || null,
        barcode: form.barcode.trim() || null,
        warranty: form.warranty.trim() || null,
        weight_kg: form.weightKg.trim() ? parseFloat(form.weightKg) : null,
        length_cm: form.lengthCm.trim() ? parseFloat(form.lengthCm) : null,
        width_cm: form.widthCm.trim() ? parseFloat(form.widthCm) : null,
        height_cm: form.heightCm.trim() ? parseFloat(form.heightCm) : null,
      }

      let productId: string
      // Se pone en true solo si el producto (que a esta altura YA se
      // creó) queda sin sus tramos por un fallo en el insert masivo de
      // pendingPricingTiers -- no se reintenta como si nada (crearía un
      // borrador duplicado), se avisa en la lista sin bloquear la
      // navegación. Ver bloque más abajo y el redirect al final.
      let tiersSaveFailed = false

      if (mode === 'editar' && initialData) {
        productId = initialData.product.id
        const { error: updateError } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', productId)

        if (updateError) throw updateError
      } else {
        // is_active se calcula solo a partir de status (columna
        // generada), nunca se envía directamente. targetStatus viene
        // del botón que se usó ("Guardar borrador" vs "Publicar
        // producto") -- enforce_minimum_product_photos() en la BD
        // sigue validando el mínimo real de fotos si se intenta
        // publicar directo, sin importar el chequeo del cliente arriba.
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({ ...productPayload, status: targetStatus })
          .select('id')
          .single()

        if (insertError) throw insertError
        productId = newProduct.id

        // Tramos armados en memoria mientras no existía un product_id
        // real (ver pendingPricingTiers arriba) -- recién ahora se
        // insertan de verdad. Si esto falla, el producto YA se creó
        // (línea de arriba) -- no se lanza el error (eso haría creer al
        // catch de abajo que hay que reintentar todo, duplicando el
        // producto); solo se marca tiersSaveFailed para avisar en la
        // lista sin bloquear el resto del guardado.
        if (pendingPricingTiers.length > 0) {
          const { error: tiersError } = await supabase
            .from('product_pricing_tiers')
            .insert(pendingPricingTiers.map(({ id, ...tier }) => ({ product_id: productId, ...tier })))

          if (tiersError) {
            console.error('[handleSubmit] pendingPricingTiers insert', tiersError)
            tiersSaveFailed = true
          }
        }
      }

      // Recién ahora que el guardado fue exitoso se borran de Storage las
      // fotos que el vendor quitó — mismo patrón de extracción de path que
      // PromoBannerList.tsx (split por el nombre del bucket en la URL
      // pública), best-effort y no bloquea el resto del guardado si falla.
      for (const url of removedExistingImagesRef.current) {
        const path = url.split('/products/')[1]
        if (path) deleteImage('products', path)
      }
      removedExistingImagesRef.current = []

      // Atributos fijos de la categoría (product_attribute_values) — en
      // editar, reemplazar todas es seguro porque el product_id no cambia.
      if (mode === 'editar') {
        const { error: deleteAttrError } = await supabase
          .from('product_attribute_values')
          .delete()
          .eq('product_id', productId)

        if (deleteAttrError) console.error('[handleSubmit attribute values delete]', deleteAttrError)
      }

      const attributeValueRows = buildAttributeValueRows(productId)
      if (attributeValueRows.length > 0) {
        const { error: attrInsertError } = await supabase.from('product_attribute_values').insert(attributeValueRows)
        if (attrInsertError) console.error('[handleSubmit attribute values]', attrInsertError)
      }

      if (mode === 'editar') {
        // Reemplazar todas las variantes es seguro — variant_attribute_values
        // cuelga de variant_id y se limpia sola al borrar la variante (FK
        // en cascada hacia product_variants.id).
        const { error: deleteError } = await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', productId)

        if (deleteError) console.error('[handleSubmit variants delete]', deleteError)
      }

      if (variantCategoryAttributes.length > 0) {
        // Variantes dinámicas — se insertan una por una para poder asociar
        // el id real de cada fila con sus valores en variant_attribute_values.
        const rowsToSave = dynamicVariantRows.filter(row =>
          Object.values(row.values).some(v => v && v.trim())
        )

        const colorAttr = variantCategoryAttributes.find(a => a.attribute_key.toLowerCase() === 'color')
        const colorImageMap = new Map<string, string>()
        if (colorAttr) {
          for (const row of rowsToSave) {
            const colorVal = (row.values[colorAttr.id] ?? '').trim().toLowerCase()
            if (colorVal && row.imageUrl && !colorImageMap.has(colorVal)) {
              colorImageMap.set(colorVal, row.imageUrl)
            }
          }
        }

        const variantAttributeRows: { variant_id: string; category_attribute_id: number; value_text: string | null }[] = []

        for (const row of rowsToSave) {
          const colorVal = colorAttr ? (row.values[colorAttr.id] ?? '').trim().toLowerCase() : ''
          const imageUrl = row.imageUrl ?? (colorVal ? colorImageMap.get(colorVal) ?? null : null)

          const { data: insertedVariant, error: variantInsertError } = await supabase
            .from('product_variants')
            .insert({
              product_id: productId,
              size: null,
              color: null,
              stock: row.stock ? parseInt(row.stock) : 0,
              price_rdp: row.price ? Math.round(parseFloat(row.price) * 100) : null,
              image_url: imageUrl,
              is_active: true,
            })
            .select('id')
            .single()

          if (variantInsertError || !insertedVariant) {
            console.error('[handleSubmit dynamic variant]', variantInsertError)
            continue
          }

          for (const attr of variantCategoryAttributes) {
            const val = (row.values[attr.id] ?? '').trim()
            if (!val) continue
            variantAttributeRows.push({ variant_id: insertedVariant.id, category_attribute_id: attr.id, value_text: val })
          }
        }

        if (variantAttributeRows.length > 0) {
          const { error: variantAttrError } = await supabase.from('variant_attribute_values').insert(variantAttributeRows)
          if (variantAttrError) console.error('[handleSubmit variant attribute values]', variantAttrError)
        }
      } else {
        // Variantes fijas (Talla/Color) — comportamiento original sin cambios.
        // Propagar la imagen subida en la primera fila de cada color hacia las
        // demás filas del mismo color (case-insensitive) que no tengan imagen propia
        const colorImageMap = new Map<string, string>()
        for (const row of variantRows) {
          const colorKey = row.color.trim().toLowerCase()
          if (colorKey && row.imageUrl && !colorImageMap.has(colorKey)) {
            colorImageMap.set(colorKey, row.imageUrl)
          }
        }

        // Variantes (opcional) — filas sin talla ni color se descartan
        const variantsPayload = variantRows
          .filter(row => row.size.trim() || row.color.trim())
          .map(row => {
            const colorKey = row.color.trim().toLowerCase()
            const imageUrl = row.imageUrl ?? (colorKey ? colorImageMap.get(colorKey) ?? null : null)
            return {
              product_id: productId,
              size: row.size.trim() || null,
              color: row.color.trim() || null,
              stock: row.stock ? parseInt(row.stock) : 0,
              price_rdp: row.price ? Math.round(parseFloat(row.price) * 100) : null,
              image_url: imageUrl,
              is_active: true,
            }
          })

        if (variantsPayload.length > 0) {
          const { error: variantsError } = await supabase.from('product_variants').insert(variantsPayload)
          if (variantsError) console.error('[handleSubmit variants]', variantsError)
        }
      }

      router.push(tiersSaveFailed ? '/dashboard/productos?tiersWarning=1' : '/dashboard/productos')
      router.refresh()
    } catch (err: any) {
      console.error('[handleSubmit]', err)

      const message: string = err?.message ?? ''
      if (message.startsWith('PLAN_LIMIT_REACHED:')) {
        setError(message.replace('PLAN_LIMIT_REACHED:', '').trim())
        setPlanLimitReached(true)
      } else if (message.startsWith('Necesitas al menos')) {
        // Mensaje real de enforce_minimum_product_photos() en la BD —
        // el chequeo del cliente arriba ya cubre el caso común, esto es
        // por si igual llega a intentarse (ej. reintento tras subir menos
        // fotos de las que el cliente alcanzó a contar).
        setError(message)
      } else {
        setError(t('saveProductError'))
      }
      setSaving(false)
    }
  }

  // ─── Navegador de pasos — puramente de presentación, agrupa el mismo
  // form/handlers de siempre en secciones; ningún paso tiene su propio
  // estado ni validación aparte de la que ya existía. ────────────────
  type StepId = 'photos' | 'basic' | 'price' | 'tiers' | 'variants' | 'shipping' | 'additional' | 'preview'
  const STEPS: { id: StepId; label: string; subtitle: string }[] = [
    { id: 'photos', label: t('stepPhotosLabel'), subtitle: t('stepPhotosSubtitle') },
    { id: 'basic', label: t('stepBasicLabel'), subtitle: t('stepBasicSubtitle') },
    { id: 'price', label: t('stepPriceLabel'), subtitle: t('stepPriceSubtitle') },
    { id: 'tiers', label: t('stepTiersLabel'), subtitle: t('stepTiersSubtitle') },
    { id: 'variants', label: t('stepVariantsLabel'), subtitle: t('stepVariantsSubtitle') },
    { id: 'shipping', label: t('stepShippingLabel'), subtitle: t('stepShippingSubtitle') },
    { id: 'additional', label: t('stepAdditionalLabel'), subtitle: t('stepAdditionalSubtitle') },
    { id: 'preview', label: t('stepPreviewLabel'), subtitle: t('stepPreviewSubtitle') },
  ]
  const [activeStep, setActiveStep] = useState<StepId>('photos')
  const activeStepIndex = STEPS.findIndex(s => s.id === activeStep)
  const goToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length) return
    setActiveStep(STEPS[index].id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Publicar directamente (status: draft → published) — acción
  // independiente de "Guardar cambios", no reenvía el resto del
  // formulario. Advierte si la calidad de publicación es baja, pero no
  // bloquea: no todos los campos son obligatorios.
  const [publishing, setPublishing] = useState(false)

  const handlePublish = async () => {
    if (!initialData) return

    if (qualityPercent < 40) {
      const confirmed = window.confirm(t('lowQualityPublishConfirm', { percent: qualityPercent }))
      if (!confirmed) return
    }

    setPublishing(true)
    const { error: publishError } = await supabase
      .from('products')
      .update({ status: 'published' })
      .eq('id', initialData.product.id)
    setPublishing(false)

    if (publishError) {
      console.error('[handlePublish]', publishError)
      setError(t('publishError'))
      return
    }

    router.push('/dashboard/productos')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-gray-400 text-sm">{t('loadingForm')}</div>
        </div>
      </div>
    )
  }

  const inputCls = (hasError?: boolean) =>
    `w-full border rounded-lg px-4 py-2.5 text-sm outline-none ${hasError ? 'border-red-400' : 'border-gray-200'}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mismo Navbar real de todo el sitio (ya es azul --color-primary) —
          este formulario no tenía ningún header antes; no se crea un
          componente nuevo, se reusa el existente tal cual. */}
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 py-6 lg:py-8">

        {/* Header */}
        <div className="mb-6">
          <a
            href={mode === 'editar' ? '/dashboard/productos' : '/dashboard'}
            className="text-sm no-underline"
            style={{ color: BRAND.gray }}
          >
            {mode === 'editar' ? t('backToProductsLink') : t('backToDashboardLink')}
          </a>
          <h1 className="text-dash-title font-bold text-gray-900 mt-1">
            {mode === 'editar' ? t('editProductTitle') : t('newProductTitle')}
          </h1>
        </div>

        {showPreview && (() => {
          const { previewProduct, previewVariants } = buildPreviewData()
          return (
            <ProductPreviewModal
              product={previewProduct as any}
              vendor={previewVendor ?? undefined}
              variants={previewVariants as any}
              onClose={() => setShowPreview(false)}
            />
          )
        })()}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_320px] gap-6 items-start">

            {/* ─── Navegador de pasos — compacto, no debe pesar más
                que el propio formulario ────────────────────────── */}
            <nav className="hidden lg:flex flex-col gap-0.5 bg-white rounded-2xl border border-gray-100 p-2 lg:sticky lg:top-6">
              {STEPS.map((step, i) => {
                const isActive = step.id === activeStep
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(i)}
                    className="flex items-center gap-2 text-left rounded-lg px-2.5 py-2 border-none cursor-pointer transition-colors"
                    style={{ background: isActive ? BRAND.blue : 'transparent' }}
                  >
                    <span
                      className="flex-shrink-0 flex items-center justify-center rounded-full text-badge font-bold"
                      style={{
                        width: 18, height: 18,
                        background: isActive ? '#fff' : '#F3F4F6',
                        color: isActive ? BRAND.blue : BRAND.gray,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-small font-semibold leading-tight" style={{ color: isActive ? '#fff' : 'var(--color-blue-dark)' }}>
                        {step.label}
                      </span>
                      <span className="block text-badge leading-snug" style={{ color: isActive ? 'rgba(255,255,255,0.8)' : BRAND.gray }}>
                        {step.subtitle}
                      </span>
                    </span>
                  </button>
                )
              })}
            </nav>

            {/* Selector de paso compacto — mobile/tablet, sin el
                navegador vertical (no entra en pantallas angostas) */}
            <select
              value={activeStep}
              onChange={e => goToStep(STEPS.findIndex(s => s.id === e.target.value))}
              className="lg:hidden w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-semibold outline-none bg-white"
            >
              {STEPS.map((step, i) => (
                <option key={step.id} value={step.id}>{i + 1}. {step.label}</option>
              ))}
            </select>

            {/* ─── Contenido del paso activo ──────────────────── */}
            <div className="space-y-4 min-w-0">

          {activeStep === 'photos' && (
          <>
          {/* Imágenes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-form-label font-semibold mb-3" style={{ color: 'var(--color-blue-dark)' }}>{t('photosHeading')}</h2>
            <div className="flex flex-wrap gap-3 mb-3">
              {existingImageUrls.map((src, i) => (
                <div key={`existing-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              {imagePreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              {totalImageCount < 5 && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                  <span className="text-2xl text-gray-300">+</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-400">{t('photosHint')}</p>
            {imageError && <p className="text-small font-medium text-red-600 mt-2">{imageError}</p>}
            {imageWarning && <p className="text-xs text-amber-600 mt-2">{imageWarning}</p>}
          </div>

          {/* Video (opcional) — complementa la galería de fotos, no la reemplaza */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-form-label font-semibold mb-3" style={{ color: 'var(--color-blue-dark)' }}>{t('videoHeading')}</h2>
            <div className="mb-3">
              {(videoPreviewUrl || existingVideoUrl) ? (
                <div className="relative w-48 aspect-video rounded-lg overflow-hidden border border-gray-200 bg-black">
                  <video
                    src={videoPreviewUrl ?? existingVideoUrl ?? undefined}
                    controls
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeVideo}
                    aria-label={t('removeVideoAria')}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="w-48 aspect-video rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                  <span className="text-2xl text-gray-300">+</span>
                  <input type="file" accept="video/mp4,video/quicktime" onChange={handleVideoSelect} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-400">{t('videoHint')}</p>
            {videoError && <p className="text-small font-medium text-red-600 mt-2">{videoError}</p>}
          </div>
          </>
          )}

          {activeStep === 'basic' && (
          <>
          {/* Info básica */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-form-label font-semibold mb-1" style={{ color: 'var(--color-blue-dark)' }}>{t('basicInfoHeading')}</h2>

            <div>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t('productNamePlaceholder')}
                className={inputCls(!!nameError)}
              />
              {nameError && <p className="text-small font-medium text-red-600 mt-1">{nameError}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Un <select> por nivel real del árbol -- 2 para la
                  mayoría de las categorías, 3 para Smartphones/Gorras,
                  y se ajusta solo si en el futuro hay más niveles. */}
              {categoryLevels.map((level, levelIndex) => (
                <select
                  key={levelIndex}
                  value={level.value}
                  onChange={e => handleCategoryLevelChange(levelIndex, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="">{levelIndex === 0 ? t('selectTopCategoryPlaceholder') : t('selectSubcategoryPlaceholder')}</option>
                  {level.options.map(c => (
                    <option key={c.id} value={c.id}>
                      {levelIndex === 0 ? `${c.emoji} ${getCategoryName(c, language)}` : getCategoryName(c, language)}
                    </option>
                  ))}
                </select>
              ))}
            </div>

            <select
              name="provinceId"
              value={form.provinceId}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none bg-white"
            >
              <option value="">{t('originProvincePlaceholder')}</option>
              {provinces.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Atributos dinámicos de la categoría — solo aparece si el tipo
              de producto seleccionado tiene category_attributes definidos */}
          {loadingAttributes ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400">{t('loadingAttributes')}</p>
            </div>
          ) : fixedCategoryAttributes.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <ProductAttributesSection
                attributes={fixedCategoryAttributes}
                optionsMap={attributeOptionsMap}
                values={attributeValues}
                onChange={handleAttributeChange}
                mode={mode}
                productId={initialData?.product.id ?? null}
              />
            </div>
          )}
          </>
          )}

          {activeStep === 'price' && (
          <>
          {/* Precio y stock */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-form-label font-semibold mb-1" style={{ color: 'var(--color-blue-dark)' }}>{t('priceSaleHeading')}</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('priceLabel')}</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={inputCls(!!priceError)}
                />
                {priceError && <p className="text-small font-medium text-red-600 mt-1">{priceError}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('comparePriceLabel')}</label>
                <input
                  name="comparePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.comparePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-form-label font-semibold mb-1" style={{ color: 'var(--color-blue-dark)' }}>{t('inventoryHeading')}</h2>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('stockAvailableLabel')}</label>
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                placeholder="0"
                className={inputCls(!!stockError)}
              />
              {stockError && <p className="text-small font-medium text-red-600 mt-1">{stockError}</p>}
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('lowStockThresholdLabel')}</label>
              <input
                name="lowStockThreshold"
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={handleChange}
                placeholder={t('lowStockThresholdPlaceholder')}
                className={inputCls(!!lowStockThresholdError)}
              />
              {lowStockThresholdError && <p className="text-small font-medium text-red-600 mt-1">{lowStockThresholdError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('skuLabel')}</label>
                <input
                  name="sku"
                  type="text"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder={t('skuPlaceholder')}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('barcodeLabel')}</label>
                <input
                  name="barcode"
                  type="text"
                  value={form.barcode}
                  onChange={handleChange}
                  placeholder={t('barcodePlaceholder')}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          </div>
          </>
          )}

          {activeStep === 'tiers' && (
          /* Precios por cantidad — en editar pega directo contra
             Supabase con el product_id real; en crear vive en memoria
             (pendingPricingTiers) y se inserta en handleSubmit una vez
             que el producto existe. */
          mode === 'editar' ? (
            initialData && <PricingTiersSection mode="editar" productId={initialData.product.id} />
          ) : (
            <PricingTiersSection mode="crear" pendingTiers={pendingPricingTiers} onPendingTiersChange={setPendingPricingTiers} />
          )
          )}

          {activeStep === 'variants' && (
          <>
          {/* Generar combinaciones — solo tiene sentido en el sistema fijo
              (Talla/Color); con atributos dinámicos de variante, cada
              dimensión ya tiene su propio <select> por fila más abajo. */}
          {variantCategoryAttributes.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-blue-dark)' }}>{t('variantsGenerateHeading')}</h2>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">{t('variantsGenerateSizesLabel')}</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_SIZES.map(size => {
                    const isSelected = autoGenSizes.includes(size)
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleAutoGenSize(size)}
                        className="text-xs font-semibold rounded-lg px-3 py-1.5 border cursor-pointer transition-colors"
                        style={{
                          background: isSelected ? BRAND.blue : '#fff',
                          color: isSelected ? '#fff' : BRAND.dark,
                          borderColor: isSelected ? BRAND.blue : '#E5E7EB',
                        }}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('variantsGenerateColorsLabel')}</label>
                <input
                  value={autoGenColorsText}
                  onChange={e => setAutoGenColorsText(e.target.value)}
                  placeholder={t('variantsGenerateColorsPlaceholder')}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <button
                type="button"
                onClick={generateVariantCombinations}
                disabled={autoGenSizes.length === 0 && !autoGenColorsText.trim()}
                className="text-xs font-bold text-white rounded-lg px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: BRAND.blue, border: 'none', cursor: 'pointer' }}
              >
                {t('variantsGenerateButton')}
              </button>
            </div>
          )}

          {/* Variantes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-blue-dark)' }}>
                {variantCategoryAttributes.length === 0 ? t('variantsManualHeading') : t('variantsHeading')}
              </h2>
              <button
                type="button"
                onClick={variantCategoryAttributes.length > 0 ? addDynamicVariantRow : addVariantRow}
                style={{ color: BRAND.blue }}
                className="text-xs font-semibold bg-transparent border-none cursor-pointer"
              >
                {t('addVariantBtn')}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {t('variantsHint')}
            </p>

            {variantCategoryAttributes.length > 0 ? (
              // La categoría define atributos de variante (ej. Color +
              // Capacidad) — cada uno es una columna en vez de Talla/Color fijos.
              (() => {
                const dynamicColSpan = Math.max(2, Math.floor(6 / variantCategoryAttributes.length))
                const colorVariantAttr = variantCategoryAttributes.find(
                  a => a.attribute_key.toLowerCase() === 'color'
                )
                return dynamicVariantRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    {variantCategoryAttributes.map(attr => {
                      const value = row.values[attr.id] ?? ''
                      const options = attributeOptionsMap.get(attr.id) ?? []
                      const isColorAttr = colorVariantAttr?.id === attr.id

                      const fieldInput = attr.attribute_type === 'select' ? (
                        <select
                          value={value}
                          onChange={e => updateDynamicVariantValue(i, attr.id, e.target.value)}
                          className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
                        >
                          <option value="" disabled>{attr.attribute_label}</option>
                          {options.map(opt => (
                            <option key={opt.id} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={attr.attribute_type === 'number' ? 'number' : 'text'}
                          value={value}
                          onChange={e => updateDynamicVariantValue(i, attr.id, e.target.value)}
                          placeholder={attr.attribute_label}
                          className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                        />
                      )

                      return (
                        <div key={attr.id} style={{ gridColumn: `span ${dynamicColSpan}` }}>
                          {i === 0 && <label className="text-xs text-gray-500 mb-1 block">{attr.attribute_label}</label>}
                          {isColorAttr ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 min-w-0">{fieldInput}</div>
                              {row.imageUrl ? (
                                <div className="relative flex-shrink-0" style={{ width: 36, height: 36 }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={row.imageUrl}
                                    alt={value || attr.attribute_label}
                                    className="w-full h-full rounded-lg object-cover border border-gray-200"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeDynamicVariantImage(i)}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center leading-none"
                                    style={{ fontSize: 'var(--text-badge)' }}
                                    aria-label={t('removeImageAria')}
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <label
                                  className="flex-shrink-0 rounded-lg border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                                  style={{ width: 36, height: 36, fontSize: 'var(--text-ui)' }}
                                  title={t('uploadColorPhotoTitle')}
                                >
                                  {uploadingDynamicVariantIndex === i ? '…' : '📷'}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleDynamicVariantImageSelect(i, e)}
                                    className="hidden"
                                    disabled={uploadingDynamicVariantIndex === i}
                                  />
                                </label>
                              )}
                            </div>
                          ) : fieldInput}
                        </div>
                      )
                    })}
                    <div className="col-span-2">
                      {i === 0 && <label className="text-xs text-gray-500 mb-1 block">{t('variantStockLabel')}</label>}
                      <input
                        type="number"
                        min="0"
                        value={row.stock}
                        onChange={e => updateDynamicVariantField(i, 'stock', e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      {i === 0 && <label className="text-xs text-gray-500 mb-1 block">{t('variantPriceLabel')}</label>}
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.price}
                        onChange={e => updateDynamicVariantField(i, 'price', e.target.value)}
                        placeholder={t('variantPricePlaceholder')}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeDynamicVariantRow(i)}
                        className="w-full h-9 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              })()
            ) : (
              variantRows.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-3">
                    {i === 0 && <label className="text-xs text-gray-500 mb-1 block">{t('sizeLabel')}</label>}
                    <select
                      value={customSizeIndexes.has(i) ? OTHER_SIZE : (PRESET_SIZES.includes(row.size) ? row.size : '')}
                      onChange={e => handleSizeSelectChange(i, e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
                    >
                      <option value="" disabled>{t('sizeLabel')}</option>
                      {PRESET_SIZES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value={OTHER_SIZE}>{t('sizeOtherOption')}</option>
                    </select>
                    {customSizeIndexes.has(i) && (
                      <input
                        value={row.size}
                        onChange={e => updateVariantRow(i, 'size', e.target.value)}
                        placeholder={t('sizeOtherPlaceholder')}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none mt-1.5"
                        autoFocus
                      />
                    )}
                  </div>
                  <div className="col-span-3">
                    {i === 0 && <label className="text-xs text-gray-500 mb-1 block">{t('colorLabel')}</label>}
                    <div className="flex items-center gap-1.5">
                      <input
                        value={row.color}
                        onChange={e => updateVariantRow(i, 'color', e.target.value)}
                        placeholder={t('colorPlaceholder')}
                        className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                      />
                      {row.imageUrl ? (
                        <div className="relative flex-shrink-0" style={{ width: 36, height: 36 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={row.imageUrl}
                            alt={row.color || t('colorLabel')}
                            className="w-full h-full rounded-lg object-cover border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantImage(i)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center leading-none"
                            style={{ fontSize: 'var(--text-badge)' }}
                            aria-label={t('removeImageAria')}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label
                          className="flex-shrink-0 rounded-lg border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                          style={{ width: 36, height: 36, fontSize: 'var(--text-ui)' }}
                          title={t('uploadColorPhotoTitle')}
                        >
                          {uploadingVariantIndex === i ? '…' : '📷'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleVariantImageSelect(i, e)}
                            className="hidden"
                            disabled={uploadingVariantIndex === i}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    {i === 0 && <label className="text-xs text-gray-500 mb-1 block">{t('variantStockLabel')}</label>}
                    <input
                      type="number"
                      min="0"
                      value={row.stock}
                      onChange={e => updateVariantRow(i, 'stock', e.target.value)}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div className="col-span-3">
                    {i === 0 && <label className="text-xs text-gray-500 mb-1 block">{t('variantPriceLabel')}</label>}
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.price}
                      onChange={e => updateVariantRow(i, 'price', e.target.value)}
                      placeholder={t('variantPricePlaceholder')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeVariantRow(i)}
                      className="w-full h-9 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
            {variantImageError && <p className="text-small font-medium text-red-600">{variantImageError}</p>}
          </div>
          </>
          )}

          {activeStep === 'shipping' && (
          <>
          {/* Envío — informativo. El costo real ya se calcula por
              provincia de destino (mismo mecanismo que usa todo el
              sitio, ver ShippingEstimateLine/FreeShippingBadge); peso y
              dimensiones NO alimentan ese cálculo todavía, así que se
              guardan (migración 017) pero se dejan explícitamente
              marcados como referenciales, no como algo que cambie el
              envío hoy. */}
          <div className="rounded-2xl p-4" style={{ background: 'var(--color-primary-subtle)' }}>
            <p className="text-sm" style={{ color: BRAND.dark }}>🚚 {t('shippingRealMechanismNote')}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-form-label font-semibold mb-1" style={{ color: 'var(--color-blue-dark)' }}>{t('shippingWeightDimensionsHeading')}</h2>
            <p className="text-xs text-gray-400">{t('shippingWeightDimensionsDisclaimer')}</p>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('shippingWeightLabel')}</label>
              <input
                name="weightKg"
                type="number"
                step="0.01"
                min="0"
                value={form.weightKg}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none sm:w-1/2"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('shippingLengthLabel')}</label>
                <input
                  name="lengthCm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.lengthCm}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('shippingWidthLabel')}</label>
                <input
                  name="widthCm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.widthCm}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('shippingHeightLabel')}</label>
                <input
                  name="heightCm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.heightCm}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* Métodos de envío — no hay un campo por producto para esto
              (es una configuración de la tienda, vendor_services); se
              muestra en modo lectura lo que el vendor ya declaró ahí,
              en vez de inventar un selector por producto que no existe. */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-blue-dark)' }}>{t('shippingVendorServicesHeading')}</h2>
            {vendorShippingServices.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {vendorShippingServices.map(s => (
                  <span key={s} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--color-primary-subtle)', color: BRAND.blue }}>
                    {tv(`service.${s}`)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">{t('shippingNoVendorServicesHint')}</p>
            )}
          </div>
          </>
          )}

          {activeStep === 'additional' && (
          <>
          {/* Información adicional — descripción vive acá (no en
              Información básica), junto con garantía y devoluciones. */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h2 className="text-form-label font-semibold mb-1" style={{ color: 'var(--color-blue-dark)' }}>{t('stepAdditionalLabel')}</h2>
            <div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={t('descriptionPlaceholder')}
                rows={4}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none resize-none ${descriptionError ? 'border-red-400' : 'border-gray-200'}`}
              />
              {descriptionError && <p className="text-small font-medium text-red-600 mt-1">{descriptionError}</p>}
            </div>
          </div>

          {/* Garantía — texto libre del vendor, sin verificación del
              sistema (migración 017), mismo patrón "Otra" que Talla. */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-blue-dark)' }}>{t('warrantyLabel')}</h2>
            <select
              value={customWarranty ? WARRANTY_OTHER : (WARRANTY_PRESETS.includes(form.warranty) ? form.warranty : '')}
              onChange={e => handleWarrantySelectChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none bg-white"
            >
              <option value="" disabled>{t('warrantyLabel')}</option>
              {WARRANTY_PRESETS.map(w => (
                <option key={w} value={w}>{w === 'Sin garantía' ? t('warrantyNoneOption') : w}</option>
              ))}
              <option value={WARRANTY_OTHER}>{t('warrantyOtherOption')}</option>
            </select>
            {customWarranty && (
              <input
                value={form.warranty}
                onChange={e => setForm(f => ({ ...f, warranty: e.target.value }))}
                placeholder={t('warrantyOtherPlaceholder')}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                autoFocus
              />
            )}
          </div>

          {/* Política de devolución — regla real de TODA la plataforma
              (terminos/page.tsx §6), no configurable por producto; se
              muestra a modo informativo, no como un campo editable, para
              no inventar una configuración por producto que no existe. */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <h2 className="text-form-label font-semibold mb-1" style={{ color: 'var(--color-blue-dark)' }}>{t('returnPolicyHeading')}</h2>
            <p className="text-xs text-gray-500 mb-2">{t('returnPolicyText')}</p>
            <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold no-underline" style={{ color: BRAND.blue }}>
              {t('returnPolicyLink')}
            </a>
          </div>
          </>
          )}

          {activeStep === 'preview' && (() => {
            const { previewProduct, previewVariants } = buildPreviewData()
            return (
              <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
                <p className="text-xs text-gray-400 mb-4">👁️ {t('previewFullStepHint')}</p>
                <ProductPageContent
                  product={previewProduct as any}
                  vendor={previewVendor ?? undefined}
                  variants={previewVariants as any}
                  hasDiscount={!!(previewProduct.compare_rdp && previewProduct.compare_rdp > previewProduct.price_rdp)}
                  discount={previewProduct.compare_rdp && previewProduct.compare_rdp > previewProduct.price_rdp ? discountPercent(previewProduct.price_rdp, previewProduct.compare_rdp) : null}
                  itbis={Math.round(previewProduct.price_rdp * 0.18)}
                  totalConItbis={previewProduct.price_rdp + Math.round(previewProduct.price_rdp * 0.18)}
                />
              </div>
            )
          })()}

          {/* Navegación entre pasos — el guardado real (Guardar
              borrador / Publicar) vive abajo, siempre visible, no solo
              en el último paso, para que el vendor pueda guardar en
              cualquier momento sin tener que recorrer los 8 pasos. */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => goToStep(activeStepIndex - 1)}
              disabled={activeStepIndex === 0}
              className="text-sm font-semibold bg-transparent border-none cursor-pointer disabled:opacity-0 disabled:cursor-default"
              style={{ color: BRAND.gray }}
            >
              {t('stepBackButton')}
            </button>
            <button
              type="button"
              onClick={() => goToStep(activeStepIndex + 1)}
              disabled={activeStepIndex === STEPS.length - 1}
              className="text-sm font-semibold bg-transparent border-none cursor-pointer disabled:opacity-0 disabled:cursor-default"
              style={{ color: BRAND.blue }}
            >
              {t('stepNextButton')}
            </button>
          </div>

          {error && planLimitReached && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-small font-medium text-amber-800">
              <p className="mb-2">🔒 {error}</p>
              <a
                href="/dashboard/plan"
                className="inline-block font-semibold underline"
                style={{ color: BRAND.blue }}
              >
                {t('upgradeToProLink')}
              </a>
            </div>
          )}

          {error && !planLimitReached && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-small font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              style={{ background: saving ? '#ccc' : BRAND.blue }}
              className="flex-1 text-white font-medium py-3.5 rounded-xl transition-colors"
            >
              {mode === 'editar'
                ? (saving ? t('savingChanges') : t('saveChanges'))
                : (saving ? t('savingDraft') : t('saveDraftButton'))}
            </button>

            {mode === 'editar' ? (
              canPreview && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  style={{ background: publishing ? '#ccc' : BRAND.green }}
                  className="flex-1 text-white font-medium py-3.5 rounded-xl transition-colors"
                >
                  {publishing ? t('publishing') : t('publishProduct')}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={e => handleSubmit(e, 'published')}
                disabled={saving}
                style={{ background: saving ? '#ccc' : BRAND.green }}
                className="flex-1 text-white font-medium py-3.5 rounded-xl transition-colors"
              >
                {saving ? t('publishing') : t('publishProduct')}
              </button>
            )}
          </div>

            </div>

            {/* ─── Sidebar: calidad + vista previa + tips + confianza ── */}
            <aside className="space-y-4 lg:sticky lg:top-6">
              <QualitySidebarCard
                percent={qualityPercent}
                checks={[
                  { label: t('qualityCheckName'), done: form.name.trim() !== '' },
                  { label: t('qualityCheckPhotos'), done: totalImageCount > 0 },
                  { label: t('qualityCheckCategory'), done: form.categoryId !== '' },
                  { label: t('qualityCheckAttributes'), done: requiredAttrs.length === 0 || requiredAttrs.every(isAttrFilled) },
                  { label: t('qualityCheckPrice'), done: form.price.trim() !== '' && parseFloat(form.price) > 0 },
                  { label: t('qualityCheckStock'), done: form.stock.trim() !== '' },
                  { label: t('qualityCheckDescription'), done: form.description.trim() !== '' },
                ]}
                t={t}
              />

              <PreviewSidebarCard data={buildPreviewData()} t={t} />

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-form-label font-semibold text-gray-700 mb-2">💡 {t('tipsHeading')}</h3>
                <ul className="space-y-1.5">
                  {[t('tipPhotos'), t('tipCategory'), t('tipAttributes'), t('tipDescription')].map(tip => (
                    <li key={tip} className="flex items-center gap-2 text-xs text-gray-600">
                      <span style={{ color: BRAND.green }}>✓</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-form-label font-semibold text-gray-700 mb-2">🛡️ {tp('trustSecureTitle')}</h3>
                <ul className="space-y-1.5">
                  {[tp('trustSecureTitle'), tp('trustQualityTitle'), tp('trustShippingTitle'), tp('trustBuyersTitle')].map(txt => (
                    <li key={txt} className="flex items-center gap-2 text-xs text-gray-600">
                      <span style={{ color: BRAND.green }}>✓</span> {txt}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

          </div>
        </form>
      </div>
    </div>
  )
}
