'use client'
// ============================================================
// MercadoRD — Soporte al cliente
// Ruta: src/app/soporte/page.tsx
// ============================================================
// Página pública (sin login) — formulario simple que arma un
// mensaje de WhatsApp pre-llenado y lo abre en wa.me.
// ============================================================

import { useState } from 'react'
import { Navbar } from '@/components/shop/Navbar'
import { BRAND } from '@/lib/colors'

// Número de WhatsApp Business — PLACEHOLDER, Jimmy lo cambiará
// cuando tenga el número real.
const WHATSAPP_NUMBER = '18091234567'

const ISSUE_TYPES = [
  'No recibí mi pedido',
  'El producto llegó dañado',
  'Quiero cancelar mi pedido',
  'Problema con el pago',
  'Tengo una pregunta sobre un producto',
  'Otro',
] as const

const MIN_DESCRIPTION_LENGTH = 20

export default function SoportePage() {
  const [fullName, setFullName] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [issueType, setIssueType] = useState<string>(ISSUE_TYPES[0])
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const nameValid = fullName.trim().length > 0
  const descriptionValid = description.trim().length >= MIN_DESCRIPTION_LENGTH
  const formValid = nameValid && descriptionValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    if (!formValid) return

    const message = [
      'Hola MercadoRD, necesito ayuda 🛒',
      `Nombre: ${fullName.trim()}`,
      `Orden: ${orderNumber.trim() || 'Sin número de orden'}`,
      `Problema: ${issueType}`,
      `Descripción: ${description.trim()}`,
    ].join('\n')

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <nav className="text-sm text-gray-400 mb-4">
          <a href="/" className="hover:text-gray-600 transition-colors no-underline">Inicio</a>
          <span className="mx-2">/</span>
          <span className="text-gray-600">Soporte</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Soporte al cliente</h1>
        <p className="text-sm text-gray-400 mb-6">
          Cuéntanos qué pasó y te ayudamos por WhatsApp.
        </p>

        {/* Banner de horario */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700 mb-6">
          Respondemos de lunes a sábado, 9am–6pm. Tiempo de respuesta: menos de 2 horas en horario hábil.
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
                style={{ '--brand-blue': BRAND.blue } as React.CSSProperties}
              />
              {submitted && !nameValid && (
                <p className="mt-1 text-xs text-red-600">Escribe tu nombre completo.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de orden <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                placeholder="#RD-XXXXXXXX"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
                style={{ '--brand-blue': BRAND.blue } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de problema
              </label>
              <select
                value={issueType}
                onChange={e => setIssueType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
                style={{ '--brand-blue': BRAND.blue } as React.CSSProperties}
              >
                {ISSUE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción del problema
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Cuéntanos con detalle qué pasó (mínimo 20 caracteres)"
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent resize-none"
                style={{ '--brand-blue': BRAND.blue } as React.CSSProperties}
              />
              <p className="mt-1 text-xs text-gray-400">
                {description.trim().length}/{MIN_DESCRIPTION_LENGTH} caracteres mínimos
              </p>
              {submitted && !descriptionValid && (
                <p className="mt-1 text-xs text-red-600">
                  Describe tu problema con al menos {MIN_DESCRIPTION_LENGTH} caracteres.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:brightness-95 text-white font-medium py-3 rounded-lg transition-all"
            >
              Enviar por WhatsApp
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
