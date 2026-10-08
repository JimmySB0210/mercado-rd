'use client'
// ============================================================
// MercadoRD — Bandeja de mensajes del vendedor
// Ruta: src/app/dashboard/mensajes/MensajesContent.tsx
// ============================================================
// Una sola bandeja para todos los vendedores. El contexto (proveedor o
// minorista) solo cambia el orden de las pestañas y dónde está la
// cotización. El chat real sigue en /mensajes/[id]: aquí se abre desde
// "Abrir chat". Seleccionar una fila solo muestra el panel del cliente
// (no marca nada como leído).
// Sin acciones de oferta, cupón ni recomendación: no hay backend para
// eso todavía (ver el plan del cambio).
// ============================================================

import { useMemo, useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { BRAND } from '@/lib/colors'
import { countTabs, labelOf, matchesTab, type InboxLabel, type InboxTab } from '@/lib/inboxClassification'
import {
  CustomerPanel, LABEL_STYLE, LABEL_TEXT_KEY, ORDER_STATUS_LABEL, cardStyle, shortOrderId,
  type CustomerPanelData,
} from '@/components/messages/CustomerPanel'

export interface InboxRow extends CustomerPanelData {
  last_message: string | null
  last_message_at: string
  vendor_unread: number
}

export function MensajesContent({ rows, supplierContext }: { rows: InboxRow[]; supplierContext: boolean }) {
  const { t, language } = useTranslation('dashboard')
  const [tab, setTab] = useState<InboxTab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)

  const flags = useMemo(() => rows.map(r => ({ unread: r.vendor_unread, hasQuote: r.hasQuote, summary: r.summary ?? undefined })), [rows])
  const counts = useMemo(() => countTabs(flags), [flags])

  // Proveedor: cotizaciones primero. Minorista: cotizaciones solo si hay alguna.
  const tabs: InboxTab[] = supplierContext
    ? ['all', 'unread', 'clients', 'quotes', 'orders']
    : ['all', 'unread', 'clients', 'orders', ...(counts.quotes > 0 ? ['quotes' as InboxTab] : [])]

  const visibleRows = useMemo(
    () => rows.filter(r => matchesTab(tab, { unread: r.vendor_unread, hasQuote: r.hasQuote, summary: r.summary ?? undefined })),
    [rows, tab],
  )

  const selected = rows.find(r => r.id === selectedId) ?? null

  const timeAgo = (dateStr: string): string => {
    const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (minutes < 1) return t('justNow')
    if (minutes < 60) return t('minutesAgo', { count: minutes })
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return t('hoursAgo', { count: hours })
    const days = Math.floor(hours / 24)
    if (days < 7) return t('daysAgo', { count: days })
    return formatDate(dateStr, language, { day: 'numeric', month: 'short' })
  }

  const tabLabel = (key: InboxTab): string => ({
    all: t('messagesTabAll'),
    unread: t('messagesTabUnread'),
    clients: t('messagesTabClients'),
    orders: t('messagesTabOrders'),
    quotes: t('messagesTabQuotes'),
  })[key]

  const labelText = (label: InboxLabel): string => t(LABEL_TEXT_KEY[label])

  const openPanel = (id: string) => {
    setSelectedId(id)
    setMobilePanelOpen(true)
  }

  return (
    <main style={{ padding: 24, background: '#F7F9FB', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-dash-title)', fontWeight: 700, lineHeight: 'var(--leading-h1)', color: '#131A18', margin: 0 }}>{t('messagesPageTitle')}</h1>
          <p style={{ color: '#667085', fontSize: 'var(--text-ui)', margin: '4px 0 0' }}>{t('messagesPageSub')}</p>
        </div>
        <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--dashboard-blue)', background: '#EAF3FF', padding: '5px 10px', borderRadius: 999 }}>
          {supplierContext ? t('messagesContextSupplier') : t('messagesContextRetail')}
        </span>
      </div>

      {rows.length === 0 ? (
        <div style={{ ...cardStyle, padding: 28, maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#667085', fontSize: 'var(--text-small)', margin: 0 }}>{t('noMessagesYet')}</p>
        </div>
      ) : (
        <>
          <div className="scroll-hide-x" style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {tabs.map(key => {
              const active = tab === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  aria-pressed={active}
                  style={{
                    flexShrink: 0, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit',
                    padding: '6px 12px', borderRadius: 999, fontSize: 'var(--text-caption)', fontWeight: 600,
                    border: active ? '1px solid var(--dashboard-blue)' : '1px solid #E5E7EB',
                    background: active ? 'var(--dashboard-blue)' : '#fff',
                    color: active ? '#fff' : '#344054',
                  }}
                >
                  {tabLabel(key)} ({counts[key]})
                </button>
              )
            })}
          </div>

          <div className="inbox-layout" style={{ display: 'grid', gap: 12, alignItems: 'start' }}>
            <section style={{ ...cardStyle, overflow: 'hidden', minWidth: 0 }}>
              {visibleRows.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#667085', fontSize: 'var(--text-caption)' }}>{t('messagesEmptyTab')}</div>
              ) : (
                visibleRows.map((r, idx) => {
                  const label = labelOf(r.hasQuote, r.summary ?? undefined)
                  const style = LABEL_STYLE[label]
                  const buyerName = r.buyerName ?? t('defaultBuyerName')
                  const isSelected = r.id === selectedId
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => openPanel(r.id)}
                      aria-current={isSelected ? 'true' : undefined}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', textAlign: 'left',
                        border: 'none', borderBottom: idx < visibleRows.length - 1 ? '1px solid #F2F4F7' : 'none',
                        background: isSelected ? '#F5F9FF' : '#fff', cursor: 'pointer', fontFamily: 'inherit', minWidth: 0,
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: BRAND.blue, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {r.buyerAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.buyerAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : buyerName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: '#131A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{buyerName}</span>
                          <span style={{ fontSize: 'var(--text-badge)', color: '#818F98', flexShrink: 0 }}>{timeAgo(r.last_message_at)}</span>
                        </div>
                        <p style={{ fontSize: 'var(--text-caption)', color: '#667085', margin: '2px 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.last_message ?? t('noMessagesInConvo')}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
                          <span style={{ background: style.bg, color: style.color, fontSize: 'var(--text-badge)', fontWeight: 600, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>{labelText(label)}</span>
                          {r.quote && (
                            <span style={{ fontSize: 'var(--text-badge)', color: '#475467', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t('messagesQuoteLine', { quantity: r.quote.quantity, product: r.quote.productName })}
                            </span>
                          )}
                          {!r.quote && r.summary?.inProgressOrder && (
                            <span style={{ fontSize: 'var(--text-badge)', color: '#475467', whiteSpace: 'nowrap' }}>
                              {shortOrderId(r.summary.inProgressOrder.orderId)} · {t(ORDER_STATUS_LABEL[r.summary.inProgressOrder.status as keyof typeof ORDER_STATUS_LABEL] ?? 'incomeStatusPending')}
                            </span>
                          )}
                        </div>
                      </div>
                      {r.vendor_unread > 0 && (
                        <span style={{ background: BRAND.red, color: '#fff', borderRadius: 999, minWidth: 20, height: 20, padding: '0 6px', fontSize: 'var(--text-badge)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {r.vendor_unread > 9 ? '9+' : r.vendor_unread}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </section>

            <aside className={`inbox-panel${mobilePanelOpen ? ' open' : ''}`} style={{ minWidth: 0 }}>
              {selected ? (
                <CustomerPanel row={selected} onClose={() => setMobilePanelOpen(false)} />
              ) : (
                <div style={{ ...cardStyle, padding: 24, textAlign: 'center', color: '#667085', fontSize: 'var(--text-caption)' }}>{t('messagesSelectPrompt')}</div>
              )}
            </aside>
          </div>
        </>
      )}

    </main>
  )
}
