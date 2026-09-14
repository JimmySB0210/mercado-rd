'use client'
// ============================================================
// MercadoRD — Campana de notificaciones (Navbar)
// Ruta: src/components/shop/NotificationBell.tsx
// ============================================================
// Solo lee/actualiza — la tabla notifications bloquea INSERT
// desde el cliente (with_check: false), así que las notificaciones
// solo las crea el backend.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguageStore, type Language } from '@/lib/store/language'
import { formatDate } from '@/lib/utils'
import { BRAND } from '@/lib/colors'
import { notifications as notificationsEs, type NotificationsDict } from '@/lib/i18n/es/notifications'
import { notifications as notificationsEn } from '@/lib/i18n/en/notifications'
import { notifications as notificationsFr } from '@/lib/i18n/fr/notifications'

interface NotificationRow {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
  data: Record<string, string | number | boolean> | null
}

// Namespace "notifications" fuera de useTranslation()/NAMESPACES a
// propósito — ver el comentario en lib/i18n/es/notifications.ts.
const NOTIFICATION_TEMPLATES: Record<Language, NotificationsDict> = {
  es: notificationsEs,
  en: notificationsEn,
  fr: notificationsFr,
}

// Los montos (new_price_rdp, old_price_rdp, savings_rdp) se formatean
// con separador de miles vía es-DO — mismo locale que usa el resto del
// sitio para precios (RD$) sin importar el idioma activo de la UI.
function interpolate(template: string, data: Record<string, string | number | boolean>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(data, key)) return match
    const value = data[key]
    return typeof value === 'number' ? value.toLocaleString('es-DO') : String(value)
  })
}

// Si hay data Y una plantilla para este type en el idioma activo,
// interpola y muestra eso. Si no (type sin migrar, o data null),
// respalda al title/body guardado tal cual — nunca vacío, nunca roto.
function renderNotification(n: NotificationRow, language: Language): { title: string; body: string } {
  const template = n.data
    ? NOTIFICATION_TEMPLATES[language][n.type as keyof NotificationsDict]
    : undefined

  if (!template) return { title: n.title, body: n.body }

  const data = n.data as Record<string, string | number | boolean>
  const templateWithVariant = template as { title: string; body: string; titleFromVendor?: string }

  // new_message tiene 2 títulos posibles según quién escribe — la
  // frase entera cambia de estructura, no es un simple placeholder.
  const titleTemplate = (data.is_from_vendor && templateWithVariant.titleFromVendor)
    || templateWithVariant.title

  return {
    title: interpolate(titleTemplate, data),
    body: interpolate(template.body, data),
  }
}

function timeAgo(dateStr: string, language: Language): string {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  return formatDate(dateStr, language, { day: 'numeric', month: 'short' })
}

export function NotificationBell() {
  const router = useRouter()
  const supabase = createClient()
  const language = useLanguageStore(s => s.language)
  const containerRef = useRef<HTMLDivElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  // Conteo inicial de no leídas
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('notifications')
        .select('id, is_read')
        .eq('user_id', user.id)

      setUnreadCount((data ?? []).filter(n => !n.is_read).length)
    }
    load()
  }, [supabase])

  // Realtime — nuevas notificaciones llegan vía Supabase Realtime
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationRow
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(c => c + 1)

          // El INSERT llega antes de que el trigger corra el UPDATE que
          // rellena `data` (ver notify_low_stock), así que acá `data`
          // normalmente todavía es null y renderNotification respalda al
          // title/body en español — se corrige solo al abrir la campana,
          // que trae la fila ya completa.
          const rendered = renderNotification(newNotification, language)

          // También la mandamos como push — fire and forget, no bloquea la UI
          fetch('/api/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              title: rendered.title,
              body: rendered.body,
              url: newNotification.link,
            }),
          }).catch(err => console.error('[NotificationBell] Push send falló:', err))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, language])

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Siempre abre (idempotente) en vez de alternar. Con el toggle viejo, un
  // tap real disparaba mouseenter->open(true) y luego click->toggle a
  // false dentro del mismo gesto, así que el panel se abría y cerraba
  // antes de que se llegara a ver. Cerrar en touch queda a cargo del
  // listener de "click afuera" de abajo; en desktop, del onMouseLeave.
  const openDropdown = async () => {
    setOpen(true)
    if (userId) {
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, body, link, is_read, created_at, data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      setNotifications(data ?? [])
    }
  }

  const handleNotificationClick = async (notif: NotificationRow) => {
    if (!notif.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
      setNotifications(prev => prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n)))
      setUnreadCount(c => Math.max(0, c - 1))
    }
    setOpen(false)
    if (notif.link) router.push(notif.link)
  }

  const handleMarkAllRead = async () => {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  // Visitantes anónimos no tienen notificaciones
  if (!userId) return null

  return (
    <div
      className="relative"
      ref={containerRef}
      onPointerEnter={e => e.pointerType === 'mouse' && openDropdown()}
      onPointerLeave={e => e.pointerType === 'mouse' && setOpen(false)}
    >
      <button
        type="button"
        onClick={openDropdown}
        className="relative flex text-gray-800 border-none bg-transparent cursor-pointer p-0"
        aria-label="Notificaciones"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-2 text-white rounded-full flex items-center justify-center"
            style={{ background: BRAND.red, width: 17, height: 17, fontSize: 10, fontWeight: 700 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden"
          style={{ width: 340 }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium border-none bg-transparent cursor-pointer hover:underline"
                style={{ color: BRAND.blue }}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No tienes notificaciones todavía.
              </div>
            ) : (
              notifications.map(n => {
                const rendered = renderNotification(n, language)
                return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className="flex items-start gap-2.5 w-full text-left px-4 py-3 border-none bg-transparent cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50"
                >
                  {!n.is_read ? (
                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: BRAND.blue }} />
                  ) : (
                    <span className="w-2 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{rendered.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{rendered.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at, language)}</p>
                  </div>
                </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
