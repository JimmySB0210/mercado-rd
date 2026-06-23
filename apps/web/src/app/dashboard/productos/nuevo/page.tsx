'use client'
// ============================================================
// MercadoRD — Crear nuevo producto (vendor)
// Ruta: src/app/dashboard/productos/nuevo/page.tsx
// ============================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateImageFile, getImageDimensions, MIN_PRODUCT_IMAGE_DIMENSION, LOW_RESOLUTION_WARNING } from '@/lib/storage/upload'
import { validateText, validatePrice } from '@/lib/validation'
import { BRAND } from '@/lib/colors'

interface Category {
  id: number
  name: string
  emoji: string
}

interface Province {
  id: number
  name: string
}

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()

  const [vendorId, setVendorId] = useState<string | null>(null)
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

  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    provinceId: '',
    price: '',
    comparePrice: '',
    stock: '',
    sizes: '',
    colors: '',
  })

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageWarning, setImageWarning] = useState<string | null>(null)

  // Cargar vendor, categorías y provincias al montar
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard/productos/nuevo')
        return
      }

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!vendor) {
        router.push('/vendor/register')
        return
      }

      setVendorId(vendor.id)

      const [{ data: cats }, { data: provs }] = await Promise.all([
        supabase.from('categories').select('id, name, emoji').order('sort_order'),
        supabase.from('provinces_rd').select('id, name').order('name'),
      ])

      setCategories(cats ?? [])
      setProvinces(provs ?? [])
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - imageFiles.length)
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

  const uploadImages = async (): Promise<string[]> => {
    if (!vendorId) return []
    const urls: string[] = []

    for (const file of imageFiles) {
      const ext = file.name.split('.').pop()
      const filename = `${vendorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filename, file)

      if (uploadError) {
        console.error('[uploadImages]', uploadError)
        continue
      }

      const { data } = supabase.storage.from('products').getPublicUrl(filename)
      urls.push(data.publicUrl)
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

    if (!vendorId) return
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
      const imageUrls = await uploadImages()

      const { error: insertError } = await supabase
        .from('products')
        .insert({
          vendor_id: vendorId,
          category_id: parseInt(form.categoryId),
          province_id: form.provinceId ? parseInt(form.provinceId) : null,
          name: form.name,
          description: form.description || null,
          price_rdp: priceCents,
          compare_rdp: form.comparePrice ? Math.round(parseFloat(form.comparePrice) * 100) : null,
          stock: stockNum,
          images: imageUrls,
          sizes: form.sizes ? form.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
          colors: form.colors ? form.colors.split(',').map(c => c.trim()).filter(Boolean) : [],
          is_active: true,
        })

      if (insertError) throw insertError

      router.push('/dashboard')
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
            <a href="/dashboard" className="text-sm no-underline" style={{ color: BRAND.gray }}>
              ← Volver al dashboard
            </a>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Nuevo producto</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Imágenes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Fotos del producto</h2>
            <div className="flex flex-wrap gap-3 mb-3">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
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
              {imageFiles.length < 5 && (
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
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Variantes (opcional)</h2>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tallas (separadas por coma)</label>
              <input
                name="sizes"
                value={form.sizes}
                onChange={handleChange}
                placeholder="S, M, L, XL"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Colores (separados por coma)</label>
              <input
                name="colors"
                value={form.colors}
                onChange={handleChange}
                placeholder="Rojo, Azul, Negro"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
              />
            </div>
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
            {saving ? 'Guardando...' : 'Publicar producto'}
          </button>

        </form>
      </div>
    </div>
  )
}
