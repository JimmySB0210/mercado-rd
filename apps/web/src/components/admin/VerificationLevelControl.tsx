'use client'
// ============================================================
// MercadoRD — Control de nivel de verificación (admin)
// Ruta: src/components/admin/VerificationLevelControl.tsx
// ============================================================
// 4 botones (nivel 1-4). El trigger protect_vendor_verification_level
// en la BD solo permite el cambio si el usuario es admin — este
// componente solo puede ejecutarse desde /admin/proveedores.
// La nota es opcional y no se persiste en una tabla de auditoría:
// se pide vía prompt y se deja en consola, tal como se acordó.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Props {
  vendorId: string
  currentLevel: number
}

const LEVELS = [1, 2, 3, 4]

export function VerificationLevelControl({ vendorId, currentLevel }: Props) {
  const { t } = useTranslation('vendorOptions')
  const { t: ta } = useTranslation('admin')
  const levelLabel = (l: number) => t(`verificationLevel.${l}` as Parameters<typeof t>[0])
  const [level, setLevel] = useState(currentLevel)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = async (newLevel: number) => {
    if (newLevel === level || saving) return

    const note = window.prompt(
      `${ta('changeLevelPrompt', { from: levelLabel(level), to: levelLabel(newLevel) })}\n${ta('internalNotePromptLabel')}`,
      ''
    )
    if (note === null) return // canceló

    setSaving(true)
    console.log(`[VerificationLevelControl] vendor=${vendorId} ${level} → ${newLevel}`, note ? `nota: ${note}` : '(sin nota)')

    const { error } = await supabase
      .from('vendors')
      .update({ verification_level: newLevel })
      .eq('id', vendorId)

    if (error) {
      console.error('[VerificationLevelControl]', error)
      window.alert(ta('levelUpdateFailed'))
      setSaving(false)
      return
    }

    setLevel(newLevel)
    setSaving(false)
    router.refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {LEVELS.map(l => {
          const active = l === level
          return (
            <button
              key={l}
              type="button"
              disabled={saving}
              onClick={() => handleChange(l)}
              style={{
                flex: '1 1 140px',
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: 8,
                border: active ? `2px solid ${BRAND.blue}` : '1px solid #ddd',
                background: active ? '#EAF1FC' : '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: active ? BRAND.blue : '#999' }}>
                {ta('levelButtonPrefix', { level: l })}
              </div>
              <div style={{ fontSize: 12, color: active ? BRAND.dark : '#666', marginTop: 2 }}>
                {levelLabel(l)}
              </div>
            </button>
          )
        })}
      </div>
      {saving && <p style={{ fontSize: 11, color: '#999', marginTop: 8 }}>{ta('savingButton')}</p>}
    </div>
  )
}
