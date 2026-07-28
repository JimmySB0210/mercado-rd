// ============================================================
// MercadoRD — Upload de imágenes a Supabase Storage
// Archivo: lib/storage/upload.ts
// ============================================================
// USO en componente "use client":
//   import { uploadProductImage, uploadVendorLogo } from '@/lib/storage/upload'
// ============================================================

import { createClient } from '@/lib/supabase/client'

type UploadResult = { url: string; error: null } | { url: null; error: string }

// ─── Validación de imágenes (correr ANTES de subir a Storage) ─────────────────
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const MIN_PRODUCT_IMAGE_DIMENSION = 400
export const LOW_RESOLUTION_WARNING = 'Recomendamos imágenes de al menos 400×400px para mejor calidad'

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Solo se permiten imágenes JPG, PNG o WebP'
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'La imagen no puede superar 5MB'
  }
  return null
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

// ─── Imagen de producto ───────────────────────────────────────────────────────
export async function uploadProductImage(
  file: File,
  vendorId: string
): Promise<UploadResult> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const filename = `${vendorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('products')
    .upload(filename, file, { upsert: false })

  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from('products').getPublicUrl(filename)
  return { url: data.publicUrl, error: null }
}

// ─── Logo de vendor ─────────────────────────────────────────────────────────
export async function uploadVendorLogo(
  file: File,
  userId: string
): Promise<UploadResult> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const filename = `${userId}/logo-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('vendors')
    .upload(filename, file, { upsert: true })

  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from('vendors').getPublicUrl(filename)
  return { url: data.publicUrl, error: null }
}

// ─── Avatar de usuario ──────────────────────────────────────────────────────
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const filename = `${userId}/avatar.${ext}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filename, file, { upsert: true })

  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filename)

  // Actualizar avatar_url en el perfil del usuario
  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId)

  if (updateError) console.warn('[uploadAvatar] No se pudo actualizar perfil:', updateError)

  return { url: data.publicUrl, error: null }
}

// ─── Imagen de banner promocional (admin) ──────────────────────────────────
export async function uploadBanner(file: File): Promise<UploadResult> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('banners')
    .upload(filename, file, { upsert: false })

  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from('banners').getPublicUrl(filename)
  return { url: data.publicUrl, error: null }
}

// ─── Eliminar imagen ────────────────────────────────────────────────────────
export async function deleteImage(
  bucket: 'products' | 'vendors' | 'avatars' | 'banners',
  path: string
): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  return !error
}
