'use client'
// ============================================================
// MercadoRD — Aviso de cierre de sesión por inactividad
// Ruta: src/components/shop/InactivityWarning.tsx
// ============================================================

import { useInactivityLogout } from '@/lib/hooks/useInactivityLogout'
import { BRAND } from '@/lib/colors'

export function InactivityWarning() {
  const { showWarning, dismissWarning } = useInactivityLogout()

  if (!showWarning) return null

  return (
    <button
      type="button"
      onClick={dismissWarning}
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: BRAND.dark,
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        padding: '12px 20px',
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: '90vw',
        textAlign: 'left',
      }}
    >
      ⏰ Tu sesión cerrará en 2 minutos por inactividad. Haz clic para continuar.
    </button>
  )
}
