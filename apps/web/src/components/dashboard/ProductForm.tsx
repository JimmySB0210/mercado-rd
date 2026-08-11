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

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateImageFile, getImageDimensions, uploadProductImage, MIN_PRODUCT_IMAGE_DIMENSION, LOW_RESOLUTION_WARNING } from '@/lib/storage/upload'
import { DANGEROUS_PATTERN } from '@/lib/validation'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { ProductAttributesSection, type AttributeValue, type AttributeValuesState } from '@/components/dashboard/ProductAttributesSection'
import { ProductPreviewModal } from '@/components/dashboard/ProductPreviewModal'
import { computePublishQuality, qualityTier, QUALITY_TIER_EMOJI, QUALITY_TIER_COLOR } from '@/lib/productQuality'
import { BRAND } from '@/lib/colors'
import type { Product, ProductVariant, CategoryAttribute, AttributeOption } from '@/types/database.types'

interface Category {
  id: number
  name: string
  emoji: string
  slug: string
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

export function ProductForm({ mode, vendorId, initialData }: ProductFormProps) {
  const { t } = useTranslation('dashboard')
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
      }
    }
    return { name: '', description: '', categoryId: '', provinceId: '', price: '', comparePrice: '', stock: '' }
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
            .select('id, category_attribute_id, value, label, sort_order')
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
  })

  // ─── Vista previa (sin guardar) ───────────────────────────────────────
  const [showPreview, setShowPreview] = useState(false)
  const [previewVendor, setPreviewVendor] = useState<{
    id: string; business_name: string; is_verified: boolean
    whatsapp?: string; rating_avg?: number; total_sales?: number
  } | null>(null)
  const [loadingPreviewVendor, setLoadingPreviewVendor] = useState(false)

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

  // Cargar categorías y provincias al montar
  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('id, name, emoji, slug').order('sort_order'),
      supabase.from('provinces_rd').select('id, name').order('name'),
    ]).then(([{ data: cats }, { data: provs }]) => {
      setCategories(cats ?? [])
      setProvinces(provs ?? [])
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPlanLimitReached(false)
    setNameError(null)
    setDescriptionError(null)
    setPriceError(null)
    setStockError(null)

    if (!form.name || !form.price || !form.categoryId) {
      setError(t('fillRequiredFields'))
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

    setSaving(true)

    try {
      const uploadedUrls = await uploadImages()
      const finalImages = [...existingImageUrls, ...uploadedUrls]

      const productPayload = {
        vendor_id: vendorId,
        category_id: parseInt(form.categoryId),
        province_id: form.provinceId ? parseInt(form.provinceId) : null,
        name: form.name,
        description: form.description || null,
        price_rdp: priceCents,
        compare_rdp: form.comparePrice ? Math.round(parseFloat(form.comparePrice) * 100) : null,
        stock: stockNum,
        images: finalImages,
      }

      let productId: string

      if (mode === 'editar' && initialData) {
        productId = initialData.product.id
        const { error: updateError } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', productId)

        if (updateError) throw updateError
      } else {
        // status: 'draft' por defecto — el flujo de borrador/preview/publicar
        // se conecta en un bloque aparte; is_active se calcula solo a partir
        // de status (columna generada), nunca se envía directamente.
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({ ...productPayload, status: 'draft' })
          .select('id')
          .single()

        if (insertError) throw insertError
        productId = newProduct.id
      }

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

      router.push('/dashboard/productos')
      router.refresh()
    } catch (err: any) {
      console.error('[handleSubmit]', err)

      const message: string = err?.message ?? ''
      if (message.startsWith('PLAN_LIMIT_REACHED:')) {
        setError(message.replace('PLAN_LIMIT_REACHED:', '').trim())
        setPlanLimitReached(true)
      } else {
        setError(t('saveProductError'))
      }
      setSaving(false)
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">{t('loadingForm')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <a
              href={mode === 'editar' ? '/dashboard/productos' : '/dashboard'}
              className="text-sm no-underline"
              style={{ color: BRAND.gray }}
            >
              {mode === 'editar' ? t('backToProductsLink') : t('backToDashboardLink')}
            </a>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              {mode === 'editar' ? t('editProductTitle') : t('newProductTitle')}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: QUALITY_TIER_COLOR[qualityTier(qualityPercent)].bg,
                color: QUALITY_TIER_COLOR[qualityTier(qualityPercent)].text,
                fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 10,
              }}
            >
              {QUALITY_TIER_EMOJI[qualityTier(qualityPercent)]} {t('publishQualityLabel', { percent: qualityPercent })}
            </span>
            {canPreview && (
              <button
                type="button"
                onClick={handleOpenPreview}
                disabled={loadingPreviewVendor}
                style={{
                  fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 10,
                  background: '#fff', border: `1px solid ${BRAND.blue}`, color: BRAND.blue,
                  cursor: loadingPreviewVendor ? 'not-allowed' : 'pointer',
                }}
              >
                {t('previewButton')}
              </button>
            )}
          </div>
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

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Imágenes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('photosHeading')}</h2>
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
            {imageError && <p className="text-xs text-red-600 mt-2">{imageError}</p>}
            {imageWarning && <p className="text-xs text-amber-600 mt-2">{imageWarning}</p>}
          </div>

          {/* Info básica */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">{t('basicInfoHeading')}</h2>

            <div>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t('productNamePlaceholder')}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none ${nameError ? 'border-red-400' : 'border-gray-200'}`}
              />
              {nameError && <p className="text-xs text-red-600 mt-1">{nameError}</p>}
            </div>

            <div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={t('descriptionPlaceholder')}
                rows={3}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none resize-none ${descriptionError ? 'border-red-400' : 'border-gray-200'}`}
              />
              {descriptionError && <p className="text-xs text-red-600 mt-1">{descriptionError}</p>}
            </div>

            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none bg-white"
            >
              <option value="">{t('selectCategoryPlaceholder')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>

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
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-xs text-gray-400">{t('loadingAttributes')}</p>
            </div>
          ) : fixedCategoryAttributes.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <ProductAttributesSection
                attributes={fixedCategoryAttributes}
                optionsMap={attributeOptionsMap}
                values={attributeValues}
                onChange={handleAttributeChange}
              />
            </div>
          )}

          {/* Precio y stock */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">{t('priceInventoryHeading')}</h2>

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
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none ${priceError ? 'border-red-400' : 'border-gray-200'}`}
                />
                {priceError && <p className="text-xs text-red-600 mt-1">{priceError}</p>}
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

            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t('stockAvailableLabel')}</label>
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                placeholder="0"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none ${stockError ? 'border-red-400' : 'border-gray-200'}`}
              />
              {stockError && <p className="text-xs text-red-600 mt-1">{stockError}</p>}
            </div>
          </div>

          {/* Variantes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-gray-700">{t('variantsHeading')}</h2>
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
                                    style={{ fontSize: 10 }}
                                    aria-label={t('removeImageAria')}
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <label
                                  className="flex-shrink-0 rounded-lg border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                                  style={{ width: 36, height: 36, fontSize: 14 }}
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
                            style={{ fontSize: 10 }}
                            aria-label={t('removeImageAria')}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label
                          className="flex-shrink-0 rounded-lg border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                          style={{ width: 36, height: 36, fontSize: 14 }}
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
            {variantImageError && <p className="text-xs text-red-600">{variantImageError}</p>}
          </div>

          {error && planLimitReached && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
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
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
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

            {canPreview && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                style={{ background: publishing ? '#ccc' : BRAND.green }}
                className="flex-1 text-white font-medium py-3.5 rounded-xl transition-colors"
              >
                {publishing ? t('publishing') : t('publishProduct')}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  )
}
