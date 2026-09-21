'use client'
// ============================================================
// MercadoRD — Estado compartido: lista + formulario de artículos de ayuda
// Ruta: src/components/admin/HelpArticleManager.tsx
// ============================================================
// Vive en app/admin/centro-ayuda/page.tsx. Coordina HelpArticleList y
// HelpArticleForm (mismo patrón que PromoBannerManager): al pulsar
// "Editar" en una fila, el formulario cambia a modo 'editar' precargado
// con ese artículo.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'
import { HELP_CATEGORIES, KNOWN_HELP_CATEGORY_SLUGS } from '@/lib/helpCenter'
import { HelpArticleList } from './HelpArticleList'
import { HelpArticleForm } from './HelpArticleForm'
import type { HelpArticle } from '@/types/database.types'

interface Props {
  initialArticles: HelpArticle[]
}

interface Notice {
  kind: 'ok' | 'error'
  text: string
}

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20,
}
const cardHeaderStyle: React.CSSProperties = {
  padding: '14px 18px', borderBottom: '1px solid #f0f0f0', fontWeight: 800, fontSize: 15,
}

export function HelpArticleManager({ initialArticles }: Props) {
  const { t } = useTranslation('admin')
  const { t: ts } = useTranslation('support')
  const [articles, setArticles] = useState(initialArticles)
  // Se guarda el id (no el objeto) para que el formulario siempre parta de
  // la versión más reciente del artículo en la lista
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [notice, setNotice] = useState<Notice | null>(null)
  const formCardRef = useRef<HTMLDivElement>(null)

  const editing = editingId ? articles.find(a => a.id === editingId) ?? null : null

  // Los avisos se apagan solos
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  // El formulario vive debajo de la lista: al editar una fila, llevarlo a la vista
  useEffect(() => {
    if (editingId) formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [editingId])

  const reload = async () => {
    const { data, error } = await createClient().from('help_articles').select('*')
    if (error || !data) {
      console.error('[HelpArticleManager] reload', error)
      return
    }
    setArticles(data as HelpArticle[])
  }

  const handleSaved = (saved: HelpArticle, wasEditing: boolean) => {
    setArticles(prev =>
      prev.some(a => a.id === saved.id) ? prev.map(a => (a.id === saved.id ? saved : a)) : [...prev, saved]
    )
    setEditingId(null)
    setNotice({ kind: 'ok', text: wasEditing ? t('helpSavedNotice') : t('helpCreatedNotice') })
  }

  // Chips de filtro: las 9 conocidas + cualquier categoría desconocida que exista
  const unknownCategories = Array.from(new Set(articles.map(a => a.category)))
    .filter(c => !KNOWN_HELP_CATEGORY_SLUGS.includes(c))
  const countFor = (slug: string) => articles.filter(a => a.category === slug).length

  const chips = [
    { slug: 'all', label: t('helpAllCategoriesFilter'), count: articles.length },
    ...HELP_CATEGORIES.map(c => ({ slug: c.slug, label: `${c.emoji} ${ts(c.labelKey)}`, count: countFor(c.slug) })),
    ...unknownCategories.map(c => ({ slug: c, label: `📄 ${c}`, count: countFor(c) })),
  ]

  return (
    <>
      {notice && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16,
            background: notice.kind === 'ok' ? '#DCFCE7' : '#FEE2E2',
            color: notice.kind === 'ok' ? '#166534' : '#991B1B',
          }}
        >
          {notice.text}
        </div>
      )}

      <div style={cardStyle}>
        <div style={cardHeaderStyle}>{t('helpArticlesTitle', { count: articles.length })}</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 18px', borderBottom: '1px solid #f0f0f0' }}>
          {chips.map(chip => {
            const active = filter === chip.slug
            return (
              <button
                key={chip.slug}
                type="button"
                onClick={() => setFilter(chip.slug)}
                aria-pressed={active}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 999,
                  border: active ? `1px solid ${BRAND.blue}` : '1px solid #e5e5e5',
                  background: active ? BRAND.blue : '#fff',
                  color: active ? '#fff' : '#555',
                  cursor: 'pointer',
                }}
              >
                {chip.label} <span style={{ opacity: 0.7, fontWeight: 500 }}>{chip.count}</span>
              </button>
            )
          })}
        </div>

        <HelpArticleList
          articles={articles}
          setArticles={setArticles}
          filter={filter}
          onEdit={article => setEditingId(article.id)}
          onReload={reload}
          onError={text => setNotice({ kind: 'error', text })}
        />
      </div>

      <div ref={formCardRef} style={cardStyle}>
        <div style={cardHeaderStyle}>
          {editing ? t('helpEditArticleTitle') : t('helpCreateArticleTitle')}
        </div>
        {/* key fuerza remount al cambiar de artículo editado (o volver a "crear"),
            así el formulario siempre arranca con el estado inicial correcto */}
        <HelpArticleForm
          key={editing?.id ?? 'new'}
          mode={editing ? 'editar' : 'crear'}
          articles={articles}
          initialData={editing ?? undefined}
          onSaved={handleSaved}
          onCancel={() => setEditingId(null)}
        />
      </div>
    </>
  )
}
