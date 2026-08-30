'use client'
// ============================================================
// MercadoRD — Preguntas frecuentes del vendedor (acordeón)
// Ruta: src/components/shop/ProductFaqAccordion.tsx
// ============================================================
// ProductFaqSection.tsx es un Server Component (fetch a Supabase) y
// no puede usar useTranslation. Este componente recibe la pregunta
// automática de tipo de negocio (si aplica) + las vendor_faqs activas
// ya resueltas, y maneja el estado de expandir/colapsar cada una.
// ============================================================

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { VendorOptionLabel } from '@/components/vendor/VendorOptionLabel'

export interface FaqViewModel {
  id: string
  question: string
  answer: string
}

interface Props {
  vendorName: string
  businessTypes: string[]
  faqs: FaqViewModel[]
}

export function ProductFaqAccordion({ vendorName, businessTypes, faqs }: Props) {
  const { t } = useTranslation('products')
  const [openId, setOpenId] = useState<string | null>(null)
  const [businessTypeOpen, setBusinessTypeOpen] = useState(false)

  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{t('faqPublicHeading')}</h2>
      <div className="flex flex-col gap-2">
        {businessTypes.length > 0 && (
          <div className="bg-[var(--color-card-bg)]" style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}>
            <button
              type="button"
              onClick={() => setBusinessTypeOpen(o => !o)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="text-sm font-semibold text-gray-900">{t('businessTypeQuestion', { vendorName })}</span>
              <span className="text-gray-400 text-xs flex-shrink-0 ml-3">{businessTypeOpen ? '▲' : '▼'}</span>
            </button>
            {businessTypeOpen && (
              <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                {businessTypes.map((bt, i) => (
                  <span key={bt}>
                    <VendorOptionLabel category="businessType" value={bt} />
                    {i < businessTypes.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {faqs.map(faq => {
          const isOpen = openId === faq.id
          return (
            <div
              key={faq.id}
              className="bg-[var(--color-card-bg)]"
              style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-semibold text-gray-900">{faq.question}</span>
                <span className="text-gray-400 text-xs flex-shrink-0 ml-3">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{faq.answer}</div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
