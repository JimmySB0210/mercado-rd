// ============================================================
// MercadoRD — Borrador local del producto nuevo
// Ruta: src/lib/productDraft.ts
// ============================================================
// «Continuar donde me quedé»: mientras el vendedor arma un producto nuevo, el
// asistente guarda su avance en el propio dispositivo (IndexedDB del navegador),
// una copia por vendedor. Si se va a mitad de camino (cambió de página, se le
// cerró la pestaña, se le acabó la batería), al volver a «Nuevo producto» puede
// seguir donde se quedó.
//
// Por qué en el dispositivo y no en la base de datos: «Guardar borrador» exige
// nombre, precio y categoría, y las fotos solo se suben al guardar; antes de eso
// no hay nada que guardar en el servidor. Subir las fotos a Storage «por si
// acaso» dejaría archivos huérfanos cada vez que el vendedor no vuelve.
//
// Qué se guarda: el estado del formulario (texto, categoría, opciones, atributos,
// precios por cantidad, el paso donde iba) y, aparte, las fotos elegidas (los
// archivos). El video NO se guarda: pesa hasta 50 MB; el asistente avisa que hay
// que volver a elegirlo. Las fotos de color de las variantes ya viven en Storage
// (se suben al elegirlas) y se guardan por su URL.
//
// Nada de esto puede romper el formulario: todo acceso a IndexedDB está en
// try/catch y, si el navegador no lo permite (modo privado de algunos navegadores,
// almacenamiento bloqueado), el borrador local simplemente no existe.
// ============================================================

import { SIZE_SCALE_ORDER, type SizeScale } from '@/lib/productSizes'
import type { VariantRow } from '@/lib/variantRows'

export const DRAFT_VERSION = 1
// Un borrador sin tocar caduca solo; evita avisos de productos de hace meses
export const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000
export const DRAFT_MAX_PHOTOS = 5

export type DraftStepId = 'photos' | 'basic' | 'price' | 'shipping' | 'preview'
export const DRAFT_STEP_IDS: readonly DraftStepId[] = ['photos', 'basic', 'price', 'shipping', 'preview']

// Mismos campos (todos texto) que el `form` de ProductForm
export interface DraftFormFields {
  name: string
  description: string
  categoryId: string
  provinceId: string
  price: string
  comparePrice: string
  stock: string
  lowStockThreshold: string
  sku: string
  barcode: string
  warranty: string
  weightKg: string
  lengthCm: string
  widthCm: string
  heightCm: string
}

export const DRAFT_FORM_KEYS: readonly (keyof DraftFormFields)[] = [
  'name', 'description', 'categoryId', 'provinceId', 'price', 'comparePrice', 'stock',
  'lowStockThreshold', 'sku', 'barcode', 'warranty', 'weightKg', 'lengthCm', 'widthCm', 'heightCm',
]

export const emptyDraftForm = (): DraftFormFields => ({
  name: '', description: '', categoryId: '', provinceId: '', price: '', comparePrice: '',
  stock: '', lowStockThreshold: '', sku: '', barcode: '', warranty: '',
  weightKg: '', lengthCm: '', widthCm: '', heightCm: '',
})

export interface DraftDynamicRow {
  values: Record<number, string>
  stock: string
  price: string
  imageUrl: string | null
}

// Misma forma que TierRow (components/vendor/PricingTiersSection.tsx)
export interface DraftTier {
  id: string
  min_quantity: number
  max_quantity: number | null
  price_rdp: number
  unit_label: string
}

export type DraftAttributeValue = string | string[] | boolean

export interface ProductDraft {
  v: typeof DRAFT_VERSION
  savedAt: number
  step: DraftStepId
  form: DraftFormFields
  // Ruta de categorías elegida (raíz → … → hoja); puede quedar a medias
  categoryPath: string[]
  customWarranty: boolean
  hasOptions: boolean
  variantRows: VariantRow[]
  sizeScale: SizeScale | null
  dynamicRows: DraftDynamicRow[]
  tiers: DraftTier[]
  advancedOpen: boolean
  attributes: Record<number, DraftAttributeValue>
  // Informativo (para los avisos): la verdad son los archivos guardados aparte
  photoCount: number
  // El video no se guarda; solo se recuerda que había uno para avisar
  hadVideo: boolean
}

// ─── Lectura defensiva ─────────────────────────────────────────────────
// Lo guardado puede venir de una versión anterior, de otra pestaña o estar
// dañado: nada se usa sin pasar por aquí.

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

// Los ids de category_attributes son uuid en la base de datos (los tipos de la app
// dicen number): aquí son claves de texto opacas y nunca se convierten a número.
const ID_KEY = /^[\w-]{1,64}$/
const isIdKey = (key: string): boolean => ID_KEY.test(key) && key !== '__proto__'

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '')

const parseUrl = (v: unknown): string | null =>
  typeof v === 'string' && v.length <= 2000 && /^https?:\/\//i.test(v) ? v : null

const parseVariantRow = (v: unknown): VariantRow | null => {
  if (!isRecord(v)) return null
  return {
    size: str(v.size, 100),
    color: str(v.color, 100),
    stock: str(v.stock, 10),
    price: str(v.price, 20),
    imageUrl: parseUrl(v.imageUrl),
  }
}

const parseDynamicRow = (v: unknown): DraftDynamicRow | null => {
  if (!isRecord(v)) return null
  const values: Record<string, string> = {}
  if (isRecord(v.values)) {
    for (const [key, val] of Object.entries(v.values).slice(0, 30)) {
      if (isIdKey(key) && typeof val === 'string') values[key] = val.slice(0, 200)
    }
  }
  return { values, stock: str(v.stock, 10), price: str(v.price, 20), imageUrl: parseUrl(v.imageUrl) }
}

const parseTier = (v: unknown): DraftTier | null => {
  if (!isRecord(v)) return null
  const id = str(v.id, 100)
  const min = v.min_quantity
  const max = v.max_quantity
  const price = v.price_rdp
  if (!id || typeof min !== 'number' || !Number.isInteger(min) || min < 1) return null
  if (max !== null && (typeof max !== 'number' || !Number.isInteger(max) || max < min)) return null
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) return null
  return { id, min_quantity: min, max_quantity: max, price_rdp: price, unit_label: str(v.unit_label, 50) }
}

const parseAttributes = (v: unknown): Record<number, DraftAttributeValue> => {
  const out: Record<string, DraftAttributeValue> = {}
  if (!isRecord(v)) return out
  for (const [key, val] of Object.entries(v).slice(0, 100)) {
    if (!isIdKey(key)) continue
    if (typeof val === 'string') out[key] = val.slice(0, 500)
    else if (typeof val === 'boolean') out[key] = val
    else if (Array.isArray(val)) out[key] = val.filter((x): x is string => typeof x === 'string').slice(0, 100).map(x => x.slice(0, 200))
  }
  return out
}

function parseList<T>(v: unknown, max: number, parse: (item: unknown) => T | null): T[] {
  if (!Array.isArray(v)) return []
  const out: T[] = []
  for (const item of v.slice(0, max)) {
    const parsed = parse(item)
    if (parsed) out.push(parsed)
  }
  return out
}

// Devuelve el borrador limpio, o null si lo guardado no sirve (versión
// desconocida, sin fecha, no es un objeto…). Nunca lanza.
export function parseDraft(raw: unknown): ProductDraft | null {
  try {
    if (!isRecord(raw) || raw.v !== DRAFT_VERSION) return null
    const savedAt = raw.savedAt
    if (typeof savedAt !== 'number' || !Number.isFinite(savedAt) || savedAt <= 0) return null

    const rawForm = isRecord(raw.form) ? raw.form : {}
    const form = emptyDraftForm()
    for (const key of DRAFT_FORM_KEYS) form[key] = str(rawForm[key], key === 'description' ? 5000 : 200)

    const step = DRAFT_STEP_IDS.find(s => s === raw.step) ?? 'photos'
    const sizeScale = SIZE_SCALE_ORDER.find(s => s === raw.sizeScale) ?? null
    const photoCount = Number(raw.photoCount)

    return {
      v: DRAFT_VERSION,
      savedAt,
      step,
      form,
      categoryPath: parseList(raw.categoryPath, 8, x => (typeof x === 'string' && /^\d{1,9}$/.test(x) ? x : null)),
      customWarranty: raw.customWarranty === true,
      hasOptions: raw.hasOptions === true,
      variantRows: parseList(raw.variantRows, 300, parseVariantRow),
      sizeScale,
      dynamicRows: parseList(raw.dynamicRows, 300, parseDynamicRow),
      tiers: parseList(raw.tiers, 20, parseTier),
      advancedOpen: raw.advancedOpen === true,
      attributes: parseAttributes(raw.attributes),
      photoCount: Number.isFinite(photoCount) ? Math.min(DRAFT_MAX_PHOTOS, Math.max(0, Math.trunc(photoCount))) : 0,
      hadVideo: raw.hadVideo === true,
    }
  } catch {
    return null
  }
}

export const isDraftExpired = (savedAt: number, now: number): boolean => now - savedAt > DRAFT_TTL_MS

// ¿Hay algo que valga la pena conservar? Un formulario recién abierto, o al que
// solo se le dijo «sí, tiene opciones», no guarda nada (ni muestra el aviso).
export function draftHasContent(draft: ProductDraft, photoCount: number = draft.photoCount): boolean {
  if (photoCount > 0 || draft.hadVideo) return true
  if (DRAFT_FORM_KEYS.some(key => draft.form[key].trim() !== '')) return true
  if (draft.variantRows.some(r => r.size.trim() || r.color.trim() || r.stock.trim() || r.price.trim() || r.imageUrl)) return true
  if (draft.dynamicRows.some(r => Object.values(r.values).some(v => v.trim()) || r.stock.trim() || r.price.trim() || r.imageUrl)) return true
  if (draft.tiers.length > 0) return true
  return Object.values(draft.attributes).some(v =>
    typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) ? v.length > 0 : v === true
  )
}

// «hace 5 minutos» / «5 minutes ago» / «il y a 5 minutes» (ahora, minutos,
// horas o días: un borrador no pasa de 30 días)
export function formatDraftAge(savedAt: number, now: number, locale: string): string {
  const seconds = Math.max(0, Math.floor((now - savedAt) / 1000))
  let value: number
  let unit: Intl.RelativeTimeFormatUnit
  if (seconds < 45) { value = 0; unit = 'second' }
  else if (seconds < 3600) { value = -Math.max(1, Math.floor(seconds / 60)); unit = 'minute' }
  else if (seconds < 86400) { value = -Math.floor(seconds / 3600); unit = 'hour' }
  else { value = -Math.floor(seconds / 86400); unit = 'day' }
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit)
  } catch {
    // navegador sin Intl.RelativeTimeFormat o idioma que no reconoce: la fecha tal cual
    try {
      return new Date(savedAt).toLocaleString(locale)
    } catch {
      return new Date(savedAt).toLocaleString()
    }
  }
}

// Firma de un juego de fotos: si no cambió, no hace falta volver a escribirlas
export const photosSignature = (files: readonly File[]): string =>
  files.map(f => `${f.name}:${f.size}:${f.lastModified}`).join('|')

// ─── Categorías al restaurar ───────────────────────────────────────────
// La categoría pudo cambiar desde que se guardó (la borraron, ahora tiene
// subcategorías…): se valida contra el árbol actual en vez de fiarse.

export interface DraftCategory {
  id: number
  parent_id: number | null
}

// Ruta raíz → … → categoría, subiendo por parent_id
export function categoryPathFor(cats: readonly DraftCategory[], id: string): string[] {
  const byId = new Map(cats.map(c => [c.id, c]))
  const path: string[] = []
  const seen = new Set<number>()
  let current = byId.get(Number(id))
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    path.unshift(String(current.id))
    current = current.parent_id != null ? byId.get(current.parent_id) : undefined
  }
  return path
}

export function resolveDraftCategory(
  cats: readonly DraftCategory[],
  categoryId: string,
  savedPath: readonly string[]
): { categoryId: string; path: string[] } {
  const hasChildren = (id: number) => cats.some(c => c.parent_id === id)

  if (categoryId) {
    const id = Number(categoryId)
    if (cats.some(c => c.id === id)) {
      const path = categoryPathFor(cats, categoryId)
      // Si ya tiene subcategorías, el producto quedaría en una categoría que
      // no es hoja: se deja la ruta hasta ahí y se elige el último nivel de nuevo
      return hasChildren(id) ? { categoryId: '', path } : { categoryId, path }
    }
  }

  // Ruta a medias (eligió el nivel de arriba pero no la hoja): solo si sigue
  // siendo una cadena real desde la raíz
  const path = savedPath.map(Number)
  const byId = new Map(cats.map(c => [c.id, c]))
  const chain = path.every((id, i) => {
    const cat = byId.get(id)
    return !!cat && (i === 0 ? cat.parent_id === null : cat.parent_id === path[i - 1])
  })
  if (!chain) return { categoryId: '', path: [] }
  // Una hoja al final de una ruta sin categoría elegida no tiene sentido: se quita
  const last = path[path.length - 1]
  const trimmed = last !== undefined && !hasChildren(last) ? path.slice(0, -1) : path
  return { categoryId: '', path: trimmed.map(String) }
}

// ─── Atributos y filas dinámicas al restaurar ──────────────────────────
// El efecto de la categoría vuelve a pedir los atributos y deja los valores en
// blanco; lo guardado se vuelve a poner DESPUÉS, y solo lo que todavía existe
// en esa categoría y con el tipo de valor que espera el campo.

export function restoreAttributeValues(
  saved: Readonly<Record<number, DraftAttributeValue>>,
  attrs: readonly { id: number; attribute_type: string }[]
): Record<number, DraftAttributeValue> {
  const out: Record<number, DraftAttributeValue> = {}
  for (const attr of attrs) {
    const value = saved[attr.id]
    if (value === undefined) continue
    if (attr.attribute_type === 'boolean') {
      if (typeof value === 'boolean') out[attr.id] = value
    } else if (attr.attribute_type === 'multiselect') {
      if (Array.isArray(value)) out[attr.id] = value
    } else if (typeof value === 'string') {
      out[attr.id] = value
    }
  }
  return out
}

export function restoreDynamicRows(
  saved: readonly DraftDynamicRow[],
  variantAttributeIds: readonly number[]
): DraftDynamicRow[] {
  const allowed = new Set(variantAttributeIds.map(String))
  const rows = saved.map(row => {
    const values: Record<string, string> = {}
    for (const [key, val] of Object.entries(row.values)) {
      if (allowed.has(key)) values[key] = val
    }
    return { ...row, values }
  })
  return rows.length > 0 ? rows : [{ values: {}, stock: '', price: '', imageUrl: null }]
}

// ─── IndexedDB (sin dependencias) ──────────────────────────────────────
// Dos almacenes, ambos con el id del vendedor como clave:
//  · estado: el JSON del formulario (pequeño, se reescribe seguido)
//  · fotos: los archivos (se reescriben solo cuando cambia el juego de fotos)

const DB_NAME = 'mercadord-borrador-producto'
const DB_VERSION = 1
const STORE_STATE = 'estado'
const STORE_PHOTOS = 'fotos'
const OPEN_TIMEOUT_MS = 3000

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  const promise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_STATE)) db.createObjectStore(STORE_STATE)
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) db.createObjectStore(STORE_PHOTOS)
    }
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => { db.close(); dbPromise = null }
      db.onclose = () => { dbPromise = null }
      resolve(db)
    }
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir IndexedDB'))
    request.onblocked = () => reject(new Error('IndexedDB bloqueada'))
  })
  dbPromise = promise
  promise.catch(() => { if (dbPromise === promise) dbPromise = null })
  return promise
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Tiempo agotado')), ms)
    promise.then(
      value => { clearTimeout(timer); resolve(value) },
      error => { clearTimeout(timer); reject(error) }
    )
  })
}

const getDb = () => withTimeout(openDb(), OPEN_TIMEOUT_MS)

// Escrituras en curso de cualquier ProductDraftStore de esta página. Lo que lee
// (loadDraft, peekDraft) o borra (discardDraft) espera a que terminen: al salir
// del asistente navegando dentro de la app, el formulario guarda lo último que
// escribió justo cuando el aviso del panel se monta; sin esperar, el aviso
// leería antes de que se escriba y no aparecería.
let pendingWrites: Promise<unknown> = Promise.resolve()

function idbGet(db: IDBDatabase, store: string, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const request = tx.objectStore(store).get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.onabort = () => reject(tx.error ?? new Error('Transacción abortada'))
  })
}

// Se da por escrito cuando la transacción termina (no antes)
function idbPut(db: IDBDatabase, store: string, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('Transacción abortada'))
  })
}

function idbDelete(db: IDBDatabase, stores: string[], key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, 'readwrite')
    for (const store of stores) tx.objectStore(store).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('Transacción abortada'))
  })
}

// Una foto guardada. Se guarda el contenido en bruto (ArrayBuffer), no el File:
// algunos Safari fallan al guardar Blobs en IndexedDB.
interface StoredPhoto {
  name: string
  type: string
  lastModified: number
  data: ArrayBuffer
}

function readFileBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

async function toStoredPhoto(file: File): Promise<StoredPhoto> {
  return { name: file.name, type: file.type, lastModified: file.lastModified, data: await readFileBuffer(file) }
}

function parsePhotos(raw: unknown): File[] {
  if (!isRecord(raw) || !Array.isArray(raw.photos)) return []
  const files: File[] = []
  for (const item of raw.photos.slice(0, DRAFT_MAX_PHOTOS)) {
    if (!isRecord(item) || !(item.data instanceof ArrayBuffer) || item.data.byteLength === 0) continue
    if (typeof item.type !== 'string' || !item.type.startsWith('image/')) continue
    files.push(new File([item.data], str(item.name, 200) || 'foto', {
      type: item.type,
      lastModified: typeof item.lastModified === 'number' ? item.lastModified : Date.now(),
    }))
  }
  return files
}

export type LoadedDraft =
  | { status: 'none' }
  | { status: 'found'; draft: ProductDraft; photos: File[] }
  // El navegador no deja usar el almacenamiento: no se lee ni se escribe nada
  | { status: 'unavailable' }

// Lee el borrador del vendedor. Los dañados, vencidos o vacíos se borran y
// cuentan como «no hay». Nunca lanza.
export async function loadDraft(vendorId: string, now: number = Date.now()): Promise<LoadedDraft> {
  try {
    await pendingWrites
    const db = await getDb()
    const raw = await idbGet(db, STORE_STATE, vendorId)
    if (raw === undefined) {
      // fotos sueltas sin estado: restos de un guardado interrumpido
      if ((await idbGet(db, STORE_PHOTOS, vendorId)) !== undefined) await idbDelete(db, [STORE_PHOTOS], vendorId)
      return { status: 'none' }
    }
    const draft = parseDraft(raw)
    const photos = draft ? parsePhotos(await idbGet(db, STORE_PHOTOS, vendorId)) : []
    if (!draft || isDraftExpired(draft.savedAt, now) || !draftHasContent(draft, photos.length)) {
      await idbDelete(db, [STORE_STATE, STORE_PHOTOS], vendorId)
      return { status: 'none' }
    }
    return { status: 'found', draft, photos }
  } catch {
    return { status: 'unavailable' }
  }
}

export interface DraftSummary {
  name: string
  savedAt: number
  photoCount: number
  step: DraftStepId
}

// Lo mínimo para el aviso del panel: solo lee el estado (no las fotos)
export async function peekDraft(vendorId: string, now: number = Date.now()): Promise<DraftSummary | null> {
  try {
    await pendingWrites
    const db = await getDb()
    const draft = parseDraft(await idbGet(db, STORE_STATE, vendorId))
    if (!draft || isDraftExpired(draft.savedAt, now) || !draftHasContent(draft)) return null
    return { name: draft.form.name.trim(), savedAt: draft.savedAt, photoCount: draft.photoCount, step: draft.step }
  } catch {
    return null
  }
}

// Borra el borrador sin necesitar un ProductDraftStore (aviso del panel)
export async function discardDraft(vendorId: string): Promise<boolean> {
  try {
    await pendingWrites
    await idbDelete(await getDb(), [STORE_STATE, STORE_PHOTOS], vendorId)
    return true
  } catch {
    return false
  }
}

// Escribe el borrador de UN vendedor. Las escrituras se encolan y se aplican en
// orden; clear() y finish() descartan las que estaban esperando, así un guardado
// atrasado nunca revive un borrador que ya se descartó o se publicó.
export class ProductDraftStore {
  private chain: Promise<unknown> = Promise.resolve()
  private epoch = 0
  private stopped = false

  constructor(private readonly vendorId: string) {}

  saveState(draft: ProductDraft): Promise<boolean> {
    return this.enqueue(db => idbPut(db, STORE_STATE, this.vendorId, draft))
  }

  // Sin fotos se borra el registro de fotos
  savePhotos(files: readonly File[]): Promise<boolean> {
    return this.enqueue(async db => {
      if (files.length === 0) {
        await idbDelete(db, [STORE_PHOTOS], this.vendorId)
        return
      }
      const photos = await Promise.all(files.slice(0, DRAFT_MAX_PHOTOS).map(toStoredPhoto))
      await idbPut(db, STORE_PHOTOS, this.vendorId, { savedAt: Date.now(), photos })
    })
  }

  // Borra todo y sigue aceptando escrituras nuevas (empezar de cero)
  clear(): Promise<boolean> {
    this.epoch++
    return this.enqueue(db => idbDelete(db, [STORE_STATE, STORE_PHOTOS], this.vendorId))
  }

  // Borra todo y deja de escribir para siempre (el producto ya se guardó)
  finish(): Promise<boolean> {
    const done = this.clear()
    this.stopped = true
    return done
  }

  private enqueue(job: (db: IDBDatabase) => Promise<void>): Promise<boolean> {
    if (this.stopped) return Promise.resolve(false)
    const epoch = this.epoch
    const run = this.chain.then(async () => {
      if (epoch !== this.epoch) return false
      try {
        await job(await getDb())
        return true
      } catch {
        return false
      }
    })
    this.chain = run
    // `run` nunca se rechaza (los errores se vuelven false), así que esto tampoco
    pendingWrites = Promise.all([pendingWrites, run])
    return run
  }
}
