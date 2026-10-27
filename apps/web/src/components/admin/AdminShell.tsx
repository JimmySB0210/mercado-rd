// ============================================================
// MercadoRD — Marco de las páginas de /admin (Server Component)
// Ruta: src/components/admin/AdminShell.tsx
// ============================================================
// Cada página de /admin comprueba primero que el usuario es admin y solo
// entonces se envuelve en <AdminShell>. El nombre del admin sale de la misma
// lectura de sesión que isCurrentUserAdmin() (se comparte por petición), así
// que el marco no añade consultas nuevas.
// ============================================================

import { getCurrentAdminSession } from '@/lib/queries/admin'
import { AdminFrame } from './AdminFrame'

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await getCurrentAdminSession()
  return <AdminFrame adminName={session.fullName}>{children}</AdminFrame>
}
