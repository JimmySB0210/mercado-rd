// ============================================================
// MercadoRD — Tipos generados del schema de Supabase
// Actualizado manualmente para coincidir con la BD real
// ============================================================

export type VendorPlan = 'free' | 'pro' | 'enterprise'
export type ProductStatus = 'draft' | 'published' | 'paused'
export type CategoryAttributeType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
export type DeliveryType = 'standard' | 'express' | 'pickup'
export type PaymentMethod = 'azul' | 'cardnet' | 'transfer' | 'cash'
export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'refunded'

// ─── Wizard de registro de vendor (onboarding) ────────────────────────────────
export type BusinessType =
  | 'manufacturer' | 'wholesaler' | 'retailer' | 'importer' | 'distributor'
  | 'supplier' | 'private_label' | 'artisan' | 'service_provider'

export type ManufacturingStatus = 'fabricates_own' | 'buys_from_third_parties' | 'mixed'

export type ProductionTimeRange =
  | 'under_7_days' | 'days_7_15' | 'days_15_30' | 'days_30_60' | 'over_60_days'
  | 'variable' | 'custom'

export type CustomerType =
  | 'end_consumer' | 'resellers' | 'stores' | 'businesses' | 'wholesalers'
  | 'retailers' | 'manufacturers' | 'entrepreneurs' | 'distributors'

export type VendorService =
  | 'manufacturing' | 'private_label' | 'product_development' | 'formula_development'
  | 'customization' | 'packaging' | 'labeling' | 'on_demand_production' | 'product_design'
  | 'national_shipping' | 'delivery' | 'pickup' | 'importing' | 'storage' | 'distribution'
  | 'other'

export type CustomizationOption = 'yes' | 'no' | 'depends'

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
  parent_id: number | null
}

export interface PromoBanner {
  id: string
  image_url: string
  mobile_image_url: string | null
  title: string | null
  subtitle: string | null
  link_url: string | null
  sort_order: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export interface SiteSetting {
  key: string
  value: unknown
  updated_at: string
  updated_by: string | null
}

export interface User {
  id: string
  full_name: string
  phone: string | null
  province_id: number | null
  avatar_url: string | null
  is_admin: boolean
  member_id: string
  is_deleted: boolean
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
  address: string | null
  category_id: number | null
  created_at: string
  // Wizard de onboarding
  legal_name: string | null
  contact_full_name: string | null
  municipio: string | null
  sector: string | null
  latitude: number | null
  longitude: number | null
  has_physical_store: boolean | null
  has_warehouse: boolean | null
  has_workshop: boolean | null
  manufacturing_status: ManufacturingStatus | null
  min_order_quantity: number | null
  min_order_unit: string | null
  production_time: ProductionTimeRange | null
  production_time_custom: string | null
  accepts_private_label: boolean | null
  allows_customization: CustomizationOption | null
  // verification_level: protegido por trigger — nunca se envía desde el frontend
  verification_level: number
  onboarding_step: number
  onboarding_completed: boolean
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
  status: ProductStatus
  // is_active se calcula solo a partir de status (columna generada) —
  // nunca se envía directamente desde el frontend, solo se lee.
  is_active: boolean
  rating_avg: number
  rating_count: number
  sold_count: number
  view_count: number
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  size: string | null
  color: string | null
  stock: number
  price_rdp: number | null // null = usa el precio base del producto
  sku: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
}

// ─── Atributos dinámicos por categoría (tipos de producto) ────────────────────
// Un tipo de producto (ej. Smartphones, Camisetas) define sus propios
// campos vía category_attributes. Si una categoría no tiene ninguna fila
// aquí, el formulario de producto se comporta igual que antes (sin
// campos dinámicos).

export interface CategoryAttribute {
  id: number
  category_id: number
  attribute_key: string
  attribute_label: string
  attribute_type: CategoryAttributeType
  unit: string | null
  is_required: boolean
  is_recommended: boolean
  applies_to_variant: boolean
  sort_order: number
}

export interface AttributeOption {
  id: number
  category_attribute_id: number
  value: string
  label: string
  sort_order: number
  // Filtrado dependiente (ej. Modelo depende de Marca) — cuando ambos son
  // null, la opción se muestra siempre sin importar el valor de otros
  // atributos (así queda "Otro (escribir)", que nunca depende de nada).
  depends_on_attribute_key: string | null
  depends_on_value: string | null
}

export interface ProductAttributeValue {
  product_id: string
  category_attribute_id: number
  value_text: string | null
  value_number: number | null
  value_boolean: boolean | null
}

export interface VariantAttributeValue {
  variant_id: string
  category_attribute_id: number
  value_text: string | null
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
