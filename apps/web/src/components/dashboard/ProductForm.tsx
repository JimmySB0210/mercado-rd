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
import { validateText, validatePrice } from '@/lib/validation'
import { BRAND } from '@/lib/colors'
import type { Product, ProductVariant } from '@/types/database.types'

interface Category {
  id: number
  name: string
  emoji: string
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

// "Talla" también se usa para variantes que no son ropa (ej. "128GB"
// en electrónicos) — de ahí la opción "Otra" con texto libre.
const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const OTHER_SIZE = '__otra__'

export function ProductForm({ mode, vendorId, initialData }: ProductFormProps) {
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
      setVariantImageError('No se pudo subir la imagen. Intenta de nuevo.')
      setUploadingVariantIndex(null)
      return
    }

    setVariantRows(prev => prev.map((row, i) => (i === index ? { ...row, imageUrl: url } : row)))
    setUploadingVariantIndex(null)
  }

  const removeVariantImage = (index: number) => {
    setVariantRows(prev => prev.map((row, i) => (i === index ? { ...row, imageUrl: null } : row)))
  }

  // Imágenes principales — existentes (modo editar) + nuevas (ambos modos)
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(initialData?.existingImages ?? [])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageWarning, setImageWarning] = useState<string | null>(null)

  const totalImageCount = existingImageUrls.length + imageFiles.length

  // Cargar categorías y provincias al montar
  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('id, name, emoji').order('sort_order'),
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
      setError('Completa al menos el nombre, precio y categoría')
      return
    }

    const nameErr = validateText(form.name, 'El nombre', 3, 100)
    if (nameErr) { setNameError(nameErr); return }

    if (form.description.trim().length > 0) {
      const descriptionErr = validateText(form.description, 'La descripción', 10, 1000)
      if (descriptionErr) { setDescriptionError(descriptionErr); return }
    }

    const priceNum = parseFloat(form.price)
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('El precio debe ser un número válido mayor a 0')
      return
    }

    const priceCents = Math.round(priceNum * 100) // pesos → centavos
    const priceErr = validatePrice(priceCents)
    if (priceErr) { setPriceError(priceErr); return }

    const stockNum = form.stock ? parseInt(form.stock) : 0
    if (isNaN(stockNum) || stockNum < 0 || stockNum > 9999) {
      setStockError('El stock debe estar entre 0 y 9999')
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
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({ ...productPayload, is_active: true })
          .select('id')
          .single()

        if (insertError) throw insertError
        productId = newProduct.id
      }

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

      if (mode === 'editar') {
        // Sin FK externa a product_variants — reemplazar todas es seguro
        const { error: deleteError } = await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', productId)

        if (deleteError) console.error('[handleSubmit variants delete]', deleteError)
      }

      if (variantsPayload.length > 0) {
        const { error: variantsError } = await supabase.from('product_variants').insert(variantsPayload)
        if (variantsError) console.error('[handleSubmit variants]', variantsError)
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
        setError('Ocurrió un error al guardar el producto. Intenta de nuevo.')
      }
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <a
              href={mode === 'editar' ? '/dashboard/productos' : '/dashboard'}
              className="text-sm no-underline"
              style={{ color: BRAND.gray }}
            >
              ← Volver {mode === 'editar' ? 'a mis productos' : 'al dashboard'}
            </a>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              {mode === 'editar' ? 'Editar producto' : 'Nuevo producto'}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Imágenes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Fotos del producto</h2>
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
            <p className="text-xs text-gray-400">Hasta 5 fotos. La primera será la principal.</p>
            {imageError && <p className="text-xs text-red-600 mt-2">{imageError}</p>}
            {imageWarning && <p className="text-xs text-amber-600 mt-2">{imageWarning}</p>}
          </div>

          {/* Info básica */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Información básica</h2>

            <div>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nombre del producto *"
                className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none ${nameError ? 'border-red-400' : 'border-gray-200'}`}
              />
              {nameError && <p className="text-xs text-red-600 mt-1">{nameError}</p>}
            </div>

            <div>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Descripción"
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
              <option value="">Selecciona categoría *</option>
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
              <option value="">Provincia de origen (opcional)</option>
              {provinces.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Precio y stock */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Precio e inventario</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Precio (RD$) *</label>
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
                <label className="text-xs text-gray-500 mb-1 block">Precio anterior (opcional)</label>
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
              <label className="text-xs text-gray-500 mb-1 block">Stock disponible</label>
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
              <h2 className="text-sm font-semibold text-gray-700">Variantes (opcional)</h2>
              <button
                type="button"
                onClick={addVariantRow}
                style={{ color: BRAND.blue }}
                className="text-xs font-semibold bg-transparent border-none cursor-pointer"
              >
                + Agregar variante
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Si no agregas ninguna, el producto usa el stock y precio generales de arriba.
            </p>

            {variantRows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  {i === 0 && <label className="text-xs text-gray-500 mb-1 block">Talla</label>}
                  <select
                    value={customSizeIndexes.has(i) ? OTHER_SIZE : (PRESET_SIZES.includes(row.size) ? row.size : '')}
                    onChange={e => handleSizeSelectChange(i, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="" disabled>Talla</option>
                    {PRESET_SIZES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value={OTHER_SIZE}>Otra (escribir)</option>
                  </select>
                  {customSizeIndexes.has(i) && (
                    <input
                      value={row.size}
                      onChange={e => updateVariantRow(i, 'size', e.target.value)}
                      placeholder="Ej. 128GB"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none mt-1.5"
                      autoFocus
                    />
                  )}
                </div>
                <div className="col-span-3">
                  {i === 0 && <label className="text-xs text-gray-500 mb-1 block">Color</label>}
                  <div className="flex items-center gap-1.5">
                    <input
                      value={row.color}
                      onChange={e => updateVariantRow(i, 'color', e.target.value)}
                      placeholder="Azul"
                      className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                    />
                    {row.imageUrl ? (
                      <div className="relative flex-shrink-0" style={{ width: 36, height: 36 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.imageUrl}
                          alt={row.color || 'Color'}
                          className="w-full h-full rounded-lg object-cover border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center leading-none"
                          style={{ fontSize: 10 }}
                          aria-label="Quitar imagen"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label
                        className="flex-shrink-0 rounded-lg border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                        style={{ width: 36, height: 36, fontSize: 14 }}
                        title="Subir foto de este color"
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
                  {i === 0 && <label className="text-xs text-gray-500 mb-1 block">Stock</label>}
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
                  {i === 0 && <label className="text-xs text-gray-500 mb-1 block">Precio (RD$, opcional)</label>}
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.price}
                    onChange={e => updateVariantRow(i, 'price', e.target.value)}
                    placeholder="Igual al general"
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
            ))}
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
                Actualizar a Pro →
              </a>
            </div>
          )}

          {error && !planLimitReached && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{ background: saving ? '#ccc' : BRAND.blue }}
            className="w-full text-white font-medium py-3.5 rounded-xl transition-colors"
          >
            {mode === 'editar'
              ? (saving ? 'Guardando...' : 'Guardar cambios')
              : (saving ? 'Publicando...' : 'Publicar producto')}
          </button>

        </form>
      </div>
    </div>
  )
}
