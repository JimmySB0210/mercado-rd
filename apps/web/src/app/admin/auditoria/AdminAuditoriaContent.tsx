'use client'
// ============================================================
// MercadoRD — Contenido traducido de /admin/auditoria
// Ruta: src/app/admin/auditoria/AdminAuditoriaContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase) y no
// puede usar useTranslation. Este componente recibe los logs ya
// resueltos como props y se encarga de todo el texto traducido.
// Vista de solo lectura — sin ninguna acción de escritura.
// ============================================================

import { Suspense } from 'react'
import { AuditLogFilters } from '@/components/admin/AuditLogFilters'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import type { AuditLogRow } from '@/lib/queries/admin'

interface Props {
  logs: AuditLogRow[]
  eventTypes: string[]
}

export function AdminAuditoriaContent({ logs, eventTypes }: Props) {
  const { t, language } = useTranslation('admin')

  return (
    <div style={{ padding: 28, background: '#f5f5f5' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{t('auditPageTitle')}</h1>
        <p style={{ color: '#666', fontSize: 14 }}>{t('auditPageSubtitle')}</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>{t('auditTableTitle', { count: logs.length })}</div>
          <Suspense fallback={null}>
            <AuditLogFilters eventTypes={eventTypes} />
          </Suspense>
        </div>

        {logs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: '#999' }}>
            {t('noAuditLogsMatchFilters')}
          </div>
        ) : (
          <div style={{ maxHeight: 720, overflowY: 'auto' }}>
            {logs.map(log => (
              <div key={log.id} style={{ padding: '12px 18px', borderBottom: '1px solid #f8f8f8', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#999' }}>
                      {formatDate(log.created_at, language, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: '#EAF1FC', color: '#1e3a8a', fontFamily: 'monospace',
                    }}>
                      {log.event_type}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: '#666' }}>
                    {t('auditActorLabel')} <strong>{log.actor_name ?? (log.actor_id ? t('unknownActorFallback') : t('systemActorFallback'))}</strong>
                  </span>
                </div>

                <div style={{ fontSize: 12, color: '#666' }}>
                  {t('auditTargetLabel')}{' '}
                  {log.target_type || log.target_id
                    ? <span style={{ fontFamily: 'monospace' }}>{log.target_type ?? '—'} · {log.target_id ?? '—'}</span>
                    : '—'}
                </div>

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <details>
                    <summary style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer' }}>{t('auditMetadataLabel')}</summary>
                    <pre style={{
                      fontSize: 11, background: '#f8f8f8', padding: 10, borderRadius: 6, marginTop: 6,
                      overflowX: 'auto', color: '#333',
                    }}>
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
