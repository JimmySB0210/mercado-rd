'use client'
// ============================================================
// MercadoRD — «Tareas pendientes»
// Ruta: src/components/admin/ops/TasksList.tsx
// ============================================================
// No es un sistema de tareas aparte: cada fila ES un registro real
// (disputa abierta o en revisión, proveedor con registro completo en nivel 1,
// contenido marcado sin revisar). Abrir la fila no cambia nada: el estado solo
// cambia con las acciones de su propio módulo (cambiar el estado de la disputa,
// subir el nivel del proveedor, marcar el contenido como revisado).
//
// Orden: prioridad (alta primero) y, dentro de cada prioridad, el más antiguo
// primero. La prioridad se calcula solo por antigüedad (lib/admin/ops.ts).
// ============================================================

import Link from 'next/link'
import { AlertTriangle, ChevronRight, Clock, Flag, Minus, Scale, UserCheck, type LucideIcon } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { TasksData } from '@/lib/queries/adminOps'
import { PRIORITY_THRESHOLD_HOURS, formatDayMonthYear, type AdminTask, type Priority, type TaskKind } from '@/lib/admin/ops'
import { EmptyState, SectionError, useAgeLabel } from './OpsPrimitives'

const KIND_ICON: Record<TaskKind, LucideIcon> = { dispute: Scale, vendor_review: UserCheck, flagged_content: Flag }
const KIND_TONE: Record<TaskKind, 'red' | 'amber' | 'blue'> = { dispute: 'blue', vendor_review: 'amber', flagged_content: 'amber' }
const PRIORITY_ICON: Record<Priority, LucideIcon> = { high: AlertTriangle, medium: Clock, normal: Minus }
const PRIORITY_TONE: Record<Priority, 'red' | 'amber' | 'muted'> = { high: 'red', medium: 'amber', normal: 'muted' }
const STATE_TONE: Record<AdminTask['stateKey'], 'amber' | 'blue'> = { open: 'amber', reviewing: 'blue', vendor_level1: 'amber', unreviewed: 'amber' }

export function TasksList({ data }: { data: TasksData }) {
  const { t, language } = useTranslation('admin')
  const ageLabel = useAgeLabel()

  const kindLabel = (k: TaskKind) => t(k === 'dispute' ? 'ops.taskDispute' : k === 'vendor_review' ? 'ops.taskVendor' : 'ops.taskFlagged')
  const priorityLabel = (p: Priority) => t(p === 'high' ? 'ops.priorityHigh' : p === 'medium' ? 'ops.priorityMedium' : 'ops.priorityNormal')
  const stateLabel = (s: AdminTask['stateKey']) =>
    t(s === 'open' ? 'ops.stateOpen' : s === 'reviewing' ? 'ops.stateReviewing' : s === 'vendor_level1' ? 'ops.stateVendorLevel1' : 'ops.stateUnreviewed')
  const sourceLabel = (k: TaskKind) => t(k === 'dispute' ? 'ops.sourceDisputes' : k === 'vendor_review' ? 'ops.sourceVendors' : 'ops.sourceFlagged')

  const { items, failed, totalPending } = data
  const allFailed = failed.length === 3

  return (
    <section className="adm-card" aria-labelledby="adm-tasks-title" id="tareas-pendientes">
      <div className="adm-card-head">
        <div>
          <h2 className="adm-card-title" id="adm-tasks-title">{t('ops.tasksTitle')}</h2>
          <p className="adm-card-sub">{t('ops.tasksSubtitle')}</p>
        </div>
      </div>

      {failed.length > 0 && !allFailed && (
        <div style={{ padding: '12px 16px 0' }}>
          <div className="adm-note" data-tone="amber" role="alert">
            <AlertTriangle size={14} aria-hidden="true" />
            <span>{t('ops.tasksPartial', { sources: failed.map(sourceLabel).join(', ') })}</span>
          </div>
        </div>
      )}

      {allFailed ? (
        <div style={{ padding: 16 }}><SectionError /></div>
      ) : items.length === 0 ? (
        <EmptyState title={t('ops.tasksEmptyTitle')} body={t('ops.tasksEmptyBody')} />
      ) : (
        <div className="adm-card-body-flush adm-table-wrap">
          <table className="adm-table" data-stack>
            <caption className="adm-vh">{t('ops.tasksTitle')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('ops.colTask')}</th>
                <th scope="col">{t('ops.colDetail')}</th>
                <th scope="col">{t('ops.colCreated')}</th>
                <th scope="col">{t('ops.colPriority')}</th>
                <th scope="col">{t('ops.colState')}</th>
                <th scope="col"><span className="adm-vh">{t('ops.colAction')}</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map(task => {
                const Icon = KIND_ICON[task.kind]
                const PIcon = PRIORITY_ICON[task.priority]
                return (
                  <tr key={task.key} data-task={task.kind} data-priority={task.priority}>
                    <td data-label={t('ops.colTask')}>
                      <span className="adm-task-kind" data-tone={KIND_TONE[task.kind]}>
                        <Icon size={16} aria-hidden="true" />
                        <span>
                          <span style={{ display: 'block' }}>{kindLabel(task.kind)}</span>
                          <span className="adm-ref">{task.label}</span>
                        </span>
                      </span>
                    </td>
                    <td data-label={t('ops.colDetail')}>
                      {task.detailKey ? (
                        <span>
                          {t(task.detailKey as Parameters<typeof t>[0])}
                          {task.detailText && <span className="adm-muted"> · {task.detailText}</span>}
                        </span>
                      ) : (
                        <span className="adm-muted">—</span>
                      )}
                    </td>
                    <td data-label={t('ops.colCreated')} className="adm-nowrap">
                      <span className="adm-strong">{ageLabel(task.ageMinutes)}</span>
                      <span className="adm-line2">{formatDayMonthYear(task.createdAt, language)}</span>
                    </td>
                    <td data-label={t('ops.colPriority')} className="adm-nowrap">
                      <span className="adm-badge" data-tone={PRIORITY_TONE[task.priority]}>
                        <PIcon size={12} aria-hidden="true" />
                        {priorityLabel(task.priority)}
                      </span>
                    </td>
                    <td data-label={t('ops.colState')} className="adm-nowrap">
                      <span className="adm-badge" data-tone={STATE_TONE[task.stateKey]}>{stateLabel(task.stateKey)}</span>
                    </td>
                    <td data-label="" className="adm-nowrap">
                      <Link href={task.href} className="adm-btn" aria-label={t('ops.actionReviewAria', { label: task.label })}>
                        {t('ops.actionReview')}
                        <ChevronRight size={14} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!allFailed && (
        <div className="adm-card-foot">
          <span>
            {totalPending !== null && items.length > 0 ? t('ops.tasksShowing', { shown: items.length, total: totalPending }) : ' '}
          </span>
          <span>{t('ops.tasksPriorityRule', { high: PRIORITY_THRESHOLD_HOURS.high, medium: PRIORITY_THRESHOLD_HOURS.medium })}</span>
        </div>
      )}
    </section>
  )
}
