-- ============================================================
-- DietPro — Script SQL completo con RLS
-- Ecosistema CyC — Mayo 2026
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── 1. PRODUCTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    TEXT NOT NULL,
  name         TEXT NOT NULL,
  brand        TEXT,
  barcode      TEXT,
  category     TEXT DEFAULT 'general',
  price        NUMERIC(10,2) DEFAULT 0,
  stock        INTEGER DEFAULT 0,
  min_stock    INTEGER DEFAULT 5,
  entry_date   DATE DEFAULT CURRENT_DATE,
  expiry_date  DATE,
  image_url    TEXT,
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_products" ON products
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_expiry  ON products(expiry_date);

-- ── 2. BARCODE_CACHE (compartida entre todos los tenants) ────
CREATE TABLE IF NOT EXISTS barcode_cache (
  barcode   TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  brand     TEXT,
  category  TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE barcode_cache ENABLE ROW LEVEL SECURITY;
-- Lectura pública autenticada, inserción de cualquier tenant
CREATE POLICY "read_barcode_cache" ON barcode_cache FOR SELECT USING (true);
CREATE POLICY "insert_barcode_cache" ON barcode_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "update_barcode_cache" ON barcode_cache FOR UPDATE USING (true);

-- ── 3. STOCK_MOVEMENTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  tenant_id   TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('in','out','adjustment','waste','return')),
  quantity    INTEGER NOT NULL,
  reason      TEXT,
  seller_id   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_stock_movements" ON stock_movements
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE INDEX idx_stock_tenant    ON stock_movements(tenant_id);
CREATE INDEX idx_stock_product   ON stock_movements(product_id);
CREATE INDEX idx_stock_created   ON stock_movements(created_at DESC);

-- ── 4. SALES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      TEXT NOT NULL,
  items          JSONB NOT NULL DEFAULT '[]',
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash'
                   CHECK (payment_method IN ('cash','transfer','mercadopago','other')),
  seller_id      TEXT,
  seller_name    TEXT,
  notes          TEXT,
  cancelled      BOOLEAN DEFAULT false,
  cancelled_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_sales" ON sales
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE INDEX idx_sales_tenant  ON sales(tenant_id);
CREATE INDEX idx_sales_created ON sales(created_at DESC);

-- ── 5. OFFERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  tenant_id   TEXT NOT NULL,
  offer_price NUMERIC(10,2) NOT NULL,
  label       TEXT,
  active      BOOLEAN DEFAULT true,
  expires_at  DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_offers" ON offers
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE INDEX idx_offers_tenant  ON offers(tenant_id);
CREATE INDEX idx_offers_active  ON offers(tenant_id, active);

-- ── 6. COLLABORATORS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collaborators (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    TEXT NOT NULL,
  name         TEXT NOT NULL,
  username     TEXT NOT NULL,
  password_plain TEXT NOT NULL,
  role         TEXT DEFAULT 'collaborator',
  permissions  JSONB DEFAULT '{"sales":true,"stock":true,"offers":false,"dashboard":true}',
  active       BOOLEAN DEFAULT true,
  first_login  BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_collaborators" ON collaborators
  USING (tenant_id = current_setting('app.tenant_id', true));
CREATE POLICY "collab_self_read" ON collaborators FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE UNIQUE INDEX idx_collab_username ON collaborators(tenant_id, username);

-- ── 7. NOTIFICATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('stock_low','expiry_soon','sale_cancelled','collab_added','info')),
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  read       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_notifications" ON notifications
  USING (tenant_id = current_setting('app.tenant_id', true));

CREATE INDEX idx_notif_tenant  ON notifications(tenant_id);
CREATE INDEX idx_notif_unread  ON notifications(tenant_id, read) WHERE read = false;

-- Habilitar Realtime en notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ── 8. DIET_CONFIG ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diet_config (
  tenant_id          TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  whatsapp           TEXT,
  email              TEXT,
  address            TEXT,
  logo               TEXT,
  public_slug        TEXT UNIQUE,
  theme              TEXT DEFAULT 'dark-green',
  theme_accent       TEXT DEFAULT '#2ECC71',
  expiry_alert_days  INTEGER DEFAULT 7,
  categories         JSONB DEFAULT '["Secos","Frescos","Bebidas","Limpieza","Otros"]',
  show_prices_public BOOLEAN DEFAULT false,
  mp_link            TEXT,
  max_offers         INTEGER DEFAULT 50,
  max_products       INTEGER DEFAULT 20,
  max_collaborators  INTEGER DEFAULT 2,
  collab_config      TEXT DEFAULT '2x2',
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE diet_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_config" ON diet_config
  USING (tenant_id = current_setting('app.tenant_id', true));
-- Lectura pública para la página pública (filtrada por slug)
CREATE POLICY "public_config_read" ON diet_config FOR SELECT USING (true);

-- ── 9. PRICE_HISTORY ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tenant_id  TEXT NOT NULL,
  old_price  NUMERIC(10,2),
  new_price  NUMERIC(10,2),
  changed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_price_history" ON price_history
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ── 10. FUNCIÓN: auto-notificación en stock bajo ─────────────
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock < NEW.min_stock AND NEW.stock >= 0 THEN
    INSERT INTO notifications (tenant_id, type, title, message, product_id)
    VALUES (
      NEW.tenant_id,
      'stock_low',
      'Stock bajo: ' || NEW.name,
      'Quedan ' || NEW.stock || ' unidades de ' || NEW.name || '. Mínimo configurado: ' || NEW.min_stock,
      NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_low_stock
  AFTER UPDATE OF stock ON products
  FOR EACH ROW EXECUTE FUNCTION notify_low_stock();

-- ── 11. FUNCIÓN: auto-notificación vencimiento próximo ───────
CREATE OR REPLACE FUNCTION notify_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL AND
     NEW.expiry_date <= CURRENT_DATE + INTERVAL '7 days' AND
     NEW.expiry_date >= CURRENT_DATE THEN
    INSERT INTO notifications (tenant_id, type, title, message, product_id)
    VALUES (
      NEW.tenant_id,
      'expiry_soon',
      'Por vencer: ' || NEW.name,
      NEW.name || ' vence el ' || TO_CHAR(NEW.expiry_date, 'DD/MM/YYYY'),
      NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_expiry_alert
  AFTER INSERT OR UPDATE OF expiry_date ON products
  FOR EACH ROW EXECUTE FUNCTION notify_expiry();

-- ── 12. VISTA PÚBLICA (sin RLS, filtrada por slug) ───────────
CREATE OR REPLACE VIEW public_store AS
  SELECT
    dc.tenant_id,
    dc.name        AS store_name,
    dc.whatsapp,
    dc.email,
    dc.address,
    dc.logo,
    dc.public_slug,
    dc.theme_accent,
    dc.categories,
    dc.show_prices_public,
    COALESCE(
      json_agg(
        json_build_object(
          'id', p.id, 'name', p.name, 'brand', p.brand,
          'category', p.category, 'price', p.price,
          'image_url', p.image_url
        ) ORDER BY p.name
      ) FILTER (WHERE p.active = true AND p.stock > 0),
      '[]'
    ) AS products,
    COALESCE(
      json_agg(
        json_build_object(
          'id', o.id, 'product_id', o.product_id,
          'name', p2.name, 'brand', p2.brand,
          'original_price', p2.price, 'offer_price', o.offer_price,
          'label', o.label, 'image_url', p2.image_url,
          'category', p2.category
        ) ORDER BY o.created_at DESC
      ) FILTER (WHERE o.active = true AND (o.expires_at IS NULL OR o.expires_at >= CURRENT_DATE)),
      '[]'
    ) AS offers
  FROM diet_config dc
  LEFT JOIN products p  ON p.tenant_id = dc.tenant_id AND p.active = true
  LEFT JOIN offers  o   ON o.tenant_id = dc.tenant_id AND o.active = true
  LEFT JOIN products p2 ON p2.id = o.product_id
  GROUP BY dc.tenant_id, dc.name, dc.whatsapp, dc.email, dc.address,
           dc.logo, dc.public_slug, dc.theme_accent, dc.categories, dc.show_prices_public;

-- ============================================================
-- FIN DEL SCRIPT
-- Ejecutar sección por sección en caso de errores.
-- ============================================================
