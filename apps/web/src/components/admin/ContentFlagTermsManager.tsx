'use client'
// ============================================================
// MercadoRD — Lista editable de content_flag_terms (admin)
// Ruta: src/components/admin/ContentFlagTermsManager.tsx
// ============================================================
// Agregar/quitar términos libremente — no hay un set fijo de
// categorías, category es texto libre opcional. Mismo patrón de
// lista+formulario que PromoBannerList/PromoBannerForm.
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'
import type { ContentFlagTerm } from '@/types/database.types'

interface Props {
  initialTerms: ContentFlagTerm[]
}

export function ContentFlagTermsManager({ initialTerms }: Props) {
  const supabase = createClient()
  const { t } = useTranslation('admin')

  const [terms, setTerms] = useState(initialTerms)
  const [termInput, setTermInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const termTrimmed = termInput.trim()
    if (!termTrimmed) {
      setError(t('termRequiredError'))
      return
    }

    setError(null)
    setSaving(true)

    const { data, error: insertError } = await supabase
      .from('content_flag_terms')
      .insert({ term: termTrimmed, category: categoryInput.trim() || null })
      .select()
      .single()

    setSaving(false)

    if (insertError || !data) {
      console.error('[ContentFlagTermsManager] add', insertError)
      setError(t('addTermFailed'))
      return
    }

    setTerms(prev => [...prev, data].sort((a, b) => a.term.localeCompare(b.term)))
    setTermInput('')
    setCategoryInput('')
  }

  const handleDelete = async (term: ContentFlagTerm) => {
    const confirmed = window.confirm(t('deleteTermConfirm', { term: term.term }))
    if (!confirmed) return

    setDeletingId(term.id)
    const { error: deleteError } = await supabase.from('content_flag_terms').delete().eq('id', term.id)
    setDeletingId(null)

    if (deleteError) {
      console.error('[ContentFlagTermsManager] delete', deleteError)
      return
    }
    setTerms(prev => prev.filter(x => x.id !== term.id))
  }

  return (
    <div>
      {terms.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#999' }}>
          {t('noFlagTermsYet')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 18 }}>
          {terms.map(term => (
            <span
              key={term.id}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#F3F4F6', color: '#333', fontSize: 12, fontWeight: 600,
                padding: '5px 6px 5px 12px', borderRadius: 16,
                opacity: deletingId === term.id ? 0.5 : 1,
              }}
            >
              {term.term}
              {term.category && <span style={{ color: '#999', fontWeight: 400 }}>· {term.category}</span>}
              <button
                type="button"
                onClick={() => handleDelete(term)}
                disabled={deletingId !== null}
                style={{
                  width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#e5e5e5',
                  color: '#666', fontSize: 11, lineHeight: 1, cursor: deletingId !== null ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, padding: '14px 18px', borderTop: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={termInput}
          onChange={e => setTermInput(e.target.value)}
          placeholder={t('flagTermPlaceholder')}
          style={{ flex: 2, minWidth: 160, border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
        />
        <input
          type="text"
          value={categoryInput}
          onChange={e => setCategoryInput(e.target.value)}
          placeholder={t('flagCategoryPlaceholder')}
          style={{ flex: 1, minWidth: 140, border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            background: BRAND.blue, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px',
            fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? t('savingButton') : t('addTermButton')}
        </button>
      </form>
      {error && <p style={{ fontSize: 12, color: BRAND.red, padding: '0 18px 14px' }}>{error}</p>}
    </div>
  )
}
