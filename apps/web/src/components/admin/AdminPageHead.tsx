'use client'
// ============================================================
// MercadoRD — Cabecera de página del panel de administración
// Ruta: src/components/admin/AdminPageHead.tsx
// ============================================================
// Título (h1) y subtítulo. Las páginas son Server Components y el texto
// traducido vive en el cliente, así que reciben las CLAVES del diccionario.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'

type AdminKey = Parameters<ReturnType<typeof useAdminKeyProbe>['t']>[0]

// Solo sirve para obtener el tipo de las claves; no se usa en tiempo de ejecución.
function useAdminKeyProbe() {
  return useTranslation('admin')
}

export function AdminPageHead({ titleKey, subtitleKey, children }: { titleKey: AdminKey; subtitleKey?: AdminKey; children?: React.ReactNode }) {
  const { t } = useTranslation('admin')
  return (
    <div className="adm-page-head">
      <div>
        <h1 className="adm-h1">{t(titleKey)}</h1>
        {subtitleKey && <p className="adm-sub">{t(subtitleKey)}</p>}
      </div>
      {children}
    </div>
  )
}
