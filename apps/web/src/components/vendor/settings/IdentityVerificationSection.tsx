'use client'
// ============================================================
// MercadoRD — Configuración, sección: Verificación de identidad
// Ruta: src/components/vendor/settings/IdentityVerificationSection.tsx
// ============================================================
// La más sensible de las secciones de configuración — trato extra
// cuidadoso:
// - Los 3 documentos van al bucket privado identity-documents
//   ({userId}/{tipo}-{timestamp}.{ext}), nunca a uno público, y solo se
//   guarda la ruta (no hay getPublicUrl en un bucket privado).
// - Una vez enviados, NUNCA se vuelven a mostrar en la interfaz —ni
//   siquiera con una URL firmada—, solo un estado de confirmación con
//   fecha. Minimiza cuánto se re-expone este tipo de documento.
// - La arquitectura de verificación externa está lista pero sin
//   proveedor conectado: request_external_verification siempre
//   responde 'unavailable' por ahora. El aviso al vendor es honesto
//   sobre eso.
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validateImageFile, uploadIdentityDocument, type IdentityDocumentKind } from '@/lib/storage/upload'
import { useLanguageStore } from '@/lib/store/language'
import { formatDate } from '@/lib/utils'
import { SectionCard } from './SectionCard'
import { BRAND } from '@/lib/colors'

interface Props {
  userId: string
}

const CEDULA_REGEX = /^\d{3}-\d{7}-\d{1}$/

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }

export function IdentityVerificationSection({ userId }: Props) {
  const language = useLanguageStore(s => s.language)

  const [loadingInitial, setLoadingInitial] = useState(true)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [cedula, setCedula] = useState('')
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const supabase = createClient()
      const [{ data: userRow }, { data: existing }] = await Promise.all([
        supabase.from('users').select('full_name').eq('id', userId).single(),
        supabase
          .from('external_verifications')
          .select('requested_at')
          .eq('verification_type', 'identity_kyc')
          .eq('target_type', 'user')
          .eq('target_id', userId)
          .order('requested_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      if (!active) return
      if (userRow?.full_name) setFullName(userRow.full_name)
      if (existing?.requested_at) setSubmittedAt(existing.requested_at)
      setLoadingInitial(false)
    }
    load()
    return () => { active = false }
  }, [userId])

  const handleFileSelect = (kind: IdentityDocumentKind) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    if (kind === 'front') setFrontFile(file)
    else if (kind === 'back') setBackFile(file)
    else setSelfieFile(file)
  }

  const handleSubmit = async () => {
    setError(null)

    if (!fullName.trim()) {
      setError('Ingresa tu nombre completo.')
      return
    }
    if (!CEDULA_REGEX.test(cedula.trim())) {
      setError('El formato de la cédula debe ser XXX-XXXXXXX-X.')
      return
    }
    if (!frontFile || !backFile || !selfieFile) {
      setError('Sube las 3 fotos: cédula frontal, cédula trasera y selfie.')
      return
    }

    setSubmitting(true)

    const [frontResult, backResult, selfieResult] = await Promise.all([
      uploadIdentityDocument(frontFile, userId, 'front'),
      uploadIdentityDocument(backFile, userId, 'back'),
      uploadIdentityDocument(selfieFile, userId, 'selfie'),
    ])

    const failedUpload = [frontResult, backResult, selfieResult].find(r => r.error)
    if (failedUpload) {
      console.error('[IdentityVerificationSection upload]', failedUpload.error)
      setError('No se pudo subir uno de los documentos. Intenta de nuevo.')
      setSubmitting(false)
      return
    }

    const supabase = createClient()
    const { error: rpcError } = await supabase.rpc('request_external_verification', {
      p_verification_type: 'identity_kyc',
      p_input_data: {
        cedula_number: cedula.trim(),
        document_front_path: frontResult.path,
        document_back_path: backResult.path,
        selfie_path: selfieResult.path,
      },
      p_target_type: 'user',
      p_target_id: userId,
    })

    setSubmitting(false)

    if (rpcError) {
      console.error('[IdentityVerificationSection rpc]', rpcError)
      setError('No se pudo enviar la solicitud de verificación. Intenta de nuevo.')
      return
    }

    setFrontFile(null)
    setBackFile(null)
    setSelfieFile(null)
    setSubmittedAt(new Date().toISOString())
  }

  if (loadingInitial) {
    return (
      <SectionCard title="Verificación de identidad">
        <p style={{ fontSize: 13, color: '#999' }}>Cargando...</p>
      </SectionCard>
    )
  }

  if (submittedAt) {
    return (
      <SectionCard title="Verificación de identidad">
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 4 }}>
            ✓ Documentos enviados, verificación disponible próximamente
          </p>
          <p style={{ fontSize: 12, color: '#166534' }}>
            Enviado el {formatDate(submittedAt, language, { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </SectionCard>
    )
  }

  const filePicker = (kind: IdentityDocumentKind, label: string, file: File | null) => (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      <label style={{ cursor: 'pointer', display: 'block' }}>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 8, border: `1px dashed ${file ? '#86EFAC' : '#ccc'}`,
          borderRadius: 8, padding: '10px 12px', fontSize: 13,
          color: file ? '#166534' : '#666', background: file ? '#F0FDF4' : '#fafafa',
        }}>
          {file ? `✓ ${file.name}` : '📷 Seleccionar foto'}
        </span>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect(kind)} style={{ display: 'none' }} />
      </label>
    </div>
  )

  return (
    <SectionCard title="Verificación de identidad" subtitle="Solo tú y MercadoRD pueden acceder a estos documentos">
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: '#1e3a8a' }}>
        Esta verificación estará disponible próximamente. Tus documentos quedan guardados de forma segura y privada mientras tanto.
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Nombre completo</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Número de cédula</label>
        <input value={cedula} onChange={e => setCedula(e.target.value)} placeholder="XXX-XXXXXXX-X" style={inputStyle} />
      </div>

      {filePicker('front', 'Foto de cédula (frontal)', frontFile)}
      {filePicker('back', 'Foto de cédula (trasera)', backFile)}
      {filePicker('selfie', 'Selfie', selfieFile)}

      {error && (
        <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#c00', marginTop: 4, marginBottom: 10 }}>
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          marginTop: 4, background: submitting ? '#ccc' : BRAND.blue, color: '#fff', border: 'none', padding: '9px 18px',
          borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Enviando documentos...' : 'Enviar para verificación'}
      </button>
    </SectionCard>
  )
}
