// ============================================================
// MercadoRD — Compresión de imágenes en el navegador
// Ruta: src/lib/storage/imageCompress.ts
// ============================================================
// Los buckets tienen límites que hace cumplir Storage (avatars 1 MB,
// vendors 2 MB, …). Antes de subir se reduce la imagen para cumplirlos:
//   - El lado mayor baja a maxDimension, respetando la orientación EXIF.
//   - Con transparencia (PNG/WebP con alfa) sale WebP, o PNG si el
//     navegador no codifica WebP (Safari). Sin transparencia sale JPEG
//     sobre fondo blanco.
//   - La calidad baja por pasos (y si no basta, las dimensiones) hasta
//     cumplir maxBytes. Si aun así no cumple, error legible.
// Devuelve un File con extensión y tipo coherentes con el contenido.
// ============================================================

export class ImageCompressError extends Error {}

export const IMAGE_TOO_LARGE_MESSAGE = 'La imagen es demasiado grande; usa una de menor tamaño'
const UNREADABLE_IMAGE_MESSAGE = 'No pudimos leer la imagen. Prueba con otro archivo JPG, PNG o WebP.'

const QUALITY_STEPS = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5, 0.42]
const MAX_SHRINK_ROUNDS = 4

type Decoded = { source: CanvasImageSource; width: number; height: number; close: () => void }

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() }
    } catch { /* cae al <img> */ }
  }
  // <img> respeta la orientación EXIF por defecto (image-orientation: from-image).
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('decode'))
      el.src = url
    })
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) }
  } catch {
    URL.revokeObjectURL(url)
    throw new ImageCompressError(UNREADABLE_IMAGE_MESSAGE)
  }
}

function drawToCanvas(img: Decoded, width: number, height: number, background: string | null): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageCompressError(UNREADABLE_IMAGE_MESSAGE)
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, width, height) }
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img.source, 0, 0, width, height)
  return canvas
}

function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true
  return false
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

function renameWithType(file: File, blob: Blob): File {
  const base = file.name.replace(/\.[^.]+$/, '') || 'imagen'
  return new File([blob], `${base}.${EXTENSIONS[blob.type] ?? 'jpg'}`, { type: blob.type, lastModified: Date.now() })
}

export async function compressImage(file: File, { maxDimension, maxBytes }: { maxDimension: number; maxBytes: number }): Promise<File> {
  const img = await decode(file)
  try {
    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
    let width = Math.max(1, Math.round(img.width * scale))
    let height = Math.max(1, Math.round(img.height * scale))

    // Ya cumple: tipo admitido, tamaño y dimensiones dentro del límite.
    if (scale === 1 && file.size <= maxBytes && EXTENSIONS[file.type]) return file

    const mayHaveAlpha = file.type === 'image/png' || file.type === 'image/webp'
    const alpha = mayHaveAlpha && hasTransparency(drawToCanvas(img, width, height, null))

    for (let round = 0; round <= MAX_SHRINK_ROUNDS; round++) {
      const canvas = drawToCanvas(img, width, height, alpha ? null : 'white')
      if (alpha) {
        // WebP si el navegador lo codifica; Safari devuelve PNG en su lugar.
        for (const quality of QUALITY_STEPS) {
          const blob = await toBlob(canvas, 'image/webp', quality)
          if (!blob) break
          if (blob.size <= maxBytes) return renameWithType(file, blob)
          if (blob.type !== 'image/webp') break // PNG: la calidad no cambia nada
        }
      } else {
        for (const quality of QUALITY_STEPS) {
          const blob = await toBlob(canvas, 'image/jpeg', quality)
          if (blob && blob.size <= maxBytes) return renameWithType(file, blob)
        }
      }
      width = Math.max(1, Math.round(width * 0.8))
      height = Math.max(1, Math.round(height * 0.8))
    }
    throw new ImageCompressError(IMAGE_TOO_LARGE_MESSAGE)
  } finally {
    img.close()
  }
}
