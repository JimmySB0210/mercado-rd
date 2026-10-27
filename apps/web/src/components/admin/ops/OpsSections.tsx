// ============================================================
// MercadoRD — Secciones del Centro de operaciones (Server Components)
// Ruta: src/components/admin/ops/OpsSections.tsx
// ============================================================
// Cada sección lee SUS datos y se pinta en cuanto están listos: la página las
// envuelve en <Suspense> con su marcador de carga, así una consulta lenta no
// retrasa todo el panel.
//
// Todas las consultas ya devuelven { ok: false } si fallan (adminOps.ts). El
// `safe()` de aquí cubre el caso raro de que algo lance una excepción antes de
// llegar a esa protección (p. ej. no poder crear el cliente de Supabase): la
// sección se pinta con su estado de error y el resto del panel sigue vivo.
// ============================================================

import {
  getAbandonedCartsChecked,
  getAttentionData,
  getDisputeCounts,
  getKpis,
  getPaymentsSummary,
  getRecentActivity,
  getRecentOrdersChecked,
  getRecentVendorsChecked,
  getTasks,
  getTechnicalStatus,
} from '@/lib/queries/adminOps'
import type { Section } from '@/lib/admin/ops'
import { AttentionCards } from './AttentionCards'
import { KpiCards } from './KpiCards'
import { TasksList } from './TasksList'
import { DisputesSummary } from './DisputesSummary'
import { ActivityFeed } from './ActivityFeed'
import { SystemStatusCard } from './SystemStatusCard'
import { AbandonedCartsCard, PaymentsCard, RecentOrdersCard, RecentVendorsCard } from './SecondaryCards'

const FAILED: Section<never> = { ok: false, error: 'inesperado' }

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.error(`[admin/ops] ${label}`, err)
    return fallback
  }
}

export async function AttentionSection({ nowMs }: { nowMs: number }) {
  const data = await safe('atencion', getAttentionData, { vendors: FAILED, content: FAILED, disputes: FAILED })
  return <AttentionCards data={data} nowMs={nowMs} />
}

export async function KpiSection({ nowMs }: { nowMs: number }) {
  const data = await safe('indicadores', () => getKpis(nowMs), {
    generatedAt: new Date(nowMs).toISOString(),
    orders: FAILED,
    vendors: FAILED,
    products: FAILED,
    users: FAILED,
  })
  return <KpiCards data={data} />
}

export async function TasksSection({ nowMs }: { nowMs: number }) {
  const data = await safe('tareas', () => getTasks(nowMs), {
    items: [],
    failed: ['dispute', 'vendor_review', 'flagged_content'] as Array<'dispute' | 'vendor_review' | 'flagged_content'>,
    totalPending: null,
  })
  return <TasksList data={data} />
}

export async function DisputesSection({ nowMs }: { nowMs: number }) {
  const data = await safe('disputas', getDisputeCounts, FAILED)
  return <DisputesSummary data={data} nowMs={nowMs} />
}

export async function ActivitySection({ nowMs }: { nowMs: number }) {
  const data = await safe('actividad', () => getRecentActivity(nowMs), FAILED)
  return <ActivityFeed data={data} />
}

export async function StatusSection() {
  const data = await safe('estado-tecnico', getTechnicalStatus, FAILED)
  return <SystemStatusCard data={data} />
}

export async function OrdersSection() {
  const data = await safe('pedidos', getRecentOrdersChecked, FAILED)
  return <RecentOrdersCard data={data} />
}

export async function PaymentsSection() {
  const data = await safe('pagos', getPaymentsSummary, FAILED)
  return <PaymentsCard data={data} />
}

export async function CartsSection() {
  const data = await safe('carritos', getAbandonedCartsChecked, FAILED)
  return <AbandonedCartsCard data={data} />
}

export async function VendorsSection() {
  const data = await safe('proveedores', getRecentVendorsChecked, FAILED)
  return <RecentVendorsCard data={data} />
}
