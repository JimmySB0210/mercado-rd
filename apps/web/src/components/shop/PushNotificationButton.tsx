'use client'
// ============================================================
// MercadoRD — Botón de activación de notificaciones push
// Ruta: src/components/shop/PushNotificationButton.tsx
// ============================================================

import { useState, useEffect } from 'react'
import { BRAND } from '@/lib/colors'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

// El navegador requiere el applicationServerKey como Uint8Array,
// no como el string base64url que entrega la variable de entorno.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}

export function PushNotificationButton() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported('Notification' in window && 'serviceWorker' in navigator)

    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
    // Verificar si ya está suscrito
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub)
        })
      })
    }
  }, [])

  const subscribe = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      setSubscribed(true)
      setPermission('granted')
    } catch (err) {
      console.error('Push subscription error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null
  if (permission === 'denied') return null
  if (subscribed) return (
    <div style={{ fontSize: 12, color: BRAND.green }}>🔔 Notificaciones activadas</div>
  )

  return (
    <button
      onClick={subscribe}
      disabled={loading}
      style={{
        background: 'none', border: `1px solid ${BRAND.blue}`, borderRadius: 8,
        padding: '6px 12px', fontSize: 12, color: BRAND.blue, cursor: loading ? 'default' : 'pointer'
      }}
    >
      {loading ? 'Activando...' : '🔔 Activar notificaciones'}
    </button>
  )
}
