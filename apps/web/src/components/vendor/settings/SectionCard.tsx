'use client'
// ============================================================
// MercadoRD — UI compartida entre las secciones de Configuración
// Ruta: src/components/vendor/settings/SectionCard.tsx
// ============================================================
// Cada sección de dashboard/configuracion es independiente: su
// propio estado, su propio guardado, su propio error/éxito — si una
// falla, las demás no se ven afectadas. Este wrapper solo estandariza
// la tarjeta visual y el botón de guardar con su feedback.
// ============================================================

import { BRAND } from '@/lib/colors'

export function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: subtitle ? 4 : 14 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12, color: '#999', marginBottom: 14 }}>{subtitle}</p>}
      {children}
    </div>
  )
}

export function SaveSectionButton({ onClick, saving, error, success, label = 'Guardar' }: {
  onClick: () => void
  saving: boolean
  error: string | null
  success: boolean
  label?: string
}) {
  return (
    <div style={{ marginTop: 16 }}>
      {error && (
        <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#c00', marginBottom: 10 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#efe', border: '1px solid #cfc', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#070', marginBottom: 10 }}>
          ✓ Guardado correctamente
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={saving}
        style={{
          background: saving ? '#ccc' : BRAND.blue, color: '#fff', border: 'none', padding: '9px 18px',
          borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Guardando...' : label}
      </button>
    </div>
  )
}
