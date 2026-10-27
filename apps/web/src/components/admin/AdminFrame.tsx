'use client'
// ============================================================
// MercadoRD — Marco común de las páginas de /admin
// Ruta: src/components/admin/AdminFrame.tsx
// ============================================================
// Menú lateral (columna fija en escritorio, cajón en móvil), barra superior y
// el contenido de cada página. Lo usan TODAS las páginas de /admin a través de
// AdminShell, así el menú y la barra no cambian al navegar entre secciones.
//
// Accesibilidad del cajón: se abre con el botón de la barra, enfoca su primer
// enlace, atrapa el Tab, se cierra con Escape, con el botón ✕, al pulsar fuera
// o al navegar, y devuelve el foco al botón que lo abrió.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { AdminOpsStyles } from './AdminOpsStyles'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'

export function AdminFrame({ adminName, children }: { adminName: string | null; children: React.ReactNode }) {
  const { t } = useTranslation('admin')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const closeAndRestoreFocus = useCallback(() => {
    setOpen(false)
    menuButtonRef.current?.focus()
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  // Si la pantalla pasa a ser de escritorio con el cajón abierto (p. ej. al girar una tableta), el cajón deja de verse:
  // se cierra para no dejar el desplazamiento de la página bloqueado ni el Tab atrapado en algo invisible.
  useEffect(() => {
    if (!open) return
    const desktop = window.matchMedia('(min-width: 860px)')
    const onChange = (e: MediaQueryListEvent) => { if (e.matches) setOpen(false) }
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [open])

  useEffect(() => {
    if (!open) return
    const drawer = drawerRef.current
    const focusables = () => Array.from(drawer?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
    focusables()[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeAndRestoreFocus()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, closeAndRestoreFocus])

  return (
    <div className="adm-shell">
      <AdminOpsStyles />
      <a className="adm-skip" href="#adm-main">{t('opsNav.skip')}</a>

      <aside className="adm-side">
        <AdminSidebar />
      </aside>

      <div className="adm-col-main">
        <AdminTopbar ref={menuButtonRef} adminName={adminName} menuOpen={open} onMenu={() => setOpen(true)} />
        <main id="adm-main" className="adm-content" tabIndex={-1}>
          {children}
        </main>
      </div>

      {open && (
        <div className="adm-drawer-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) closeAndRestoreFocus() }}>
          <div id="adm-drawer" ref={drawerRef} className="adm-drawer" role="dialog" aria-modal="true" aria-label={t('opsNav.aria')}>
            <button type="button" className="adm-drawer-close" onClick={closeAndRestoreFocus} aria-label={t('closeMenuAria')}>
              <X size={20} aria-hidden="true" />
            </button>
            <AdminSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
