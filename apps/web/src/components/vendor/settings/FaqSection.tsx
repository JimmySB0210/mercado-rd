'use client'
// ============================================================
// MercadoRD — Configuración, sección: Preguntas frecuentes
// Ruta: src/components/vendor/settings/FaqSection.tsx
// ============================================================
// Cada fila hace su propio insert/update/delete contra Supabase
// directo (RLS ya restringe a vendor_faqs del propio vendor) — mismo
// patrón que PricingTiersSection.tsx, no el de "guardar todo junto"
// que usan Servicios/Categorías.
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { SectionCard } from './SectionCard'

interface Props {
  vendorId: string
  categoryIds: number[]
}

interface FaqRow {
  id: string
  question: string
  answer: string
  is_active: boolean
}

interface SuggestedRow {
  id: string
  suggested_question: string
}

export function FaqSection({ vendorId, categoryIds }: Props) {
  const { t } = useTranslation('dashboard')
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [suggested, setSuggested] = useState<SuggestedRow[]>([])
  const [faqs, setFaqs] = useState<FaqRow[]>([])

  const [addingSuggestedId, setAddingSuggestedId] = useState<string | null>(null)
  const [answerDraft, setAnswerDraft] = useState('')

  const [addingCustom, setAddingCustom] = useState(false)
  const [customQuestion, setCustomQuestion] = useState('')
  const [customAnswer, setCustomAnswer] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      categoryIds.length > 0
        ? supabase.from('faq_category_templates').select('id, suggested_question').in('category_id', categoryIds).order('sort_order', { ascending: true })
        : Promise.resolve({ data: [] as SuggestedRow[] }),
      supabase.from('vendor_faqs').select('id, question, answer, is_active').eq('vendor_id', vendorId).order('is_active', { ascending: false }).order('sort_order', { ascending: true }),
    ]).then(([suggestedRes, faqsRes]) => {
      if (cancelled) return
      setSuggested(suggestedRes.data ?? [])
      setFaqs(faqsRes.data ?? [])
      setLoading(false)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId])

  const isAlreadyAdded = (question: string) =>
    faqs.some(f => f.question.trim().toLowerCase() === question.trim().toLowerCase())

  const availableSuggested = suggested.filter(s => !isAlreadyAdded(s.suggested_question))

  const handleSaveSuggested = async () => {
    const row = suggested.find(s => s.id === addingSuggestedId)
    if (!row) return
    if (!answerDraft.trim()) {
      setError(t('faqAnswerRequiredError'))
      return
    }

    setSaving(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('vendor_faqs')
      .insert({ vendor_id: vendorId, question: row.suggested_question, answer: answerDraft.trim() })
      .select('id, question, answer, is_active')
      .single()

    setSaving(false)

    if (insertError || !data) {
      setError(insertError?.message ?? t('faqGenericError'))
      return
    }

    setFaqs(prev => [data, ...prev])
    setAddingSuggestedId(null)
    setAnswerDraft('')
  }

  const handleSaveCustom = async () => {
    if (customQuestion.trim().length < 5) {
      setError(t('faqQuestionRequiredError'))
      return
    }
    if (!customAnswer.trim()) {
      setError(t('faqAnswerRequiredError'))
      return
    }

    setSaving(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('vendor_faqs')
      .insert({ vendor_id: vendorId, question: customQuestion.trim(), answer: customAnswer.trim() })
      .select('id, question, answer, is_active')
      .single()

    setSaving(false)

    if (insertError || !data) {
      setError(insertError?.message ?? t('faqGenericError'))
      return
    }

    setFaqs(prev => [data, ...prev])
    setAddingCustom(false)
    setCustomQuestion('')
    setCustomAnswer('')
  }

  const handleToggleActive = async (faq: FaqRow) => {
    setBusyId(faq.id)
    const { error: updateError } = await supabase
      .from('vendor_faqs')
      .update({ is_active: !faq.is_active })
      .eq('id', faq.id)
    setBusyId(null)

    if (updateError) {
      console.error('[FaqSection] toggle', updateError)
      return
    }
    setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, is_active: !f.is_active } : f))
  }

  const handleDelete = async (id: string) => {
    setBusyId(id)
    const { error: deleteError } = await supabase.from('vendor_faqs').delete().eq('id', id)
    setBusyId(null)

    if (deleteError) {
      console.error('[FaqSection] delete', deleteError)
      return
    }
    setFaqs(prev => prev.filter(f => f.id !== id))
  }

  const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }

  return (
    <SectionCard title={t('faqSectionTitle')}>
      {loading ? (
        <p className="text-xs text-gray-400">...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {availableSuggested.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>{t('faqSuggestedHeading')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {availableSuggested.map(row => (
                  <div key={row.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#333' }}>{row.suggested_question}</span>
                      {addingSuggestedId !== row.id && (
                        <button
                          type="button"
                          onClick={() => { setAddingSuggestedId(row.id); setAnswerDraft(''); setError(null) }}
                          style={{ fontSize: 12, fontWeight: 700, color: BRAND.blue, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                        >
                          {t('faqAddButton')}
                        </button>
                      )}
                    </div>
                    {addingSuggestedId === row.id && (
                      <div style={{ marginTop: 8 }}>
                        <textarea
                          value={answerDraft}
                          onChange={e => setAnswerDraft(e.target.value)}
                          placeholder={t('faqAnswerPlaceholder')}
                          rows={2}
                          style={{ ...inputStyle, resize: 'vertical' }}
                        />
                        {error && <p style={{ fontSize: 11, color: BRAND.red, margin: '4px 0 0' }}>{error}</p>}
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <button
                            type="button"
                            onClick={handleSaveSuggested}
                            disabled={saving}
                            style={{ background: saving ? '#ccc' : BRAND.blue, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
                          >
                            {saving ? t('faqSaving') : t('faqSaveButton')}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAddingSuggestedId(null); setError(null) }}
                            disabled={saving}
                            style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            {t('faqCancelButton')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            {addingCustom ? (
              <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
                <input
                  type="text"
                  value={customQuestion}
                  onChange={e => setCustomQuestion(e.target.value)}
                  placeholder={t('faqCustomQuestionPlaceholder')}
                  style={{ ...inputStyle, marginBottom: 8 }}
                />
                <textarea
                  value={customAnswer}
                  onChange={e => setCustomAnswer(e.target.value)}
                  placeholder={t('faqAnswerPlaceholder')}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                {error && <p style={{ fontSize: 11, color: BRAND.red, margin: '4px 0 0' }}>{error}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    disabled={saving}
                    style={{ background: saving ? '#ccc' : BRAND.blue, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
                  >
                    {saving ? t('faqSaving') : t('faqSaveButton')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingCustom(false); setCustomQuestion(''); setCustomAnswer(''); setError(null) }}
                    disabled={saving}
                    style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {t('faqCancelButton')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setAddingCustom(true); setError(null) }}
                style={{ fontSize: 13, fontWeight: 700, color: BRAND.blue, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {t('faqAddCustomButton')}
              </button>
            )}
          </div>

          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>{t('faqYourQuestionsHeading')}</p>
            {faqs.length === 0 ? (
              <p style={{ fontSize: 12, color: '#999' }}>{t('faqEmptyHint')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {faqs.map(faq => (
                  <div
                    key={faq.id}
                    style={{ border: '1px solid #eee', borderRadius: 8, padding: 10, opacity: faq.is_active ? 1 : 0.55 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: 0 }}>
                          {faq.question}
                          {!faq.is_active && (
                            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>
                              {t('faqInactiveLabel')}
                            </span>
                          )}
                        </p>
                        <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>{faq.answer}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(faq)}
                          disabled={busyId === faq.id}
                          style={{ fontSize: 11, fontWeight: 700, color: BRAND.blue, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          {faq.is_active ? t('faqDeactivateButton') : t('faqActivateButton')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(faq.id)}
                          disabled={busyId === faq.id}
                          style={{ fontSize: 11, fontWeight: 700, color: BRAND.red, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          {t('faqDeleteButton')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </SectionCard>
  )
}
