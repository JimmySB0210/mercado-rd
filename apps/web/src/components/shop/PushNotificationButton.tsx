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

// navigator.serviceWorker.ready solo resuelve cuando YA hay un SW
// activo controlando la página — si el registro está atascado en
// "installing"/"waiting" (primera visita, SW nuevo, etc.) esa promesa
// no resuelve nunca. Esta versión registra explícitamente y escucha
// el statechange hasta "activated" en vez de esperar pasivamente.
const getSWRegistration = (): Promise<ServiceWorkerRegistration> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Service Worker no disponible'))
    }, 15000)

    // Si ya hay un SW activo, úsalo directamente
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        clearTimeout(timeout)
        resolve(reg)
      }).catch(reject)
      return
    }

    // Esperar a que se registre y active
    navigator.serviceWorker.register('/sw.js').then(reg => {
      if (reg.active) {
        clearTimeout(timeout)
        resolve(reg)
        return
      }
      const sw = reg.installing || reg.waiting
      if (sw) {
        sw.addEventListener('statechange', function () {
          if (this.state === 'activated') {
            clearTimeout(timeout)
            resolve(reg)
          }
        })
      }
    }).catch(err => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

export function PushNotificationButton() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setError(null)
    try {
      const reg = await getSWRegistration()

      // El navegador a veces nunca resuelve subscribe() (permiso
      // bloqueado silenciosamente, push service caído, etc.) —
      // con timeout evitamos que el botón se quede colgado en
      // "Activando..." para siempre.
      const subscribeWithTimeout = Promise.race([
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout esperando pushManager.subscribe()')), 10000)
        ),
      ])
      const sub = await subscribeWithTimeout as PushSubscription

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error('[push] /api/push/subscribe respondió', res.status, text)
        throw new Error(`/api/push/subscribe falló (${res.status})`)
      }

      setSubscribed(true)
      setPermission('granted')
    } catch (err: any) {
      console.error('[push] Push subscription error:', err)
      setError(
        err instanceof Error && (err.message.startsWith('Timeout') || err.message === 'Service Worker no disponible')
          ? 'No se pudo activar (tardó demasiado). Intenta de nuevo.'
          : 'No se pudieron activar las notificaciones. Intenta de nuevo.'
      )
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
    <div>
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
      {error && (
        <p style={{ fontSize: 11, color: BRAND.red, marginTop: 4 }}>{error}</p>
      )}
    </div>
  )
}
