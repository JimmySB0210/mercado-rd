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

// ─── Evidencia de disputa (bucket privado) ──────────────────────────────────
// dispute-evidence NO es público como products/vendors/avatars/banners — no
// existe getPublicUrl() aquí. Solo se guarda la ruta relativa
// ({disputeId}/{filename}); para mostrar la imagen hay que pedir una URL
// firmada aparte (getDisputeEvidenceSignedUrl) justo antes de renderizarla,
// porque las firmadas expiran.
export async function uploadDisputeEvidence(
  file: File,
  disputeId: string
): Promise<{ path: string; error: null } | { path: null; error: string }> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const filename = `${disputeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('dispute-evidence')
    .upload(filename, file, { upsert: false })

  if (error) return { path: null, error: error.message }
  return { path: filename, error: null }
}

const DISPUTE_EVIDENCE_SIGNED_URL_TTL_SECONDS = 3600

export async function getDisputeEvidenceSignedUrls(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (paths.length === 0) return map

  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('dispute-evidence')
    .createSignedUrls(paths, DISPUTE_EVIDENCE_SIGNED_URL_TTL_SECONDS)

  if (error || !data) {
    console.error('[getDisputeEvidenceSignedUrls]', error)
    return map
  }

  for (const entry of data) {
    if (entry.signedUrl && !entry.error) map.set(entry.path ?? '', entry.signedUrl)
  }
  return map
}

// ─── Documentos de identidad (bucket privado) ───────────────────────────────
// identity-documents es privado, RLS permite acceso solo al dueño y a
// admins. Igual que dispute-evidence: solo se guarda la ruta relativa,
// nunca una URL — este tipo de documento en particular no se vuelve a
// mostrar en la interfaz una vez subido, ni siquiera vía URL firmada.
export type IdentityDocumentKind = 'front' | 'back' | 'selfie'

export async function uploadIdentityDocument(
  file: File,
  userId: string,
  kind: IdentityDocumentKind
): Promise<{ path: string; error: null } | { path: null; error: string }> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const filename = `${userId}/${kind}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('identity-documents')
    .upload(filename, file, { upsert: false })

  if (error) return { path: null, error: error.message }
  return { path: filename, error: null }
}

// ─── Adjuntos de chat (bucket privado) ──────────────────────────────────────
// chat-attachments, igual que dispute-evidence: privado, RLS restringe a los
// 2 participantes de la conversación (o admin) — ver
// supabase/migrations/007_chat_attachments.sql. A diferencia de
// dispute-evidence (solo fotos), acá se aceptan 3 tipos — el "tipo" se
// detecta por MIME type al elegir el archivo, no por 3 botones separados.
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']
export const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf']
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024

export type ChatAttachmentType = 'image' | 'video' | 'document'

export interface ChatAttachment {
  path: string
  type: ChatAttachmentType
  filename: string
}

export function detectChatAttachmentType(file: File): ChatAttachmentType | null {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return 'image'
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return 'video'
  if (ALLOWED_DOCUMENT_TYPES.includes(file.type)) return 'document'
  return null
}

// Valida por tipo detectado — reusa validateImageFile() para imágenes, ya
// que la regla (JPG/PNG/WebP, 5MB) es la misma que en el resto del sitio.
export function validateChatFile(file: File): { type: ChatAttachmentType; error: null } | { type: null; error: string } {
  const type = detectChatAttachmentType(file)
  if (!type) return { type: null, error: 'Solo se permiten imágenes (JPG/PNG/WebP), videos (MP4/MOV) o documentos PDF' }

  if (type === 'image') {
    const err = validateImageFile(file)
    if (err) return { type: null, error: err }
  } else if (type === 'video') {
    if (file.size > MAX_VIDEO_SIZE_BYTES) return { type: null, error: 'El video no puede superar 20MB' }
  } else {
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) return { type: null, error: 'El documento no puede superar 10MB' }
  }

  return { type, error: null }
}

export async function uploadChatAttachment(
  file: File,
  conversationId: string,
  type: ChatAttachmentType
): Promise<{ attachment: ChatAttachment; error: null } | { attachment: null; error: string }> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${conversationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('chat-attachments')
    .upload(path, file, { upsert: false })

  if (error) return { attachment: null, error: error.message }
  return { attachment: { path, type, filename: file.name }, error: null }
}

const CHAT_ATTACHMENT_SIGNED_URL_TTL_SECONDS = 3600

export async function getChatAttachmentSignedUrls(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (paths.length === 0) return map

  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrls(paths, CHAT_ATTACHMENT_SIGNED_URL_TTL_SECONDS)

  if (error || !data) {
    console.error('[getChatAttachmentSignedUrls]', error)
    return map
  }

  for (const entry of data) {
    if (entry.signedUrl && !entry.error) map.set(entry.path ?? '', entry.signedUrl)
  }
  return map
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
