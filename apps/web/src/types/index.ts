// ─── Enums ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type VendorPlan    = 'free' | 'pro' | 'enterprise';
export type PaymentMethod = 'azul' | 'cardnet' | 'transfer' | 'cash';
export type DeliveryType  = 'standard' | 'express' | 'pickup';

// ─── Province (32 provincias RD) ──────────────────────────────────────────────

export interface Province {
  id:   number;
  name: string;
  code: string; // ej: "DN", "STG", "LV"
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id:          string;
  email:       string;
  full_name:   string;
  phone:       string;        // Formato: 8095551234
  province_id: number;
  avatar_url?: string;
  created_at:  string;
}

// ─── Vendor ───────────────────────────────────────────────────────────────────

export interface Vendor {
  id:            string;
  user_id:       string;
  business_name: string;
  rnc?:          string;      // RNC o cédula
  description?:  string;
  province_id:   number;
  province?:     Province;
  logo_url?:     string;
  plan:          VendorPlan;
  is_verified:   boolean;
  rating_avg:    number;
  total_sales:   number;
  whatsapp?:     string;
  instagram?:    string;
  created_at:    string;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id:    number;
  name:  string;
  slug:  string;
  emoji: string;
  count: number;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id:           string;
  vendor_id:    string;
  vendor?:      Vendor;
  category_id:  number;
  category?:    Category;
  name:         string;
  description:  string;
  price_rdp:    number;   // Precio en centavos (3200 = RD$32.00) — o pesos enteros
  compare_rdp?: number;   // Precio original (para mostrar descuento)
  images:       string[];
  stock:        number;
  sizes?:       string[];
  colors?:      string[];
  province_id:  number;
  province?:    Province;
  is_active:    boolean;
  rating_avg:   number;
  rating_count: number;
  sold_count:   number;
  created_at:   string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  product:      Product;
  quantity:     number;
  selected_size?:  string;
  selected_color?: string;
}

export interface Cart {
  items:       CartItem[];
  total_rdp:   number;
  itbis_rdp:   number;
  subtotal_rdp:number;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id:          string;
  order_id:    string;
  product_id:  string;
  product?:    Product;
  vendor_id:   string;
  vendor?:     Vendor;
  quantity:    number;
  price_rdp:   number;
  size?:       string;
  color?:      string;
}

export interface Order {
  id:               string;
  user_id:          string;
  user?:            User;
  status:           OrderStatus;
  items:            OrderItem[];
  subtotal_rdp:     number;
  discount_rdp:     number;
  delivery_rdp:     number;
  itbis_rdp:        number;
  total_rdp:        number;
  delivery_type:    DeliveryType;
  delivery_address: string;
  province_id:      number;
  province?:        Province;
  payment_method:   PaymentMethod;
  tracking_code?:   string;
  notes?:           string;
  created_at:       string;
  updated_at:       string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface Payment {
  id:             string;
  order_id:       string;
  method:         PaymentMethod;
  amount_rdp:     number;
  status:         'pending' | 'approved' | 'declined' | 'refunded';
  azul_order_id?: string;
  auth_code?:     string;
  created_at:     string;
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface Review {
  id:         string;
  user_id:    string;
  user?:      User;
  product_id: string;
  vendor_id:  string;
  order_id:   string;
  rating:     1 | 2 | 3 | 4 | 5;
  comment?:   string;
  created_at: string;
}

// ─── API Response helpers ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data:    T | null;
  error:   string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data:       T[];
  count:      number;
  page:       number;
  page_size:  number;
  has_more:   boolean;
}
