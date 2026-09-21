'use client'
// ============================================================
// MercadoRD — Crear / editar artículo del Centro de ayuda (admin)
// Ruta: src/components/admin/HelpArticleForm.tsx
// ============================================================
// Componente compartido entre los modos 'crear' y 'editar', mismo
// patrón que PromoBannerForm.
//
// help_articles no tiene triggers: nadie actualiza updated_at salvo
// este código, así que el modo editar lo manda en cada guardado.
//
// En modo editar NO se manda is_published (se cambia con el botón
// Publicar/Despublicar de la lista) y sort_order solo si la persona lo
// tocó o cambió de categoría — así un cambio hecho desde la lista
// mientras este formulario estaba abierto nunca se pisa con un valor
// viejo.
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'
import { HELP_CATEGORIES, KNOWN_HELP_CATEGORY_SLUGS, SLUG_PATTERN, slugify } from '@/lib/helpCenter'
import type { HelpArticle } from '@/types/database.types'

interface Props {
  mode: 'crear' | 'editar'
  articles: HelpArticle[]
  initialData?: HelpArticle
  onSaved: (article: HelpArticle, wasEditing: boolean) => void
  onCancel?: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff',
}
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }
const hintStyle: React.CSSProperties = { fontSize: 11, color: '#999', margin: '6px 0 0' }

export function HelpArticleForm({ mode, articles, initialData, onSaved, onCancel }: Props) {
  const supabase = createClient()
  const { t } = useTranslation('admin')
  const { t: ts } = useTranslation('support')

  // Posición al final de la categoría (1 si está vacía) — los órdenes
  // existentes en la base van de 1 en adelante dentro de cada categoría.
  const nextOrderFor = (category: string) => {
    const orders = articles.filter(a => a.category === category).map(a => a.sort_order)
    return orders.length > 0 ? Math.max(...orders) + 1 : 1
  }
  // Orden que se propone al elegir una categoría: en editar, su propio
  // orden si vuelve a la categoría original; si no, el final de la elegida.
  const suggestedOrder = (category: string) =>
    mode === 'editar' && initialData && category === initialData.category
      ? initialData.sort_order
      : nextOrderFor(category)

  const [category, setCategory] = useState(initialData?.category ?? HELP_CATEGORIES[0].slug)
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  // En crear, el slug sigue al título hasta que la persona lo edita a mano
  // (si lo vacía del todo, vuelve a seguirlo)
  const [slugTouched, setSlugTouched] = useState(mode === 'editar')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [order, setOrder] = useState(String(initialData?.sort_order ?? nextOrderFor(HELP_CATEGORIES[0].slug)))
  const [orderTouched, setOrderTouched] = useState(false)
  const [published, setPublished] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Categoría desconocida (texto libre en la base): se conserva como opción
  // para que abrir el artículo no la cambie sin querer al guardar.
  const categoryOptions = [
    ...HELP_CATEGORIES.map(c => ({ value: c.slug, label: `${c.emoji} ${ts(c.labelKey)}` })),
    ...(initialData && !KNOWN_HELP_CATEGORY_SLUGS.includes(initialData.category)
      ? [{ value: initialData.category, label: initialData.category }]
      : []),
  ]

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    if (!orderTouched) setOrder(String(suggestedOrder(value)))
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  const resetForm = (nextOrder: number) => {
    setTitle('')
    setSlug('')
    setSlugTouched(false)
    setContent('')
    setOrder(String(nextOrder))
    setOrderTouched(false)
    setPublished(true)
  }

  const failure = (err: { code?: string } | null, fallback: string) =>
    err?.code === '23505' ? t('helpSlugTaken') : fallback

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanTitle = title.trim()
    const cleanSlug = slug.trim()
    const cleanContent = content.replace(/\r\n/g, '\n').trim()

    if (!cleanTitle) return setError(t('helpTitleRequired'))
    if (!cleanContent) return setError(t('helpContentRequired'))
    if (!SLUG_PATTERN.test(cleanSlug)) return setError(t('helpSlugInvalid'))

    const parsedOrder = Number.parseInt(order, 10)
    const sortOrder = Number.isFinite(parsedOrder) && parsedOrder >= 0 ? parsedOrder : nextOrderFor(category)

    setSaving(true)
    setError(null)

    if (mode === 'editar' && initialData) {
      const categoryChanged = category !== initialData.category
      const payload = {
        category,
        slug: cleanSlug,
        title: cleanTitle,
        content: cleanContent,
        updated_at: new Date().toISOString(),
        ...(orderTouched || categoryChanged ? { sort_order: sortOrder } : {}),
      }

      const { data: updated, error: updateError } = await supabase
        .from('help_articles')
        .update(payload)
        .eq('id', initialData.id)
        .select()
        .single()

      setSaving(false)

      if (updateError || !updated) {
        console.error('[HelpArticleForm] update', updateError)
        setError(failure(updateError, t('helpSaveFailed')))
        return
      }

      onSaved(updated as HelpArticle, true)
      return
    }

    const { data: inserted, error: insertError } = await supabase
      .from('help_articles')
      .insert({
        category,
        slug: cleanSlug,
        title: cleanTitle,
        content: cleanContent,
        sort_order: sortOrder,
        is_published: published,
      })
      .select()
      .single()

    setSaving(false)

    if (insertError || !inserted) {
      console.error('[HelpArticleForm] insert', insertError)
      setError(failure(insertError, t('helpCreateFailed')))
      return
    }

    onSaved(inserted as HelpArticle, false)
    resetForm(sortOrder + 1)
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ padding: 18, display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 12 }}>
        <div>
          <label htmlFor="help-category" style={labelStyle}>{t('helpCategoryFieldLabel')}</label>
          <select
            id="help-category"
            value={category}
            onChange={e => handleCategoryChange(e.target.value)}
            style={inputStyle}
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="help-order" style={labelStyle}>{t('helpOrderFieldLabel')}</label>
          <input
            id="help-order"
            type="number"
            min="0"
            value={order}
            onChange={e => { setOrder(e.target.value); setOrderTouched(true) }}
            style={inputStyle}
          />
        </div>
      </div>
      <p style={{ ...hintStyle, margin: '-6px 0 0' }}>{t('helpOrderHint')}</p>

      <div>
        <label htmlFor="help-title" style={labelStyle}>{t('helpTitleFieldLabel')}</label>
        <input
          id="help-title"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder={t('helpTitlePlaceholder')}
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="help-slug" style={labelStyle}>{t('helpSlugFieldLabel')}</label>
        <input
          id="help-slug"
          value={slug}
          onChange={e => { setSlug(e.target.value); setSlugTouched(e.target.value.trim() !== '') }}
          spellCheck={false}
          autoCapitalize="none"
          style={{ ...inputStyle, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
        />
        <p style={hintStyle}>{t('helpSlugHint')}</p>
      </div>

      <div>
        <label htmlFor="help-content" style={labelStyle}>{t('helpContentFieldLabel')}</label>
        <textarea
          id="help-content"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={t('helpContentPlaceholder')}
          rows={10}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
        />
        <p style={hintStyle}>{t('helpContentHint')}</p>
      </div>

      {mode === 'crear' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#333', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={published}
            onChange={e => setPublished(e.target.checked)}
          />
          {t('helpPublishedFieldLabel')}
        </label>
      )}

      {error && <p role="alert" style={{ fontSize: 12, color: BRAND.red, margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            background: BRAND.blue, color: '#fff', border: 'none',
            padding: '9px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? t('savingButton') : mode === 'editar' ? t('saveChangesButton') : t('helpAddArticleButton')}
        </button>
        {mode === 'editar' && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{
              background: '#fff', color: '#666', border: '1px solid #ddd',
              padding: '9px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {t('cancelButton')}
          </button>
        )}
      </div>
    </form>
  )
}
