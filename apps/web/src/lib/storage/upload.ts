// ============================================================
// MercadoRD — Upload de imágenes a Supabase Storage
// Archivo: lib/storage/upload.ts
// ============================================================
// USO en componente "use client":
//   import { uploadProductImage, uploadVendorLogo } from '@/lib/storage/upload'
// ============================================================

import { createClient } from '@/lib/supabase/client'

type UploadResult = { url: string; error: null } | { url: null; error: string }

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

// ─── Eliminar imagen ────────────────────────────────────────────────────────
export async function deleteImage(
  bucket: 'products' | 'vendors' | 'avatars',
  path: string
): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  return !error
}
