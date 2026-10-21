'use client'
// ============================================================
// MercadoRD — Panel lateral de /soporte
// Ruta: src/components/soporte/SupportSidePanel.tsx
// ============================================================
// "Contactar por WhatsApp" no abre wa.me sin datos: baja al formulario,
// que arma el mensaje con sus validaciones. "Ver mis disputas" es la
// única vista guardada que existe (el soporte por WhatsApp no se guarda).
// ============================================================

import Link from 'next/link'
import { ChevronRight, Clock, Headset, MessageCircle, Scale, ShieldCheck } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { CARD_STYLE, FOCUS_RING } from './SupportCard'

interface Props {
  onContact: () => void
}

export function SupportSidePanel({ onContact }: Props) {
  const { t } = useTranslation('support')

  return (
    <aside className="p-5 lg:sticky lg:top-6" style={CARD_STYLE} aria-labelledby="soporte-panel-titulo">
      <div className="flex items-start gap-3">
        <span
          className="flex items-center justify-center flex-shrink-0 w-12 h-12"
          style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }}
          aria-hidden="true"
        >
          <Headset size={22} />
        </span>
        <div className="min-w-0">
          <h2 id="soporte-panel-titulo" className="text-h4 font-bold" style={{ color: 'var(--color-blue-dark)' }}>{t('supportPanelTitle')}</h2>
          <p className="text-small mt-1" style={{ color: 'var(--color-text-secondary)' }}>{t('supportPanelText')}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onContact}
        className={`mt-5 flex items-center gap-3 w-full min-h-[56px] px-4 py-2.5 text-left cursor-pointer transition-colors hover:brightness-95 ${FOCUS_RING}`}
        style={{ background: 'var(--color-green-subtle)', border: '1px solid var(--color-green)', borderRadius: 'var(--radius-control)' }}
      >
        <MessageCircle size={22} aria-hidden="true" className="flex-shrink-0" style={{ color: 'var(--color-green)' }} />
        <span className="flex-1 min-w-0">
          <span className="block text-ui font-semibold" style={{ color: 'var(--color-blue-dark)' }}>{t('supportPanelWhatsappButton')}</span>
          <span className="block text-caption" style={{ color: 'var(--color-text-secondary)' }}>{t('supportPanelWhatsappHint')}</span>
        </span>
        <ChevronRight size={18} aria-hidden="true" className="flex-shrink-0" style={{ color: 'var(--color-blue-dark)' }} />
      </button>

      <Link
        href="/perfil/disputas"
        className={`mt-3 flex items-center gap-3 w-full min-h-[48px] px-4 text-ui font-semibold no-underline transition-colors hover:!bg-[color:var(--color-primary-subtle)] ${FOCUS_RING}`}
        style={{ border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-control)', color: 'var(--color-primary)' }}
      >
        <Scale size={18} aria-hidden="true" className="flex-shrink-0" />
        <span className="flex-1 min-w-0">{t('supportPanelDisputesButton')}</span>
        <ChevronRight size={18} aria-hidden="true" className="flex-shrink-0" />
      </Link>

      <div className="mt-5 pt-5 flex items-start gap-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <Clock size={20} aria-hidden="true" className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-blue-dark)' }} />
        <div className="min-w-0">
          <p className="text-ui font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('supportScheduleTitle')}</p>
          <p className="text-small mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{t('supportScheduleText')}</p>
        </div>
      </div>

      <p
        className="mt-5 flex items-start gap-3 p-3 text-small"
        style={{ background: 'var(--color-primary-subtle)', borderRadius: 'var(--radius-control)', color: 'var(--color-text-secondary)' }}
      >
        <ShieldCheck size={20} aria-hidden="true" className="flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
        {t('supportConfidentialNotice')}
      </p>
    </aside>
  )
}
