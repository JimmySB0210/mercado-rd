// ============================================================
// MercadoRD — Clasificación de conversaciones del vendedor
// Ruta: src/lib/inboxClassification.ts
// ============================================================
// Funciones puras sobre los pedidos del vendedor (order_items del vendedor
// + estado del pedido). Sin llamadas a la base: la página carga los datos
// una vez y aquí se derivan relaciones, pestañas y etiquetas.
//
// Definiciones:
//   - Cliente: al menos 1 pedido 'delivered' con este vendedor.
//   - Recurrente: 2 o más pedidos 'delivered' con este vendedor.
//   - Contacto: el resto (escribió, pero no tiene una compra entregada).
//   - Pedido en curso: al menos 1 pedido en pending, confirmed, preparing o shipped.
// ============================================================

export const IN_PROGRESS_STATUSES: ReadonlySet<string> = new Set(['pending', 'confirmed', 'preparing', 'shipped'])
const HISTORY_LIMIT = 10

export interface VendorOrderLine {
  orderId: string
  buyerId: string
  status: string
  amount: number
  productName: string
  createdAt: string
}

export interface OrderHistoryItem {
  orderId: string
  createdAt: string
  status: string
  amount: number
  productNames: string[]
}

export interface BuyerSummary {
  buyerId: string
  orders: number
  delivered: number
  deliveredAmount: number
  lastDeliveredAt: string | null
  inProgressOrder: { orderId: string; status: string } | null
  history: OrderHistoryItem[]
}

export type BuyerRelation = 'contact' | 'client' | 'recurring'

export function relationOf(summary: BuyerSummary | undefined): BuyerRelation {
  if (!summary || summary.delivered === 0) return 'contact'
  return summary.delivered >= 2 ? 'recurring' : 'client'
}

export function buildBuyerSummaries(lines: VendorOrderLine[]): Record<string, BuyerSummary> {
  const byBuyer = new Map<string, VendorOrderLine[]>()
  lines.forEach(line => {
    const list = byBuyer.get(line.buyerId) ?? []
    list.push(line)
    byBuyer.set(line.buyerId, list)
  })

  const result: Record<string, BuyerSummary> = {}
  byBuyer.forEach((buyerLines, buyerId) => {
    const orderIds = new Set(buyerLines.map(l => l.orderId))
    const deliveredLines = buyerLines.filter(l => l.status === 'delivered')
    const deliveredOrderIds = new Set(deliveredLines.map(l => l.orderId))

    const inProgress = buyerLines
      .filter(l => IN_PROGRESS_STATUSES.has(l.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

    const byOrder = new Map<string, OrderHistoryItem>()
    buyerLines.forEach(l => {
      const row = byOrder.get(l.orderId) ?? { orderId: l.orderId, createdAt: l.createdAt, status: l.status, amount: 0, productNames: [] }
      row.amount += l.amount
      if (!row.productNames.includes(l.productName)) row.productNames.push(l.productName)
      if (l.createdAt > row.createdAt) row.createdAt = l.createdAt
      byOrder.set(l.orderId, row)
    })

    result[buyerId] = {
      buyerId,
      orders: orderIds.size,
      delivered: deliveredOrderIds.size,
      deliveredAmount: deliveredLines.reduce((acc, l) => acc + l.amount, 0),
      lastDeliveredAt: deliveredLines.length > 0
        ? deliveredLines.reduce((max, l) => (l.createdAt > max ? l.createdAt : max), deliveredLines[0].createdAt)
        : null,
      inProgressOrder: inProgress ? { orderId: inProgress.orderId, status: inProgress.status } : null,
      history: [...byOrder.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, HISTORY_LIMIT),
    }
  })
  return result
}

export type InboxLabel = 'quote' | 'in_progress' | 'client' | 'recurring' | 'contact'

// Prioridad: cotización > pedido en curso > cliente o recurrente > contacto.
export function labelOf(hasQuote: boolean, summary: BuyerSummary | undefined): InboxLabel {
  if (hasQuote) return 'quote'
  if (summary?.inProgressOrder) return 'in_progress'
  const relation = relationOf(summary)
  if (relation === 'recurring') return 'recurring'
  if (relation === 'client') return 'client'
  return 'contact'
}

export type InboxTab = 'all' | 'unread' | 'clients' | 'orders' | 'quotes'

export interface InboxItemFlags {
  unread: number
  hasQuote: boolean
  summary: BuyerSummary | undefined
}

export function matchesTab(tab: InboxTab, item: InboxItemFlags): boolean {
  switch (tab) {
    case 'all': return true
    case 'unread': return item.unread > 0
    case 'clients': return relationOf(item.summary) !== 'contact'
    case 'orders': return !!item.summary?.inProgressOrder
    case 'quotes': return item.hasQuote
  }
}

export function countTabs(items: InboxItemFlags[]): Record<InboxTab, number> {
  const counts: Record<InboxTab, number> = { all: 0, unread: 0, clients: 0, orders: 0, quotes: 0 }
  items.forEach(item => {
    (Object.keys(counts) as InboxTab[]).forEach(tab => {
      if (matchesTab(tab, item)) counts[tab]++
    })
  })
  return counts
}
