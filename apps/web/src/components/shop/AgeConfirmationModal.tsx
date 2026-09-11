'use client'
// ============================================================
// MercadoRD — Aviso de confirmación de mayoría de edad
// Ruta: src/components/shop/AgeConfirmationModal.tsx
// ============================================================
// Se muestra cuando la categoría de una página de categoría o de un
// producto tiene requires_age_confirmation = true. La confirmación se
// guarda en sessionStorage (no localStorage) a propósito — se vuelve
// a preguntar en cada sesión nueva del navegador, nunca queda
// confirmado para siempre. Un solo flag global (no por categoría):
// una vez confirmado, no se repite dentro de la misma visita sin
// importar cuántas categorías/productos con este requisito se visiten.
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

const SESSION_KEY = 'mercadord_age_confirmed'

interface Props {
  requiresConfirmation: boolean
}

export function AgeConfirmationModal({ requiresConfirmation }: Props) {
  const router = useRouter()
  const { t } = useTranslation('common')
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!requiresConfirmation) return
    try {
      if (sessionStorage.getItem(SESSION_KEY) === 'true') return
    } catch {
      // sessionStorage puede no estar disponible (modo privado, etc.) —
      // en ese caso se pregunta igual, no falla en silencio.
    }
    setShow(true)
  }, [requiresConfirmation])

  const handleContinue = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, 'true')
    } catch {
      // si no se puede guardar, simplemente se volverá a preguntar
    }
    setShow(false)
  }

  const handleBack = () => {
    router.push('/')
  }

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16,
      }}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔞</div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 8 }}>
          {t('ageConfirmationTitle')}
        </h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.5 }}>
          {t('ageConfirmationBody')}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleBack}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', color: '#666', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            {t('ageConfirmationBack')}
          </button>
          <button
            type="button"
            onClick={handleContinue}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: BRAND.blue, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            {t('ageConfirmationContinue')}
          </button>
        </div>
      </div>
    </div>
  )
}
