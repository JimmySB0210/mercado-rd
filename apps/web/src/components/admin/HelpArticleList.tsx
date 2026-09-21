'use client'
// ============================================================
// MercadoRD — Lista de artículos del Centro de ayuda (admin)
// Ruta: src/components/admin/HelpArticleList.tsx
// ============================================================
// Mismo patrón que PromoBannerList: subir/bajar, activar/desactivar y
// editar en la fila. A diferencia de los banners NO hay "eliminar":
// despublicar oculta el artículo del sitio sin borrar su contenido.
//
// Toda escritura pide .select('id') y verifica que devolvió la fila: si
// la RLS rechaza el UPDATE (no eres admin) Postgres no da error, solo
// afecta 0 filas — sin este chequeo la UI mostraría un cambio que en la
// base nunca ocurrió.
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'
import { compareHelpArticles, groupHelpArticles } from '@/lib/helpCenter'
import type { HelpArticle } from '@/types/database.types'

interface Props {
  articles: HelpArticle[]
  setArticles: React.Dispatch<React.SetStateAction<HelpArticle[]>>
  // 'all' o el slug de una categoría
  filter: string
  onEdit: (article: HelpArticle) => void
  onReload: () => Promise<void>
  onError: (message: string) => void
}

export function HelpArticleList({ articles, setArticles, filter, onEdit, onReload, onError }: Props) {
  const supabase = createClient()
  const { t } = useTranslation('admin')
  const { t: ts } = useTranslation('support')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const groups = groupHelpArticles(articles).filter(g => filter === 'all' || g.slug === filter)

  const move = async (article: HelpArticle, direction: -1 | 1) => {
    const group = articles.filter(a => a.category === article.category).sort(compareHelpArticles)
    const index = group.findIndex(a => a.id === article.id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= group.length) return

    const reordered = [...group]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]

    // Renumera 1..n dentro de la categoría. Normalmente solo cambian las
    // dos filas movidas; si había órdenes repetidos, esto también los desempata.
    const current = new Map(articles.map(a => [a.id, a.sort_order]))
    const changes = reordered
      .map((a, i) => ({ id: a.id, sort_order: i + 1 }))
      .filter(c => c.sort_order !== current.get(c.id))

    setLoadingId(article.id)
    const results = await Promise.all(
      changes.map(c =>
        supabase.from('help_articles').update({ sort_order: c.sort_order }).eq('id', c.id).select('id')
      )
    )
    setLoadingId(null)

    const failed = results.find(r => r.error || (r.data?.length ?? 0) === 0)
    if (failed) {
      console.error('[HelpArticleList] move', failed.error)
      onError(t('helpMoveFailed'))
      // Un cambio pudo aplicarse y el otro no: se vuelve a leer la verdad
      await onReload()
      return
    }

    setArticles(prev =>
      prev.map(a => {
        const change = changes.find(c => c.id === a.id)
        return change ? { ...a, sort_order: change.sort_order } : a
      })
    )
  }

  const togglePublished = async (article: HelpArticle) => {
    setLoadingId(article.id)
    const updatedAt = new Date().toISOString()
    const { data, error } = await supabase
      .from('help_articles')
      .update({ is_published: !article.is_published, updated_at: updatedAt })
      .eq('id', article.id)
      .select('id')
    setLoadingId(null)

    if (error || !data || data.length === 0) {
      console.error('[HelpArticleList] toggle', error)
      onError(t('helpToggleFailed'))
      return
    }
    setArticles(prev =>
      prev.map(a => (a.id === article.id ? { ...a, is_published: !a.is_published, updated_at: updatedAt } : a))
    )
  }

  if (articles.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#999' }}>
        {t('helpNoArticlesYet')}
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#999' }}>
        {t('helpNoArticlesInCategory')}
      </div>
    )
  }

  const busy = loadingId !== null

  return (
    <div>
      {groups.map(group => (
        <div key={group.slug} data-category={group.slug}>
          {/* Cabecera de categoría */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px',
              background: '#fafafa', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0',
              fontSize: 12, fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: 0.4,
            }}
          >
            <span aria-hidden="true">{group.config?.emoji ?? '📄'}</span>
            <span>{group.config ? ts(group.config.labelKey) : group.slug}</span>
            <span style={{ fontWeight: 500, color: '#999' }}>({group.articles.length})</span>
          </div>

          {group.articles.map((article, i) => (
            <div
              key={article.id}
              data-article-slug={article.slug}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
                borderBottom: '1px solid #f0f0f0',
                background: article.is_published ? '#fff' : '#fcfcfc',
                opacity: loadingId === article.id ? 0.5 : 1,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 220 }}>
                <div
                  title={article.title}
                  style={{
                    fontSize: 13, fontWeight: 700, color: article.is_published ? '#111' : '#888',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {article.title}
                </div>
                <div style={{ fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{ flexShrink: 0 }}>{t('orderLabel', { order: article.sort_order })}</span>
                  <span style={{ flexShrink: 0 }}>·</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                    /{article.slug}
                  </span>
                  {article.is_published && (
                    <>
                      <span style={{ flexShrink: 0 }}>·</span>
                      <a
                        href={`/centro-ayuda#${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: BRAND.blue, flexShrink: 0 }}
                      >
                        {t('helpViewOnSiteLink')}
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Agrupados para que, si no caben en una línea, bajen juntos a
                  una segunda fila en vez de empujarse fuera del contenedor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  data-status={article.is_published ? 'published' : 'unpublished'}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 10, flexShrink: 0,
                    background: article.is_published ? '#DCFCE7' : '#F3F4F6',
                    color: article.is_published ? '#166534' : '#666',
                  }}
                >
                  {article.is_published ? t('helpPublishedBadge') : t('helpUnpublishedBadge')}
                </span>

                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => move(article, -1)}
                    disabled={i === 0 || busy}
                    title={t('moveUpTitle')}
                    aria-label={t('moveUpTitle')}
                    style={{ width: 26, height: 26, border: '1px solid #e5e5e5', borderRadius: 6, background: '#fff', cursor: i === 0 || busy ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.4 : 1, fontSize: 12 }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(article, 1)}
                    disabled={i === group.articles.length - 1 || busy}
                    title={t('moveDownTitle')}
                    aria-label={t('moveDownTitle')}
                    style={{ width: 26, height: 26, border: '1px solid #e5e5e5', borderRadius: 6, background: '#fff', cursor: i === group.articles.length - 1 || busy ? 'not-allowed' : 'pointer', opacity: i === group.articles.length - 1 ? 0.4 : 1, fontSize: 12 }}
                  >
                    ↓
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => togglePublished(article)}
                  disabled={busy}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 6, flexShrink: 0,
                    background: article.is_published ? '#fff' : BRAND.blue,
                    color: article.is_published ? '#666' : '#fff',
                    border: article.is_published ? '1px solid #ddd' : 'none',
                    cursor: busy ? 'not-allowed' : 'pointer',
                  }}
                >
                  {article.is_published ? t('helpUnpublishButton') : t('helpPublishButton')}
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(article)}
                  disabled={busy}
                  style={{ fontSize: 11, fontWeight: 700, color: BRAND.blue, background: 'transparent', border: 'none', cursor: busy ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                >
                  {t('editButton')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
