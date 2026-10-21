'use client'
// ============================================================
// MercadoRD — Formulario de /soporte (mensaje de WhatsApp)
// Ruta: src/components/soporte/SupportForm.tsx
// ============================================================
// La lógica es la de siempre: nombre obligatorio, descripción de al
// menos 20 caracteres, número de orden opcional, errores solo después
// del primer envío, y el mismo mensaje de 5 líneas abierto en wa.me.
// El tipo de problema vive en SoporteContent porque las tarjetas
// también lo eligen.
// ============================================================

import { forwardRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { SupportDict } from '@/lib/i18n/es/support'
import { CARD_STYLE, FOCUS_RING } from './SupportCard'

// El value real que guarda el estado es la key del diccionario (ej.
// "issueNotReceived"), nunca el texto traducido — así nunca se
// compara ni se envía a WhatsApp un string que depende del idioma
// activo en el momento en que se seleccionó.
export const ISSUE_TYPE_KEYS: (keyof SupportDict)[] = [
  'issueNotReceived',
  'issueDamaged',
  'issueCancelOrder',
  'issuePaymentProblem',
  'issueHiddenCharges',
  'issueSellerProblem',
  'issueAccountProblem',
  'issueProductQuestion',
  'issueOther',
]

const MIN_DESCRIPTION_LENGTH = 20

const FIELD_CLASS = 'w-full px-4 text-body focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus:border-[color:var(--color-primary)]'
const FIELD_STYLE: React.CSSProperties = {
  background: 'var(--color-card-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-control)',
  color: 'var(--color-text-primary)',
}
const LABEL_CLASS = 'block text-form-label font-medium mb-1.5'

interface Props {
  whatsappNumber: string
  issueType: keyof SupportDict
  onIssueTypeChange: (issue: keyof SupportDict) => void
}

export const SupportForm = forwardRef<HTMLInputElement, Props>(function SupportForm(
  { whatsappNumber, issueType, onIssueTypeChange },
  nameInputRef,
) {
  const { t } = useTranslation('support')
  const [fullName, setFullName] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const nameValid = fullName.trim().length > 0
  const descriptionValid = description.trim().length >= MIN_DESCRIPTION_LENGTH
  const formValid = nameValid && descriptionValid
  const nameError = submitted && !nameValid
  const descriptionError = submitted && !descriptionValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    if (!formValid) return

    const message = [
      t('whatsappGreeting'),
      `${t('whatsappNameLabel')}: ${fullName.trim()}`,
      `${t('whatsappOrderLabel')}: ${orderNumber.trim() || t('whatsappNoOrderNumber')}`,
      `${t('whatsappIssueLabel')}: ${t(issueType)}`,
      `${t('whatsappDescriptionLabel')}: ${description.trim()}`,
    ].join('\n')

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div id="formulario-soporte" className="scroll-mt-6 p-5 sm:p-6" style={CARD_STYLE}>
      <h3 className="text-form-section font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('supportFormTitle')}</h3>
      <p className="text-ui mt-1 mb-5" style={{ color: 'var(--color-text-secondary)' }}>{t('supportFormText')}</p>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="soporte-nombre" className={LABEL_CLASS} style={{ color: 'var(--color-text-primary)' }}>
              {t('fullNameLabel')}
            </label>
            <input
              ref={nameInputRef}
              id="soporte-nombre"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder={t('fullNamePlaceholder')}
              aria-invalid={nameError}
              aria-describedby={nameError ? 'soporte-nombre-error' : undefined}
              className={`${FIELD_CLASS} h-12`}
              style={FIELD_STYLE}
            />
            {nameError && (
              <p id="soporte-nombre-error" className="mt-1 text-small" style={{ color: 'var(--brand-red)' }}>{t('fullNameRequiredError')}</p>
            )}
          </div>

          <div>
            <label htmlFor="soporte-orden" className={LABEL_CLASS} style={{ color: 'var(--color-text-primary)' }}>
              {t('orderNumberLabel')}{' '}
              <span className="font-normal" style={{ color: 'var(--color-text-tertiary)' }}>{t('orderNumberOptionalSuffix')}</span>
            </label>
            <input
              id="soporte-orden"
              type="text"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder={t('orderNumberPlaceholder')}
              className={`${FIELD_CLASS} h-12`}
              style={FIELD_STYLE}
            />
          </div>
        </div>

        <div>
          <label htmlFor="soporte-tipo" className={LABEL_CLASS} style={{ color: 'var(--color-text-primary)' }}>
            {t('issueTypeLabel')}
          </label>
          <select
            id="soporte-tipo"
            value={issueType}
            onChange={e => onIssueTypeChange(e.target.value as keyof SupportDict)}
            className={`${FIELD_CLASS} h-12`}
            style={FIELD_STYLE}
          >
            {ISSUE_TYPE_KEYS.map(key => (
              <option key={key} value={key}>{t(key)}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="soporte-descripcion" className={LABEL_CLASS} style={{ color: 'var(--color-text-primary)' }}>
            {t('descriptionLabel')}
          </label>
          <textarea
            id="soporte-descripcion"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder', { min: MIN_DESCRIPTION_LENGTH })}
            rows={5}
            aria-invalid={descriptionError}
            aria-describedby={`soporte-descripcion-contador${descriptionError ? ' soporte-descripcion-error' : ''}`}
            className={`${FIELD_CLASS} py-3 resize-none`}
            style={FIELD_STYLE}
          />
          <p id="soporte-descripcion-contador" className="mt-1 text-caption" style={{ color: 'var(--color-text-tertiary)' }}>
            {t('descriptionCounter', { count: description.trim().length, min: MIN_DESCRIPTION_LENGTH })}
          </p>
          {descriptionError && (
            <p id="soporte-descripcion-error" className="mt-1 text-small" style={{ color: 'var(--brand-red)' }}>
              {t('descriptionRequiredError', { min: MIN_DESCRIPTION_LENGTH })}
            </p>
          )}
        </div>

        <button
          type="submit"
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-6 text-ui font-semibold transition-colors hover:!bg-[color:var(--color-primary-hover)] ${FOCUS_RING}`}
          style={{ background: 'var(--color-primary)', color: 'var(--color-card-bg)', borderRadius: 'var(--radius-control)' }}
        >
          <MessageCircle size={18} aria-hidden="true" />
          {t('submitButton')}
        </button>
      </form>
    </div>
  )
})
