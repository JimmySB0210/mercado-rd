'use client'
// ============================================================
// MercadoRD — Hook de detección de viewport mobile
// Archivo: lib/hooks/useIsMobile.ts
// ============================================================
// USO:
//   const isMobile = useIsMobile() // breakpoint 1010px por defecto
//   const isMobile = useIsMobile(768)
// ============================================================
// El valor inicial es `false` (desktop) para que coincida con lo que
// el servidor renderiza (window no existe ahí) — la detección real
// corre en un useEffect tras el montaje, evitando mismatch de
// hidratación. En la primera pintura del cliente puede haber un
// parpadeo de un frame si el viewport real es mobile; aceptable para
// este caso de uso.
// ============================================================

import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint = 1010): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mql.matches)

    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [breakpoint])

  return isMobile
}
