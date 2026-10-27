// ============================================================
// MercadoRD — Lógica pura del Centro de operaciones (/admin)
// Ruta: src/lib/admin/ops.ts
// ============================================================
// Reglas de negocio del panel (qué estados cuentan, cómo se calcula la
// prioridad, qué eventos de auditoría se resumen) en un solo sitio y SIN
// dependencias, para poder comprobarlas con pruebas unitarias.
//
// Nada aquí lee la base de datos: lib/queries/adminOps.ts trae los datos y
// usa estas funciones; los componentes solo muestran el resultado.
// ============================================================

/** Resultado de leer una sección del panel. Un error NUNCA se convierte en 0. */
export type Section<T> = { ok: true; data: T } | { ok: false; error: string }

// ─── Estados reales (enums de la base) ───────────────────────────────────────

/**
 * Pedidos que cuentan como «venta bruta»: el vendedor ya los confirmó o siguen
 * avanzando. Se excluyen `pending` (todavía sin confirmar) y `cancelled`.
 * enum order_status = pending, confirmed, preparing, shipped, delivered, cancelled
 */
export const SALES_ORDER_STATUSES = ['confirmed', 'preparing', 'shipped', 'delivered'] as const

/** enum dispute_status = open, reviewing, resolved, closed. Piden actuación: open y reviewing. */
export const PENDING_DISPUTE_STATUSES = ['open', 'reviewing'] as const
export const CLOSED_DISPUTE_STATUSES = ['resolved', 'closed'] as const

/** Moneda: la base guarda centavos (RD$ x 100). */
export const CENTAVOS_PER_PESO = 100

// ─── Antigüedad y prioridad ──────────────────────────────────────────────────
// La base NO tiene un campo de prioridad. La prioridad que se muestra es
// una regla de pantalla, calculada solo por antigüedad del registro y con
// los mismos umbrales para todos los tipos de tarea. Cámbialos aquí.

export const PRIORITY_THRESHOLD_HOURS = { high: 72, medium: 24 } as const

export type Priority = 'high' | 'medium' | 'normal'

export function ageMinutesSince(createdAt: string, nowMs: number): number {
  const t = Date.parse(createdAt)
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.floor((nowMs - t) / 60000))
}

export function priorityForAge(ageMinutes: number): Priority {
  if (ageMinutes >= PRIORITY_THRESHOLD_HOURS.high * 60) return 'high'
  if (ageMinutes >= PRIORITY_THRESHOLD_HOURS.medium * 60) return 'medium'
  return 'normal'
}

const PRIORITY_RANK: Record<Priority, number> = { high: 2, medium: 1, normal: 0 }

// ─── Tareas pendientes ───────────────────────────────────────────────────────
// No hay tabla de tareas: cada tarea ES un registro que ya existe
// (disputa, proveedor por revisar, contenido marcado). Su estado solo cambia
// con las acciones de su propio módulo, nunca por abrirla.

export type TaskKind = 'dispute' | 'vendor_review' | 'flagged_content'

export interface AdminTask {
  key: string
  kind: TaskKind
  id: string
  /** Texto corto que identifica el registro (#RD-XXXXXXXX o nombre de la tienda). */
  label: string
  /** Clave de diccionario que describe el detalle (motivo de la disputa, tipo de contenido) o null. */
  detailKey: string | null
  /** Texto libre del registro (nombre de la tienda) cuando el detalle no es un diccionario. */
  detailText: string | null
  createdAt: string
  ageMinutes: number
  priority: Priority
  /** Clave de diccionario del estado: open | reviewing | vendor_level1 | unreviewed. */
  stateKey: 'open' | 'reviewing' | 'vendor_level1' | 'unreviewed'
  href: string
}

const KIND_ORDER: Record<TaskKind, number> = { dispute: 0, flagged_content: 1, vendor_review: 2 }

/** Prioridad (alta primero), luego el más antiguo primero; desempate estable por tipo e id. */
export function compareTasks(a: AdminTask, b: AdminTask): number {
  const byPriority = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]
  if (byPriority !== 0) return byPriority
  if (a.ageMinutes !== b.ageMinutes) return b.ageMinutes - a.ageMinutes
  if (a.kind !== b.kind) return KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** Cuántas tareas se muestran en el resumen del Centro de operaciones. */
export const TASK_LIMIT = 10

/** Referencia corta de un registro, con el mismo formato que ya usa el panel (#RD-XXXXXXXX). */
export function shortRef(uuid: string): string {
  return `#RD-${uuid.split('-')[0].toUpperCase()}`
}

// ─── Disputas: filtros de la lista (/admin/disputas) ─────────────────────────
// Viven aquí (y no en la consulta) porque los usan tanto el servidor como la
// pantalla; ninguno toca la base de datos.

export type DisputeFilter = 'pendientes' | 'abiertas' | 'en_revision' | 'resueltas' | 'cerradas' | 'todas'

export const DISPUTE_FILTERS: readonly DisputeFilter[] = ['pendientes', 'abiertas', 'en_revision', 'resueltas', 'cerradas', 'todas']

/** Estados de la base que cubre cada filtro (null = todos). */
export const DISPUTE_FILTER_STATUSES: Record<DisputeFilter, readonly string[] | null> = {
  pendientes: PENDING_DISPUTE_STATUSES,
  abiertas: ['open'],
  en_revision: ['reviewing'],
  resueltas: ['resolved'],
  cerradas: ['closed'],
  todas: null,
}

/** Cualquier valor que no sea un filtro conocido cae en «pendientes» (nunca llega tal cual a la consulta). */
export function parseDisputeFilter(raw: string | undefined): DisputeFilter {
  return (DISPUTE_FILTERS as readonly string[]).includes(raw ?? '') ? (raw as DisputeFilter) : 'pendientes'
}

export const DISPUTES_PAGE_SIZE = 10

/**
 * URL de /admin/disputas. Con `caseId` abre ese caso; si no, el filtro y la página (la página 1 no se escribe).
 * Cuando se indica un filtro va SIEMPRE explícito, también «pendientes»: así cada pestaña es una URL distinta de la
 * ruta base y no depende de lo que el navegador tenga en caché para `/admin/disputas`.
 */
export function disputesHref(opts: { filter?: DisputeFilter; page?: number; caseId?: string }): string {
  if (opts.caseId) return `/admin/disputas?caso=${encodeURIComponent(opts.caseId)}`
  const params = new URLSearchParams()
  if (opts.filter) params.set('estado', opts.filter)
  if (opts.page && opts.page > 1) params.set('pagina', String(opts.page))
  const query = params.toString()
  return query ? `/admin/disputas?${query}` : '/admin/disputas'
}

// ─── Proveedores: filtro por estado (/admin/proveedores?estado=) ─────────────

export type VendorStateFilter = 'por_revisar' | 'registro_incompleto'

export const VENDOR_STATE_FILTERS: readonly VendorStateFilter[] = ['por_revisar', 'registro_incompleto']

/** Solo se aceptan los dos valores conocidos; cualquier otro (o ninguno) significa «sin filtro». */
export function parseVendorStateFilter(raw: string | undefined): VendorStateFilter | undefined {
  return (VENDOR_STATE_FILTERS as readonly string[]).includes(raw ?? '') ? (raw as VendorStateFilter) : undefined
}

// ─── Actividad reciente (audit_logs) ─────────────────────────────────────────
// Los eventos de auditoría NO son alertas. Aquí solo se resumen los más
// recientes y se deja el historial completo en /admin/auditoria.

/** Eventos rutinarios y muy frecuentes que no se resumen en el Centro de operaciones. */
export const SUMMARY_EXCLUDED_EVENT_TYPES = ['otp_generated'] as const

export type EventIcon = 'order' | 'delivery' | 'dispute' | 'verification' | 'gift' | 'chat' | 'user' | 'security' | 'generic'

/** Tipos de evento conocidos (los que existen hoy en la base) y su icono. Los demás salen con un texto genérico. */
export const KNOWN_AUDIT_EVENTS: Record<string, EventIcon> = {
  order_created: 'order',
  delivery_confirmed: 'delivery',
  dispute_evidence_uploaded: 'dispute',
  external_verification_requested: 'verification',
  gift_order_created: 'gift',
  chat_quote_accepted: 'chat',
  account_deleted: 'user',
  otp_verification_failed: 'security',
  otp_generated: 'security',
}

export function auditEventIcon(eventType: string): EventIcon {
  return Object.prototype.hasOwnProperty.call(KNOWN_AUDIT_EVENTS, eventType) ? KNOWN_AUDIT_EVENTS[eventType] : 'generic'
}

/**
 * Enlace a la auditoría completa filtrada por el tipo de evento y el día (UTC) en que ocurrió,
 * con los mismos parámetros que ya entiende /admin/auditoria (eventType, dateFrom, dateTo).
 */
export function auditHref(eventType: string, createdAt: string): string {
  const day = createdAt.slice(0, 10)
  const params = new URLSearchParams({ eventType })
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    params.set('dateFrom', day)
    params.set('dateTo', day)
  }
  return `/admin/auditoria?${params.toString()}`
}

// ─── Fechas en la hora de República Dominicana ───────────────────────────────
// RD está en UTC-4 todo el año (no usa horario de verano). Se calcula a mano,
// sin Intl, para que el servidor y el navegador escriban EXACTAMENTE lo mismo
// y no haya diferencias de hidratación.

const DR_OFFSET_MS = -4 * 60 * 60 * 1000

const MONTHS_SHORT: Record<'es' | 'en' | 'fr', string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
}

function drParts(iso: string) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  const d = new Date(t + DR_OFFSET_MS)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate(), h: d.getUTCHours(), min: d.getUTCMinutes() }
}

/** «26 oct» / «26 Oct» / «26 oct.» en hora de RD. */
export function formatDayMonth(iso: string, language: 'es' | 'en' | 'fr'): string {
  const p = drParts(iso)
  if (!p) return '—'
  return `${p.day} ${MONTHS_SHORT[language][p.m]}`
}

/** «26 oct 2026». */
export function formatDayMonthYear(iso: string, language: 'es' | 'en' | 'fr'): string {
  const p = drParts(iso)
  if (!p) return '—'
  return `${p.day} ${MONTHS_SHORT[language][p.m]} ${p.y}`
}

/** «17:35» (24 h) en hora de RD. */
export function formatClock(iso: string): string {
  const p = drParts(iso)
  if (!p) return '—'
  return `${String(p.h).padStart(2, '0')}:${String(p.min).padStart(2, '0')}`
}

/** Inicio del mes actual en hora de RD, como instante ISO (UTC). */
export function startOfMonthDR(nowMs: number): string {
  const dr = new Date(nowMs + DR_OFFSET_MS)
  return new Date(Date.UTC(dr.getUTCFullYear(), dr.getUTCMonth(), 1) - DR_OFFSET_MS).toISOString()
}

// ─── Dinero ──────────────────────────────────────────────────────────────────

/** «RD$85,000». Sin Intl: servidor y navegador escriben exactamente lo mismo (sin diferencias de hidratación). */
export function formatRdp(centavos: number): string {
  const pesos = Math.round(centavos / CENTAVOS_PER_PESO)
  const digits = String(Math.abs(pesos)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${pesos < 0 ? '-' : ''}RD$${digits}`
}

/** Suma segura de enteros en centavos: ignora filas sin número en vez de contagiar NaN. */
export function sumCentavos(values: Array<number | null | undefined>): number {
  let total = 0
  for (const v of values) if (typeof v === 'number' && Number.isFinite(v)) total += v
  return total
}

/** Iniciales para el avatar del perfil («Jimmy Santana» → «JS»). */
export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'A'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return (first + last).toUpperCase()
}
