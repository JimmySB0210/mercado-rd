// ============================================================
// MercadoRD — Tipos del frontend (capa de compatibilidad)
// ============================================================
// database.types.ts es la fuente de verdad (coincide con el
// schema real de Supabase). Este archivo reexporta esos tipos
// para no romper los imports existentes de '@/types', y solo
// extiende Product/Order con relaciones opcionales embebidas
// (vendor/category/province, user/items) porque varios
// componentes del frontend las acceden directo sobre el tipo
// base en vez de usar ProductWithVendor/OrderWithItems.
// ============================================================

import type {
  Product as DBProduct,
  Order as DBOrder,
  Vendor,
  Category,
  Province,
  User,
  OrderItem,
} from './database.types'

export type {
  VendorPlan,
  OrderStatus,
  DeliveryType,
  PaymentMethod,
  PaymentStatus,
  Province,
  Category,
  User,
  Vendor,
  Payment,
  Review,
  OrderItem,
} from './database.types'

export interface Product extends DBProduct {
  vendor?: Vendor
  category?: Category
  province?: Province
}

export interface Order extends DBOrder {
  user?: User
  items?: OrderItem[]
  province?: Province
}

// ─── Cart (concepto solo del frontend, no existe en la BD) ────────────────────

export interface CartItem {
  product: Product
  quantity: number
  selected_size?: string
  selected_color?: string
  variant_id?: string
  variant_price_rdp?: number
  // Etiqueta ya armada para variantes con atributos dinámicos (ej.
  // "Capacidad: 128 GB · Color: Negro") — evita que el carrito tenga
  // que resolver de nuevo contra la BD. Si no viene, la UI del carrito
  // sigue mostrando selected_size/selected_color como hasta ahora.
  variant_label?: string
}

export interface Cart {
  items: CartItem[]
  total_rdp: number
  itbis_rdp: number
  subtotal_rdp: number
}

// ─── API Response helpers ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  page_size: number
  has_more: boolean
}
