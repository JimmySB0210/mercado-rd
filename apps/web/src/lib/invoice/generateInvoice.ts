// ============================================================
// MercadoRD — Generador de factura PDF
// Ruta: src/lib/invoice/generateInvoice.ts
// ============================================================
// Genera un PDF simple de factura en el navegador del comprador,
// usando los datos reales de la orden ya cargados en la página
// de confirmación. No requiere llamada al servidor.
//
// Requiere: npm install jspdf
// ============================================================

import jsPDF from 'jspdf'
import { formatPrice } from '@/types/database.types'
import { formatDate } from '@/lib/utils'
import type { Language } from '@/lib/store/language'

export interface InvoiceData {
  orderId: string
  createdAt: string
  buyerName: string
  buyerEmail: string
  recipientName?: string | null
  recipientPhone?: string | null
  deliveryAddress: string
  provinceName: string
  paymentMethod: string
  items: {
    productName: string
    vendorName: string
    quantity: number
    priceRdp: number
    size?: string | null
    color?: string | null
  }[]
  subtotalRdp: number
  itbisRdp: number
  deliveryRdp: number
  totalRdp: number
}

const PAYMENT_LABELS: Record<string, string> = {
  azul: 'Tarjeta (Azul)',
  cardnet: 'Tarjeta (CardNet)',
  transfer: 'Transferencia bancaria',
  cash: 'Efectivo contra entrega',
}

export function generateInvoicePdf(data: InvoiceData, language: Language): void {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 18
  let y = 20

  const shortId = data.orderId.slice(0, 8).toUpperCase()
  const date = formatDate(data.createdAt, language, {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // ─── Encabezado ───────────────────────────────────────────
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(13, 71, 161) // brand blue
  doc.text('Mercado', marginX, y)
  const mercadoWidth = doc.getTextWidth('Mercado')
  doc.setTextColor(229, 57, 53) // brand red
  doc.text('RD', marginX + mercadoWidth, y)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text('Marketplace dominicano · mercadord.com', marginX, y + 6)

  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.text(`Factura #RD-${shortId}`, pageWidth - marginX, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(date, pageWidth - marginX, y + 6, { align: 'right' })

  y += 16
  doc.setDrawColor(230, 230, 230)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 10

  // ─── Datos del comprador ──────────────────────────────────
  // buyerHeaderY fija el ancla para la columna de método de pago —
  // así se mantiene alineada a "FACTURADO A" sin importar si se agrega
  // la línea extra de destinatario (comprado por ≠ quien recibe).
  const buyerHeaderY = y
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text('FACTURADO A', marginX, y)
  y += 5
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold')
  doc.text(data.buyerName, marginX, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(data.buyerEmail, marginX, y)
  y += 5
  doc.text(data.deliveryAddress, marginX, y)
  y += 5
  doc.text(data.provinceName, marginX, y)

  if (data.recipientName) {
    y += 5
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text(
      data.recipientPhone ? `Recibe: ${data.recipientName} (${data.recipientPhone})` : `Recibe: ${data.recipientName}`,
      marginX, y
    )
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
  }

  // ─── Método de pago (columna derecha) ─────────────────────
  const rightColY = buyerHeaderY - 4
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text('MÉTODO DE PAGO', pageWidth - marginX, rightColY, { align: 'right' })
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text(PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod, pageWidth - marginX, rightColY + 5, { align: 'right' })

  y += 14

  // ─── Tabla de productos ────────────────────────────────────
  doc.setFillColor(245, 247, 250)
  doc.rect(marginX, y, pageWidth - marginX * 2, 8, 'F')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'bold')
  doc.text('PRODUCTO', marginX + 2, y + 5.5)
  doc.text('TIENDA', marginX + 78, y + 5.5)
  doc.text('CANT.', marginX + 118, y + 5.5)
  doc.text('SUBTOTAL', pageWidth - marginX - 2, y + 5.5, { align: 'right' })
  y += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)

  for (const item of data.items) {
    const variant = [item.size, item.color].filter(Boolean).join(' · ')
    const productLabel = variant ? `${item.productName} (${variant})` : item.productName
    const lineTotal = item.priceRdp * item.quantity

    doc.text(productLabel, marginX + 2, y, { maxWidth: 74 })
    doc.text(item.vendorName, marginX + 78, y, { maxWidth: 36 })
    doc.text(`x${item.quantity}`, marginX + 118, y)
    doc.text(formatPrice(lineTotal), pageWidth - marginX - 2, y, { align: 'right' })
    y += 7
  }

  y += 4
  doc.setDrawColor(230, 230, 230)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 8

  // ─── Totales ────────────────────────────────────────────────
  const totalsX = pageWidth - marginX - 50
  const valuesX = pageWidth - marginX

  doc.setFontSize(9.5)
  doc.setTextColor(80, 80, 80)
  doc.text('Subtotal', totalsX, y)
  doc.text(formatPrice(data.subtotalRdp), valuesX, y, { align: 'right' })
  y += 6

  doc.text('ITBIS (18%)', totalsX, y)
  doc.text(formatPrice(data.itbisRdp), valuesX, y, { align: 'right' })
  y += 6

  doc.text('Envío', totalsX, y)
  doc.text(formatPrice(data.deliveryRdp), valuesX, y, { align: 'right' })
  y += 8

  doc.setDrawColor(30, 30, 30)
  doc.line(totalsX - 4, y - 4, pageWidth - marginX, y - 4)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('TOTAL', totalsX, y + 2)
  doc.text(formatPrice(data.totalRdp), valuesX, y + 2, { align: 'right' })

  // ─── Pie de página ──────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text(
    'Esta factura fue generada automáticamente por MercadoRD. Para soporte, contacta a la tienda vía WhatsApp.',
    pageWidth / 2,
    pageHeight - 15,
    { align: 'center', maxWidth: pageWidth - marginX * 2 }
  )

  doc.save(`MercadoRD-Factura-${shortId}.pdf`)
}
