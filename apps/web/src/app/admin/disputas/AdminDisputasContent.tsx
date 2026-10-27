'use client'
// ============================================================
// MercadoRD — Contenido de /admin/disputas
// Ruta: src/app/admin/disputas/AdminDisputasContent.tsx
// ============================================================
// Pestañas por estado (con el conteo exacto de la base), la lista paginada y
// el aviso cuando se abre un caso concreto desde «Tareas pendientes». Cada
// fila es DisputeAdminRow: lo único que cambia estado es SU botón «Guardar».
// ============================================================

import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, SearchX } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { DisputeAdminRow } from '@/components/admin/DisputeAdminRow'
import { EmptyState, SectionError } from '@/components/admin/ops/OpsPrimitives'
import type { DisputeCounts, DisputesPageData } from '@/lib/queries/adminOps'
import { DISPUTES_PAGE_SIZE, DISPUTE_FILTERS, disputesHref, shortRef, type DisputeFilter, type Section } from '@/lib/admin/ops'

const TAB_LABEL: Record<DisputeFilter, 'ops.filterPending' | 'ops.filterOpen' | 'ops.filterReviewing' | 'ops.filterResolved' | 'ops.filterClosed' | 'ops.filterAll'> = {
  pendientes: 'ops.filterPending',
  abiertas: 'ops.filterOpen',
  en_revision: 'ops.filterReviewing',
  resueltas: 'ops.filterResolved',
  cerradas: 'ops.filterClosed',
  todas: 'ops.filterAll',
}

function tabCount(filter: DisputeFilter, c: DisputeCounts): number {
  switch (filter) {
    case 'pendientes': return c.pending
    case 'abiertas': return c.open
    case 'en_revision': return c.reviewing
    case 'resueltas': return c.resolved
    case 'cerradas': return c.closed
    case 'todas': return c.open + c.reviewing + c.resolved + c.closed
  }
}

interface Props {
  list: Section<DisputesPageData>
  counts: Section<DisputeCounts>
  filter: DisputeFilter
  caseId?: string
  nowMs: number
}

export function AdminDisputasContent({ list, counts, filter, caseId }: Props) {
  const { t } = useTranslation('admin')

  return (
    <div className="adm-page">
      <AdminPageHead titleKey="ops.disputesPageTitle" subtitleKey="ops.disputesPageSubtitle" />

      {caseId ? (
        <div className="adm-note" data-tone="blue" role="note" style={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <span>
            {list.ok && list.data.rows[0]
              ? t('ops.disputesCaseShowing', { ref: shortRef(list.data.rows[0].order_id) })
              : t('ops.disputesCaseShowingGeneric')}
          </span>
          <Link href={disputesHref({ filter: 'todas' })} className="adm-link">
            <ArrowLeft size={14} aria-hidden="true" />
            {t('ops.disputesBackToList')}
          </Link>
        </div>
      ) : (
        <nav aria-label={t('ops.disputesFiltersAria')}>
          <div className="adm-tabs">
            {DISPUTE_FILTERS.map(f => (
              <Link
                key={f}
                href={disputesHref({ filter: f })}
                className="adm-tab"
                aria-current={f === filter ? 'page' : undefined}
                data-filter={f}
              >
                {t(TAB_LABEL[f])}
                {counts.ok && <span className="adm-tab-count">{tabCount(f, counts.data)}</span>}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <section className="adm-card" aria-label={t('ops.disputesListAria')}>
        {!list.ok ? (
          <div style={{ padding: 16 }}><SectionError /></div>
        ) : list.data.rows.length === 0 ? (
          caseId ? (
            <EmptyState icon={SearchX} title={t('ops.disputesCaseNotFoundTitle')} body={t('ops.disputesCaseNotFoundBody')} />
          ) : (
            <EmptyState
              title={filter === 'pendientes' ? t('ops.disputesNonePendingTitle') : t('ops.disputesNoneTitle')}
              body={filter === 'pendientes' ? t('ops.disputesNonePendingBody') : t('ops.disputesNoneBody')}
            />
          )
        ) : (
          <>
            <div data-testid="disputes-list">
              {list.data.rows.map(d => (
                <DisputeAdminRow
                  key={d.id}
                  disputeId={d.id}
                  orderId={d.order_id}
                  vendorId={d.vendor_id}
                  reason={d.reason}
                  description={d.description}
                  status={d.status}
                  buyerName={d.buyer_name}
                  vendorName={d.vendor_name}
                  createdAt={d.created_at}
                />
              ))}
            </div>
            {!caseId && <Pager data={list.data} filter={filter} />}
          </>
        )}
      </section>
    </div>
  )
}

function Pager({ data, filter }: { data: DisputesPageData; filter: DisputeFilter }) {
  const { t } = useTranslation('admin')
  const from = (data.page - 1) * DISPUTES_PAGE_SIZE + 1
  const to = from + data.rows.length - 1
  const prev = data.page > 1
  const next = data.page < data.pageCount

  return (
    <nav className="adm-pager" aria-label={t('ops.pagerAria')}>
      <span>{t('ops.pagerRange', { from, to, total: data.total })}</span>
      <div className="adm-pager-links">
        <Link
          href={disputesHref({ filter, page: data.page - 1 })}
          className="adm-btn"
          aria-disabled={!prev}
          tabIndex={prev ? undefined : -1}
          rel="prev"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          {t('ops.pagerPrev')}
        </Link>
        <span className="adm-muted" style={{ alignSelf: 'center' }}>{t('ops.pagerPage', { page: data.page, pages: data.pageCount })}</span>
        <Link
          href={disputesHref({ filter, page: data.page + 1 })}
          className="adm-btn"
          aria-disabled={!next}
          tabIndex={next ? undefined : -1}
          rel="next"
        >
          {t('ops.pagerNext')}
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </nav>
  )
}
