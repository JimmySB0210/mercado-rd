'use client'
// ============================================================
// MercadoRD — Panel del cliente (vista del vendedor)
// Ruta: src/components/messages/CustomerPanel.tsx
// ============================================================
// Lo usan la bandeja (/dashboard/mensajes) y el chat (/mensajes/[id])
// cuando quien mira es el vendedor. Solo lectura: las cifras salen de
// lib/inboxClassification.ts sobre los pedidos del vendedor con ese
// comprador. En el chat se ocultan "Abrir chat" y "Responder
// cotización", porque la conversación ya está abierta.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { formatPrice } from '@/types/database.types'
import { BRAND } from '@/lib/colors'
import { labelOf, relationOf, type BuyerSummary, type InboxLabel } from '@/lib/inboxClassification'

export interface CustomerPanelData {
  id: string
  buyerId: string
  buyerName: string | null
  buyerAvatar: string | null
  hasQuote: boolean
  quote: { id: string; quantity: number; status: string; productName: string } | null
  summary: BuyerSummary | null
}

export const LABEL_STYLE: Record<InboxLabel, { bg: string; color: string }> = {
  quote: { bg: '#EAF3FF', color: '#0B5FC6' },
  in_progress: { bg: '#FEF3C7', color: '#92400E' },
  recurring: { bg: '#DCFCE7', color: '#166534' },
  client: { bg: '#E8F8F0', color: '#0B7A4B' },
  contact: { bg: '#F2F4F7', color: '#475467' },
}

export const LABEL_TEXT_KEY = {
  quote: 'messagesLabelQuote',
  in_progress: 'messagesLabelInProgress',
  recurring: 'messagesLabelRecurring',
  client: 'messagesLabelClient',
  contact: 'messagesLabelContact',
} as const

export const ORDER_STATUS_LABEL = {
  pending: 'incomeStatusPending',
  confirmed: 'incomeStatusConfirmed',
  preparing: 'incomeStatusPreparing',
  shipped: 'incomeStatusShipped',
  delivered: 'incomeStatusDelivered',
  cancelled: 'incomeStatusCancelled',
} as const

const QUOTE_STATUS_LABEL = {
  requested: 'messagesQuoteStatusRequested',
  quoted: 'messagesQuoteStatusQuoted',
  accepted: 'messagesQuoteStatusAccepted',
  declined: 'messagesQuoteStatusDeclined',
} as const

export const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(10,30,60,0.06)', border: '1px solid #EEF2F6',
}

export function shortOrderId(orderId: string): string {
  return `#RD-${orderId.split('-')[0].toUpperCase()}`
}

export function CustomerPanel({ row, onClose, inChat = false }: {
  row: CustomerPanelData
  onClose: () => void
  inChat?: boolean
}) {
  const { t, language } = useTranslation('dashboard')
  const summary = row.summary
  const relation = relationOf(summary ?? undefined)
  const label = labelOf(row.hasQuote, summary ?? undefined)
  const style = LABEL_STYLE[label]
  const buyerName = row.buyerName ?? t('defaultBuyerName')
  const hasSales = !!summary && summary.delivered > 0
  const dateFmt = { day: 'numeric', month: 'short', year: 'numeric' } as const

  return (
    <div style={{ ...cardStyle, padding: 16, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: BRAND.blue, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {row.buyerAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.buyerAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : buyerName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-h4)', fontWeight: 700, color: '#131A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{buyerName}</div>
          <span style={{ display: 'inline-block', marginTop: 4, background: style.bg, color: style.color, fontSize: 'var(--text-badge)', fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>
            {t(LABEL_TEXT_KEY[label])}
          </span>
        </div>
        <button type="button" onClick={onClose} className="inbox-close" aria-label={t('messagesClose')} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#667085', padding: 4 }}>×</button>
      </div>

      {hasSales ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          <Stat label={t('messagesStatPedidos')} value={String(summary!.orders)} />
          <Stat label={t('messagesStatCompletadas')} value={String(summary!.delivered)} />
          <Stat label={t('messagesStatUltima')} value={summary!.lastDeliveredAt ? formatDate(summary!.lastDeliveredAt, language, dateFmt) : '—'} />
          <Stat label={t('messagesStatTotal')} value={formatPrice(summary!.deliveredAmount)} wide />
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: '#667085' }}>{t('messagesNoSales')}</p>
      )}

      {row.quote && (
        <div style={{ border: '1px solid #DCE8FB', background: '#F5F9FF', borderRadius: 10, padding: 12, display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 'var(--text-badge)', fontWeight: 700, color: '#0B5FC6', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('messagesQuoteCardTitle')}</div>
          <div style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: '#131A18' }}>{row.quote.productName}</div>
          <div style={{ fontSize: 'var(--text-caption)', color: '#475467' }}>
            {t('messagesQuoteQty', { quantity: row.quote.quantity })} · {t(QUOTE_STATUS_LABEL[row.quote.status as keyof typeof QUOTE_STATUS_LABEL] ?? 'messagesQuoteStatusRequested')}
          </div>
          {!inChat && (
            <a href={`/mensajes/${row.id}`} style={{ justifySelf: 'start', background: 'var(--dashboard-blue)', color: '#fff', textDecoration: 'none', padding: '7px 12px', borderRadius: 8, fontSize: 'var(--text-caption)', fontWeight: 600 }}>
              {t('messagesRespondQuote')}
            </a>
          )}
        </div>
      )}

      {summary?.inProgressOrder && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <span style={{ fontSize: 'var(--text-caption)', color: '#92400E', fontWeight: 600 }}>
            {t('messagesCurrentOrder')} {shortOrderId(summary.inProgressOrder.orderId)}
          </span>
          <a href={`/dashboard/pedidos?order=${summary.inProgressOrder.orderId}`} style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--dashboard-blue)', textDecoration: 'none' }}>
            {t('messagesViewOrder')} →
          </a>
        </div>
      )}

      <div>
        <div style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: '#131A18', marginBottom: 6 }}>{t('messagesHistory')}</div>
        {summary && summary.history.length > 0 ? (
          <div style={{ display: 'grid' }}>
            {summary.history.map((h, idx) => (
              <div key={h.orderId} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8, padding: '8px 0', borderTop: idx > 0 ? '1px solid #F2F4F7' : 'none', alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--dashboard-blue)' }}>{shortOrderId(h.orderId)} · {formatDate(h.createdAt, language, dateFmt)}</div>
                  <div style={{ fontSize: 'var(--text-badge)', color: '#475467', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.productNames.join(', ')}</div>
                  <div style={{ fontSize: 'var(--text-badge)', color: '#667085' }}>{t(ORDER_STATUS_LABEL[h.status as keyof typeof ORDER_STATUS_LABEL] ?? 'incomeStatusPending')} · {formatPrice(h.amount)}</div>
                </div>
                <a href={`/dashboard/pedidos?order=${h.orderId}`} style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--dashboard-blue)', textDecoration: 'none', whiteSpace: 'nowrap' }}>{t('messagesViewOrder')}</a>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: '#667085' }}>{t('messagesNoHistory')}</p>
        )}
      </div>

      {(!inChat || relation !== 'contact') && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #EEF2F6', paddingTop: 12 }}>
          {!inChat && (
            <a href={`/mensajes/${row.id}`} style={{ background: 'var(--dashboard-blue)', color: '#fff', textDecoration: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 'var(--text-caption)', fontWeight: 600 }}>{t('messagesOpenChat')}</a>
          )}
          {relation !== 'contact' && (
            <a href={`/dashboard/pedidos?buyer=${row.buyerId}`} style={{ border: '1px solid #D0D5DD', color: '#344054', textDecoration: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 'var(--text-caption)', fontWeight: 600 }}>{t('messagesViewOrders')}</a>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div style={{ background: '#F7F9FB', borderRadius: 10, padding: '8px 10px', gridColumn: wide ? '1 / -1' : undefined, minWidth: 0 }}>
      <div style={{ fontSize: 'var(--text-badge)', color: '#818F98', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</div>
      <div style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: '#131A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}
