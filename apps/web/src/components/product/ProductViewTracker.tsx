'use client'
// ============================================================
// MercadoRD — Tracker de vistas de producto
// Ruta: src/components/product/ProductViewTracker.tsx
// ============================================================
// La página de producto es estática (ISR), así que el conteo de
// vistas se dispara desde el cliente en cada visita real en vez
// de en el render del servidor.
// ============================================================

import { useEffect } from 'react'

export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    fetch(`/api/views/${productId}`, { method: 'POST' }).catch(() => {})
  }, [productId])

  return null
}
