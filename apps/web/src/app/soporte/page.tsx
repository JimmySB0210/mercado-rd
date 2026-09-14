'use client'
// ============================================================
// MercadoRD — Soporte al cliente
// Ruta: src/app/soporte/page.tsx
// ============================================================
// Página pública (sin login) — formulario simple que arma un
// mensaje de WhatsApp pre-llenado y lo abre en wa.me.
// ============================================================

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PackageX, ClipboardList, FileWarning, Scale, EyeOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Navbar } from '@/components/shop/Navbar'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'
import type { SupportDict } from '@/lib/i18n/es/support'

// Número de WhatsApp Business — PLACEHOLDER, Jimmy lo cambiará
// cuando tenga el número real.
const WHATSAPP_NUMBER = '18091234567'

// El value real que guarda el estado es la key del diccionario (ej.
// "issueNotReceived"), nunca el texto traducido — así nunca se
// compara ni se envía a WhatsApp un string que depende del idioma
// activo en el momento en que se seleccionó.
const ISSUE_TYPE_KEYS: (keyof SupportDict)[] = [
  'issueNotReceived',
  'issueDamaged',
  'issueCancelOrder',
  'issuePaymentProblem',
  'issueHiddenCharges',
  'issueProductQuestion',
  'issueOther',
]

const HIDDEN_CHARGES_ISSUE_TYPE: keyof SupportDict = 'issueHiddenCharges'

// Categorías que ya traen el motivo resuelto — llevan a /perfil/pedidos
// para que la persona elija el pedido correspondiente; el motivo viaja
// por query param y DisputeModal lo trae pre-seleccionado.
const DISPUTE_CATEGORIES: { titleKey: keyof SupportDict; icon: LucideIcon; href: string }[] = [
  { titleKey: 'categoryDamagedTitle', icon: PackageX, href: '/perfil/pedidos?reason=damaged' },
  { titleKey: 'categoryWrongItemTitle', icon: ClipboardList, href: '/perfil/pedidos?reason=wrong_item' },
  { titleKey: 'categoryNotAsDescribedTitle', icon: FileWarning, href: '/perfil/pedidos?reason=not_as_described' },
  { titleKey: 'categoryDisputeTitle', icon: Scale, href: '/perfil/pedidos' },
]

const MIN_DESCRIPTION_LENGTH = 20

export default function SoportePage() {
  const { t } = useTranslation('support')
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)
  const [fullName, setFullName] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [issueType, setIssueType] = useState<keyof SupportDict>(ISSUE_TYPE_KEYS[0])
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleHiddenChargesClick = () => {
    setIssueType(HIDDEN_CHARGES_ISSUE_TYPE)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const nameValid = fullName.trim().length > 0
  const descriptionValid = description.trim().length >= MIN_DESCRIPTION_LENGTH
  const formValid = nameValid && descriptionValid

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

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <nav className="text-sm text-gray-400 mb-4">
          <a href="/" className="hover:text-gray-600 transition-colors no-underline">{t('breadcrumbHome')}</a>
          <span className="mx-2">/</span>
          <span className="text-gray-600">{t('breadcrumbCurrent')}</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-1">{t('pageTitle')}</h1>
        <p className="text-sm text-gray-400 mb-6">
          {t('pageSubtitle')}
        </p>

        <p className="text-sm font-medium text-gray-700 mb-3">{t('whatIsYourProblemLabel')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {DISPUTE_CATEGORIES.map(category => {
            const Icon = category.icon
            return (
              <button
                key={category.titleKey}
                type="button"
                onClick={() => router.push(category.href)}
                className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:border-gray-300 transition-colors cursor-pointer"
              >
                <Icon size={20} className="flex-shrink-0" style={{ color: BRAND.blue }} />
                <span className="text-sm font-medium text-gray-800">{t(category.titleKey)}</span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={handleHiddenChargesClick}
            className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:border-gray-300 transition-colors cursor-pointer"
          >
            <EyeOff size={20} className="flex-shrink-0" style={{ color: BRAND.blue }} />
            <span className="text-sm font-medium text-gray-800">{t('categoryHiddenChargesTitle')}</span>
          </button>
        </div>

        {/* Banner de horario */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700 mb-6">
          {t('scheduleBanner')}
        </div>

        <div ref={formRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fullNameLabel')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder={t('fullNamePlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
                style={{ '--brand-blue': BRAND.blue } as React.CSSProperties}
              />
              {submitted && !nameValid && (
                <p className="mt-1 text-xs text-red-600">{t('fullNameRequiredError')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderNumberLabel')} <span className="text-gray-400 font-normal">{t('orderNumberOptionalSuffix')}</span>
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder={t('orderNumberPlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
                style={{ '--brand-blue': BRAND.blue } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('issueTypeLabel')}
              </label>
              <select
                value={issueType}
                onChange={e => setIssueType(e.target.value as keyof SupportDict)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
                style={{ '--brand-blue': BRAND.blue } as React.CSSProperties}
              >
                {ISSUE_TYPE_KEYS.map(key => (
                  <option key={key} value={key}>{t(key)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('descriptionLabel')}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder', { min: MIN_DESCRIPTION_LENGTH })}
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent resize-none"
                style={{ '--brand-blue': BRAND.blue } as React.CSSProperties}
              />
              <p className="mt-1 text-xs text-gray-400">
                {t('descriptionCounter', { count: description.trim().length, min: MIN_DESCRIPTION_LENGTH })}
              </p>
              {submitted && !descriptionValid && (
                <p className="mt-1 text-xs text-red-600">
                  {t('descriptionRequiredError', { min: MIN_DESCRIPTION_LENGTH })}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:brightness-95 text-white font-medium py-3 rounded-lg transition-all"
            >
              {t('submitButton')}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
