'use client'
// ============================================================
// MercadoRD — Botón "Descargar factura"
// Ruta: src/components/order/DownloadInvoiceButton.tsx
// ============================================================
// Genera el PDF en el navegador con los datos ya cargados en
// confirm/page.tsx (Server Component) — recibe todo por props.
// jsPDF se importa dinámicamente dentro del onClick para que su
// bundle (~130kB) no se descargue en la carga inicial de la página,
// solo cuando el usuario realmente pide la factura.
// ============================================================

import { useState } from 'react'
import type { InvoiceData } from '@/lib/invoice/generateInvoice'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Props {
  data: InvoiceData
}

export function DownloadInvoiceButton({ data }: Props) {
  const { t } = useTranslation('checkout')
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    const { generateInvoicePdf } = await import('@/lib/invoice/generateInvoice')
    generateInvoicePdf(data)
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="block w-full text-center bg-white border border-gray-200 text-gray-900 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60"
    >
      {loading ? t('generatingInvoice') : t('downloadInvoice')}
    </button>
  )
}
