'use client'
// ============================================================
// MercadoRD — Piezas comunes del Centro de operaciones
// Ruta: src/components/admin/ops/OpsPrimitives.tsx
// ============================================================
// Estados de carga, error y vacío (iguales en todas las secciones), antigüedad
// legible y plurales. Cada sección decide cuál mostrar; ninguna convierte un
// error en un cero.
// ============================================================

import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, RefreshCw, type LucideIcon } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'

function useAdminT() {
  return useTranslation('admin')
}
export type AdminT = ReturnType<typeof useAdminT>['t']
type TFn = AdminT

/** «hace 3 d», «hace 5 h», «hace 12 min», «hace instantes». */
export function useAgeLabel() {
  const { t } = useTranslation('admin')
  return (ageMinutes: number): string => {
    if (ageMinutes < 1) return t('ops.ageNow')
    if (ageMinutes < 60) return t('ops.ageMinutes', { n: ageMinutes })
    if (ageMinutes < 60 * 24) return t('ops.ageHours', { n: Math.floor(ageMinutes / 60) })
    return t('ops.ageDays', { n: Math.floor(ageMinutes / (60 * 24)) })
  }
}

/**
 * Traduce una clave que se arma en tiempo de ejecución con un valor de la base (estado, método, motivo).
 * Si el valor es nuevo y todavía no tiene texto en el diccionario, se muestra tal cual en vez de la clave.
 */
export function labelOr(t: TFn, key: string, raw: string): string {
  const label = t(key as Parameters<TFn>[0])
  return label === key ? raw : label
}

/** Elige singular o plural según el número. */
export function pluralize(t: TFn, n: number, one: Parameters<TFn>[0], many: Parameters<TFn>[0]): string {
  return t(n === 1 ? one : many, { n })
}

/** Error de una sección: dice que el dato NO está disponible (no que sea cero) y deja reintentar. */
export function SectionError({ compact }: { compact?: boolean }) {
  const { t } = useTranslation('admin')
  const router = useRouter()
  return (
    <div className="adm-state" data-tone="red" role="alert">
      <AlertTriangle size={18} aria-hidden="true" />
      <div className="adm-state-body">
        <strong>{t('ops.errorTitle')}</strong>
        {!compact && <span>{t('ops.errorBody')}</span>}
      </div>
      <button type="button" className="adm-btn" onClick={() => router.refresh()}>
        <RefreshCw size={14} aria-hidden="true" />
        {t('ops.retry')}
      </button>
    </div>
  )
}

/** Sin resultados: es un estado correcto (no un error), con un texto que lo deja claro. */
export function EmptyState({ title, body, icon: Icon = CheckCircle2 }: { title: string; body?: string; icon?: LucideIcon }) {
  return (
    <div className="adm-empty">
      <Icon size={28} aria-hidden="true" />
      <strong>{title}</strong>
      {body && <span>{body}</span>}
    </div>
  )
}

/** Marcador de carga: bloques grises + texto solo para lectores de pantalla. */
export function CardSkeleton({ rows = 3, title = true, height = 44 }: { rows?: number; title?: boolean; height?: number }) {
  const { t } = useTranslation('admin')
  return (
    <div className="adm-card" role="status" aria-busy="true">
      <span className="adm-vh">{t('ops.loading')}</span>
      <div aria-hidden="true" style={{ padding: 16, display: 'grid', gap: 10 }}>
        {title && <span className="adm-skel" style={{ height: 18, width: '38%' }} />}
        {Array.from({ length: rows }).map((_, i) => (
          <span key={i} className="adm-skel" style={{ height }} />
        ))}
      </div>
    </div>
  )
}

export function AttentionSkeleton() {
  const { t } = useTranslation('admin')
  return (
    <div className="adm-card" role="status" aria-busy="true">
      <span className="adm-vh">{t('ops.loading')}</span>
      <div aria-hidden="true" style={{ padding: 16 }}>
        <span className="adm-skel" style={{ height: 22, width: '30%', marginBottom: 14 }} />
        {/* Misma rejilla que las tarjetas reales, para que al cargar no salte el diseño. */}
        <div className="adm-attn-grid" style={{ padding: 0 }}>
          {Array.from({ length: 5 }).map((_, i) => <span key={i} className="adm-skel" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      </div>
    </div>
  )
}

export function KpiSkeleton() {
  const { t } = useTranslation('admin')
  return (
    <div role="status" aria-busy="true">
      <span className="adm-vh">{t('ops.loading')}</span>
      <div aria-hidden="true" className="adm-kpi-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="adm-card adm-kpi">
            <span className="adm-skel" style={{ height: 14, width: '55%' }} />
            <span className="adm-skel" style={{ height: 30, width: '70%' }} />
            <span className="adm-skel" style={{ height: 12, width: '80%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
