-- ═══════════════════════════════════════════════════════════
-- MercadoRD — Migración inicial
-- Base de datos: PostgreSQL 15 (Supabase)
-- ═══════════════════════════════════════════════════════════

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Búsqueda de texto

-- ─── ENUMS ───────────────────────────────────────────────────
CREATE TYPE order_status    AS ENUM ('pending','confirmed','preparing','shipped','delivered','cancelled');
CREATE TYPE vendor_plan     AS ENUM ('free','pro','enterprise');
CREATE TYPE payment_method  AS ENUM ('azul','cardnet','transfer','cash');
CREATE TYPE delivery_type   AS ENUM ('standard','express','pickup');
CREATE TYPE payment_status  AS ENUM ('pending','approved','declined','refunded');

-- ─── PROVINCIAS DE RD (32) ────────────────────────────────────
CREATE TABLE provinces_rd (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code CHAR(3) NOT NULL UNIQUE  -- DN, STG, LV, etc.
);

INSERT INTO provinces_rd (name, code) VALUES
  ('Distrito Nacional','DN'),('Santo Domingo','SD'),('Santiago','STG'),
  ('La Vega','LV'),('San Pedro de Macorís','SPM'),('Puerto Plata','PP'),
  ('La Romana','LR'),('Barahona','BRH'),('Higüey','HG'),('Moca','MC'),
  ('Mao','MAO'),('San Francisco de Macorís','SFM'),('Azua','AZU'),
  ('Baoruco','BAO'),('Dajabón','DAJ'),('Duarte','DUA'),('Elías Piña','ELP'),
  ('El Seibo','ELS'),('Espaillat','ESP'),('Hato Mayor','HM'),
  ('Independencia','IND'),('La Altagracia','LAL'),('La Estrelleta','LE'),
  ('María Trinidad Sánchez','MTS'),('Monseñor Nouel','MN'),('Monte Cristi','MCR'),
  ('Monte Plata','MP'),('Pedernales','PED'),('Peravia','PER'),
  ('Samaná','SAM'),('Sánchez Ramírez','SR'),('San Cristóbal','SC');

-- ─── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  slug  TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL DEFAULT '📦',
  sort_order INT DEFAULT 0
);

INSERT INTO categories (name, slug, emoji, sort_order) VALUES
  ('Ropa & Moda','ropa','👗',1),('Electrónica','electronica','📱',2),
  ('Alimentos & Bebidas','alimentos','🥑',3),('Belleza & Cuidado','belleza','💄',4),
  ('Hogar & Decoración','hogar','🛋️',5),('Ferretería','ferreteria','🔧',6),
  ('Autos & Repuestos','autos','🚗',7),('Agropecuario','agro','🌿',8),
  ('Escolar & Oficina','escolar','📚',9),('Calzado','calzado','👟',10);

-- ─── USERS (extiende auth.users de Supabase) ─────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  phone       TEXT,                     -- 8095551234
  province_id INT REFERENCES provinces_rd(id),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VENDORS ─────────────────────────────────────────────────
CREATE TABLE vendors (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name  TEXT NOT NULL,
  rnc            VARCHAR(11),
  description    TEXT,
  province_id    INT REFERENCES provinces_rd(id),
  logo_url       TEXT,
  plan           vendor_plan NOT NULL DEFAULT 'free',
  is_verified    BOOLEAN DEFAULT FALSE,
  rating_avg     NUMERIC(3,2) DEFAULT 0,
  total_sales    INT DEFAULT 0,
  whatsapp       TEXT,
  instagram      TEXT,
  bank_name      TEXT,
  bank_account   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRODUCTS ────────────────────────────────────────────────
CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id    UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id  INT REFERENCES categories(id),
  province_id  INT REFERENCES provinces_rd(id),
  name         TEXT NOT NULL,
  description  TEXT,
  price_rdp    INT NOT NULL CHECK (price_rdp > 0),   -- Pesos dominicanos
  compare_rdp  INT,                                   -- Precio original
  images       TEXT[] DEFAULT '{}',
  stock        INT NOT NULL DEFAULT 0,
  sizes        TEXT[] DEFAULT '{}',
  colors       TEXT[] DEFAULT '{}',
  is_active    BOOLEAN DEFAULT TRUE,
  rating_avg   NUMERIC(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  sold_count   INT DEFAULT 0,
  view_count   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Índice de búsqueda full-text para productos
CREATE INDEX products_search_idx ON products USING GIN (
  to_tsvector('spanish', name || ' ' || COALESCE(description, ''))
);

-- ─── ORDERS ──────────────────────────────────────────────────
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id),
  status           order_status NOT NULL DEFAULT 'pending',
  delivery_type    delivery_type NOT NULL DEFAULT 'standard',
  delivery_address TEXT NOT NULL,
  province_id      INT NOT NULL REFERENCES provinces_rd(id),
  subtotal_rdp     INT NOT NULL,
  discount_rdp     INT NOT NULL DEFAULT 0,
  delivery_rdp     INT NOT NULL DEFAULT 0,
  -- ITBIS 18% calculado automáticamente
  itbis_rdp        INT GENERATED ALWAYS AS (ROUND(subtotal_rdp * 0.18)) STORED,
  total_rdp        INT NOT NULL,
  payment_method   payment_method NOT NULL DEFAULT 'azul',
  tracking_code    TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id),
  vendor_id    UUID NOT NULL REFERENCES vendors(id),
  quantity     INT NOT NULL CHECK (quantity > 0),
  price_rdp    INT NOT NULL,
  size         TEXT,
  color        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAYMENTS ────────────────────────────────────────────────
CREATE TABLE payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES orders(id),
  method        payment_method NOT NULL,
  amount_rdp    INT NOT NULL,
  status        payment_status NOT NULL DEFAULT 'pending',
  azul_order_id TEXT,
  auth_code     TEXT,
  raw_response  JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REVIEWS ─────────────────────────────────────────────────
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  product_id  UUID NOT NULL REFERENCES products(id),
  vendor_id   UUID NOT NULL REFERENCES vendors(id),
  order_id    UUID NOT NULL REFERENCES orders(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, order_id, product_id)
);

-- ─── RLS POLICIES ────────────────────────────────────────────

-- Activar RLS en todas las tablas
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews    ENABLE ROW LEVEL SECURITY;

-- Users: cada usuario solo ve su propio perfil
CREATE POLICY "users_own_profile" ON users
  FOR ALL USING (auth.uid() = id);

-- Vendors: públicos para lectura, solo el dueño puede editar
CREATE POLICY "vendors_public_read" ON vendors FOR SELECT USING (TRUE);
CREATE POLICY "vendors_own_write"   ON vendors FOR ALL   USING (auth.uid() = user_id);

-- Products: públicos, solo el vendedor puede crear/editar
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "products_vendor_write" ON products FOR ALL
  USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Orders: cada usuario ve solo sus pedidos
CREATE POLICY "orders_own" ON orders FOR ALL USING (auth.uid() = user_id);

-- ─── TRIGGER: actualizar rating de producto ───────────────────
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET
    rating_avg   = (SELECT AVG(rating) FROM reviews WHERE product_id = NEW.product_id),
    rating_count = (SELECT COUNT(*)    FROM reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_insert
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ─── FUNCIÓN: incrementar vistas de producto ──────────────────
CREATE OR REPLACE FUNCTION increment_product_views(product_id UUID)
RETURNS VOID AS $$
  UPDATE products SET view_count = view_count + 1 WHERE id = product_id;
$$ LANGUAGE sql;
