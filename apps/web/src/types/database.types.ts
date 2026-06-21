// ============================================================
// MercadoRD — Tipos generados del schema de Supabase
// Actualizado manualmente para coincidir con la BD real
// ============================================================

export type VendorPlan = 'free' | 'pro' | 'enterprise'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
export type DeliveryType = 'standard' | 'express' | 'pickup'
export type PaymentMethod = 'azul' | 'cardnet' | 'transfer' | 'cash'
export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'refunded'

// ─── Tablas base ────────────────────────────────────────────────────────────

export interface Province {
  id: number
  name: string
  code: string
}

export interface Category {
  id: number
  name: string
  slug: string
  emoji: string
  sort_order: number
}

export interface User {
  id: string
  full_name: string
  phone: string | null
  province_id: number | null
  avatar_url: string | null
  is_admin: boolean
  created_at: string
}

export interface Vendor {
  id: string
  user_id: string
  business_name: string
  rnc: string | null
  description: string | null
  province_id: number | null
  logo_url: string | null
  plan: VendorPlan
  is_verified: boolean
  rating_avg: number
  total_sales: number
  whatsapp: string | null
  instagram: string | null
  bank_name: string | null
  bank_account: string | null
  created_at: string
}

export interface Product {
  id: string
  vendor_id: string
  category_id: number | null
  province_id: number | null
  name: string
  description: string | null
  price_rdp: number        // precio en centavos de RD$
  compare_rdp: number | null
  images: string[]
  stock: number
  sizes: string[]
  colors: string[]
  is_active: boolean
  rating_avg: number
  rating_count: number
  sold_count: number
  view_count: number
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  delivery_type: DeliveryType
  delivery_address: string
  province_id: number
  subtotal_rdp: number
  discount_rdp: number
  delivery_rdp: number
  itbis_rdp: number        // calculado automáticamente: subtotal * 0.18
  total_rdp: number
  payment_method: PaymentMethod
  tracking_code: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  vendor_id: string
  quantity: number
  price_rdp: number
  size: string | null
  color: string | null
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  method: PaymentMethod
  amount_rdp: number
  status: PaymentStatus
  azul_order_id: string | null
  auth_code: string | null
  raw_response: Record<string, unknown> | null
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  product_id: string
  vendor_id: string
  order_id: string
  rating: 1 | 2 | 3 | 4 | 5
  comment: string | null
  created_at: string
}

// ─── Tipos con relaciones (para queries con joins) ───────────────────────────

export interface ProductWithVendor extends Product {
  vendor: Pick<Vendor, 'id' | 'business_name' | 'logo_url' | 'is_verified' | 'rating_avg' | 'whatsapp'>
  category: Pick<Category, 'id' | 'name' | 'slug' | 'emoji'> | null
  province: Pick<Province, 'id' | 'name'> | null
}

export interface OrderWithItems extends Order {
  items: (OrderItem & {
    product: Pick<Product, 'id' | 'name' | 'images' | 'price_rdp'>
    vendor: Pick<Vendor, 'id' | 'business_name'>
  })[]
  province: Pick<Province, 'id' | 'name'>
}

export interface VendorWithProducts extends Vendor {
  products: Product[]
  province: Pick<Province, 'id' | 'name'> | null
}

// ─── Utilidades de precio ─────────────────────────────────────────────────────

/**
 * Convierte centavos a RD$ formateado
 * Ejemplo: 8500000 → "RD$85,000"
 */
export function formatPrice(centavos: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(centavos / 100)
}

/**
 * Calcula el descuento en porcentaje
 */
export function discountPercent(price: number, compare: number): number {
  return Math.round(((compare - price) / compare) * 100)
}
