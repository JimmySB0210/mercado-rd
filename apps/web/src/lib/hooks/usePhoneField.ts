'use client'
// ============================================================
// MercadoRD — Campo de teléfono / WhatsApp
// Ruta: src/lib/hooks/usePhoneField.ts
// ============================================================
// Mismo comportamiento en todos los formularios: valida al salir del
// campo y al enviar, muestra el error traducido (common.phoneInvalid) y,
// si el número es válido, al salir del campo lo reescribe como
// 809-555-1234 para que se vea lo que se guarda. El campo vacío es
// válido (opcional); quien lo exige lo comprueba aparte.
// Al enviar se usa validate(), que devuelve el canónico (1809XXXXXXX),
// null si está vacío, o false si es inválido (y deja el error puesto).
// ============================================================

import { useCallback, useRef, useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPhone, normalizePhone, PHONE_INPUT_PROPS } from '@/lib/phone'

export function usePhoneField(initial?: string | null) {
  const { t } = useTranslation('common')
  const [value, setValue] = useState(formatPhone(initial))
  const [error, setError] = useState<string | null>(null)

  const isInvalid = (v: string) => v.trim() !== '' && !normalizePhone(v)

  // validate() es estable entre renders (lee el valor y t() de refs) para
  // que quien lo use dentro de un useCallback registrado en un padre
  // (ej. ContactSection → onRegisterSave) no se recree en cada render.
  const latest = useRef({ value, t })
  latest.current = { value, t }

  const onChange = (next: string) => {
    setValue(next)
    if (error) setError(null)
  }

  const onBlur = () => {
    if (isInvalid(value)) { setError(t('phoneInvalid')); return }
    setError(null)
    if (value.trim()) setValue(formatPhone(value))
  }

  const validate = useCallback((): string | null | false => {
    const { value: current, t: translate } = latest.current
    if (current.trim() !== '' && !normalizePhone(current)) { setError(translate('phoneInvalid')); return false }
    setError(null)
    return normalizePhone(current)
  }, [])

  const reset = (next = '') => { setValue(next); setError(null) }

  return {
    value,
    error,
    validate,
    reset,
    inputProps: {
      ...PHONE_INPUT_PROPS,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
      onBlur,
      'aria-invalid': !!error,
    },
  }
}
