-- ============================================================
-- DANIK — Schema isolado dentro do projeto Supabase existente
-- Todas as tabelas ficam em 'danik', sem tocar em 'public'
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Cria o schema danik
CREATE SCHEMA IF NOT EXISTS danik;

-- Define search_path para que tudo seja criado em danik
SET search_path TO danik, extensions, public;

-- Extensões (idempotente)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
-- FUNÇÃO: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION danik.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TENANTS (lojas/clientes do SaaS)
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  cnpj            TEXT,
  phone           TEXT,
  email           TEXT,
  plan            TEXT DEFAULT 'starter' CHECK (plan IN ('starter','pro','rede')),
  plan_expires_at TIMESTAMPTZ,
  settings        JSONB DEFAULT '{"cost_per_km": 0.60, "min_margin_pct": 33}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON danik.tenants
  FOR EACH ROW EXECUTE FUNCTION danik.update_updated_at();

-- ============================================================
-- PROFILES (estende auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES danik.tenants(id),
  name        TEXT NOT NULL,
  role        TEXT DEFAULT 'owner' CHECK (role IN ('owner','seller','readonly')),
  phone       TEXT,
  avatar_url  TEXT,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Trigger: cria profile ao criar usuário no DANIK
-- Só dispara se raw_user_meta_data tiver danik_tenant_id
CREATE OR REPLACE FUNCTION danik.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'danik_tenant_id') IS NOT NULL THEN
    INSERT INTO danik.profiles (id, tenant_id, name)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'danik_tenant_id')::UUID,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger antigo se existir e cria novo
DROP TRIGGER IF EXISTS danik_on_auth_user_created ON auth.users;
CREATE TRIGGER danik_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION danik.handle_new_user();

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.suppliers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES danik.tenants(id),
  name        TEXT NOT NULL,
  cnpj        TEXT,
  phone       TEXT,
  whatsapp    TEXT,
  email       TEXT,
  city        TEXT,
  state       TEXT,
  notes       TEXT,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON danik.suppliers
  FOR EACH ROW EXECUTE FUNCTION danik.update_updated_at();

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES danik.tenants(id),
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES danik.categories(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES danik.tenants(id),
  internal_code   TEXT NOT NULL,
  barcode         TEXT,
  name            TEXT NOT NULL,
  category_id     UUID REFERENCES danik.categories(id),
  supplier_id     UUID REFERENCES danik.suppliers(id),
  brand           TEXT,
  cost_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  markup          NUMERIC(10,2) GENERATED ALWAYS AS (
                    CASE WHEN cost_price > 0 THEN ROUND(sale_price / cost_price, 2) ELSE 0 END
                  ) STORED,
  margin_pct      NUMERIC(10,2) GENERATED ALWAYS AS (
                    CASE WHEN sale_price > 0 THEN ROUND(((sale_price - cost_price) / sale_price) * 100, 2) ELSE 0 END
                  ) STORED,
  min_stock       INTEGER DEFAULT 0,
  photos          TEXT[] DEFAULT '{}',
  notes           TEXT,
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, internal_code)
);
CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON danik.products
  FOR EACH ROW EXECUTE FUNCTION danik.update_updated_at();

-- ============================================================
-- PRODUCT_ITEMS (unidades físicas — RASTREABILIDADE)
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.product_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES danik.tenants(id),
  product_id            UUID NOT NULL REFERENCES danik.products(id),
  item_code             TEXT NOT NULL,
  size                  TEXT,
  color                 TEXT,
  status                TEXT DEFAULT 'in_stock' CHECK (status IN ('in_stock','in_suitcase','sold','returned','lost','damaged')),
  purchase_date         DATE,
  purchase_cost         NUMERIC(10,2),
  purchase_order_id     UUID,
  current_suitcase_id   UUID,
  current_customer_id   UUID,
  sold_at               TIMESTAMPTZ,
  sale_id               UUID,
  sold_price            NUMERIC(10,2),
  active                BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, item_code)
);
CREATE OR REPLACE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON danik.product_items
  FOR EACH ROW EXECUTE FUNCTION danik.update_updated_at();

-- ============================================================
-- ITEM_HISTORY (rastreio append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.item_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES danik.tenants(id),
  item_id         UUID NOT NULL REFERENCES danik.product_items(id),
  event_type      TEXT NOT NULL CHECK (event_type IN (
                    'purchased','stocked','suitcase_out','suitcase_returned',
                    'sold','lost','damaged','transferred','adjusted'
                  )),
  event_at        TIMESTAMPTZ DEFAULT now(),
  from_status     TEXT,
  to_status       TEXT,
  customer_id     UUID,
  suitcase_id     UUID,
  sale_id         UUID,
  user_id         UUID REFERENCES danik.profiles(id),
  notes           TEXT,
  metadata        JSONB DEFAULT '{}'
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES danik.tenants(id),
  name            TEXT NOT NULL,
  cpf             TEXT,
  birth_date      DATE,
  phone           TEXT,
  whatsapp        TEXT,
  email           TEXT,
  instagram       TEXT,
  address         TEXT,
  neighborhood    TEXT,
  city            TEXT,
  state           TEXT,
  zip_code        TEXT,
  credit_limit    NUMERIC(10,2) DEFAULT 200.00,
  credit_used     NUMERIC(10,2) DEFAULT 0.00,
  credit_score    INTEGER DEFAULT 300,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','blocked')),
  blocked_reason  TEXT,
  segment         TEXT DEFAULT 'new' CHECK (segment IN ('new','regular','vip','at_risk','churned')),
  notes           TEXT,
  referred_by     UUID REFERENCES danik.customers(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON danik.customers
  FOR EACH ROW EXECUTE FUNCTION danik.update_updated_at();

-- View: crédito disponível
CREATE OR REPLACE VIEW danik.v_customers AS
SELECT *,
  GREATEST(0, credit_limit - credit_used) AS credit_available
FROM danik.customers;

-- ============================================================
-- SUITCASES (maletas)
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.suitcases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES danik.tenants(id),
  code            TEXT NOT NULL,
  customer_id     UUID NOT NULL REFERENCES danik.customers(id),
  sent_at         TIMESTAMPTZ DEFAULT now(),
  expected_return DATE NOT NULL,
  returned_at     TIMESTAMPTZ,
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','partial_return','closed','overdue')),
  total_items     INTEGER DEFAULT 0,
  total_value     NUMERIC(10,2) DEFAULT 0,
  items_sold      INTEGER DEFAULT 0,
  value_sold      NUMERIC(10,2) DEFAULT 0,
  items_returned  INTEGER DEFAULT 0,
  delivered_by    UUID REFERENCES danik.profiles(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, code)
);
CREATE OR REPLACE TRIGGER trg_suitcases_updated_at
  BEFORE UPDATE ON danik.suitcases
  FOR EACH ROW EXECUTE FUNCTION danik.update_updated_at();

-- ============================================================
-- SUITCASE_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.suitcase_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES danik.tenants(id),
  suitcase_id       UUID NOT NULL REFERENCES danik.suitcases(id) ON DELETE CASCADE,
  item_id           UUID NOT NULL REFERENCES danik.product_items(id),
  status            TEXT DEFAULT 'with_customer' CHECK (status IN ('with_customer','sold','returned','lost')),
  consignment_price NUMERIC(10,2),
  resolved_at       TIMESTAMPTZ,
  sale_id           UUID,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PURCHASE_ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES danik.tenants(id),
  supplier_id     UUID REFERENCES danik.suppliers(id),
  code            TEXT NOT NULL,
  order_date      DATE DEFAULT CURRENT_DATE,
  total_cost      NUMERIC(10,2) DEFAULT 0,
  total_items     INTEGER DEFAULT 0,
  payment_method  TEXT,
  payment_date    DATE,
  notes           TEXT,
  status          TEXT DEFAULT 'received' CHECK (status IN ('pending','received','partial')),
  created_by      UUID REFERENCES danik.profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- ============================================================
-- SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.sales (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES danik.tenants(id),
  code             TEXT NOT NULL,
  customer_id      UUID REFERENCES danik.customers(id),
  sale_type        TEXT DEFAULT 'in_store' CHECK (sale_type IN ('in_store','online','suitcase')),
  suitcase_id      UUID REFERENCES danik.suitcases(id),
  subtotal         NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_pct     NUMERIC(5,2) DEFAULT 0,
  discount_value   NUMERIC(10,2) DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method   TEXT NOT NULL DEFAULT 'pix',
  installments     INTEGER DEFAULT 1,
  status           TEXT DEFAULT 'completed' CHECK (status IN ('completed','cancelled','partial_return')),
  seller_id        UUID REFERENCES danik.profiles(id),
  commission_pct   NUMERIC(5,2) DEFAULT 0,
  commission_value NUMERIC(10,2) DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, code)
);
CREATE OR REPLACE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON danik.sales
  FOR EACH ROW EXECUTE FUNCTION danik.update_updated_at();

CREATE TABLE IF NOT EXISTS danik.sale_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     UUID NOT NULL REFERENCES danik.sales(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES danik.product_items(id),
  quantity    INTEGER DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,
  discount    NUMERIC(10,2) DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL
);

-- ============================================================
-- STORE CREDIT (crediário)
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.store_credit_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES danik.tenants(id),
  customer_id       UUID NOT NULL REFERENCES danik.customers(id),
  sale_id           UUID REFERENCES danik.sales(id),
  total_amount      NUMERIC(10,2) NOT NULL,
  installments      INTEGER NOT NULL,
  installment_value NUMERIC(10,2) NOT NULL,
  first_due_date    DATE NOT NULL,
  status            TEXT DEFAULT 'active' CHECK (status IN ('active','paid','defaulted')),
  amount_paid       NUMERIC(10,2) DEFAULT 0,
  amount_pending    NUMERIC(10,2),
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS danik.credit_installments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES danik.tenants(id),
  account_id      UUID NOT NULL REFERENCES danik.store_credit_accounts(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES danik.customers(id),
  installment_num INTEGER NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  due_date        DATE NOT NULL,
  paid_at         TIMESTAMPTZ,
  paid_amount     NUMERIC(10,2),
  payment_method  TEXT,
  late_fee        NUMERIC(10,2) DEFAULT 0,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','negotiated')),
  days_overdue    INTEGER GENERATED ALWAYS AS (
                    CASE WHEN paid_at IS NULL AND due_date < CURRENT_DATE
                         THEN (CURRENT_DATE - due_date) ELSE 0 END
                  ) STORED,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE OR REPLACE TRIGGER trg_installments_updated_at
  BEFORE UPDATE ON danik.credit_installments
  FOR EACH ROW EXECUTE FUNCTION danik.update_updated_at();

CREATE TABLE IF NOT EXISTS danik.credit_score_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES danik.tenants(id),
  customer_id   UUID NOT NULL REFERENCES danik.customers(id),
  score_before  INTEGER,
  score_after   INTEGER,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRIP_LOGS (deslocamentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.trip_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES danik.tenants(id),
  suitcase_id     UUID REFERENCES danik.suitcases(id),
  customer_id     UUID REFERENCES danik.customers(id),
  trip_date       DATE DEFAULT CURRENT_DATE,
  trip_type       TEXT DEFAULT 'delivery' CHECK (trip_type IN ('delivery','pickup','delivery_pickup')),
  distance_km     NUMERIC(8,2) NOT NULL DEFAULT 0,
  cost_per_km     NUMERIC(6,3) DEFAULT 0.60,
  total_cost      NUMERIC(10,2) GENERATED ALWAYS AS (ROUND(distance_km * cost_per_km, 2)) STORED,
  generated_sale  BOOLEAN DEFAULT false,
  sale_value      NUMERIC(10,2) DEFAULT 0,
  notes           TEXT,
  created_by      UUID REFERENCES danik.profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS danik.notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES danik.tenants(id),
  type                TEXT NOT NULL,
  title               TEXT NOT NULL,
  body                TEXT,
  metadata            JSONB DEFAULT '{}',
  target_user_id      UUID REFERENCES danik.profiles(id),
  target_customer_id  UUID REFERENCES danik.customers(id),
  channel             TEXT DEFAULT 'app',
  sent_at             TIMESTAMPTZ,
  read_at             TIMESTAMPTZ,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','read','failed')),
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW danik.v_stock_summary AS
SELECT
  p.id, p.tenant_id, p.name, p.internal_code, p.barcode,
  p.cost_price, p.sale_price, p.markup, p.margin_pct, p.min_stock,
  p.photos, p.active,
  c.name AS category_name,
  s.name AS supplier_name,
  COUNT(pi.id) FILTER (WHERE pi.status = 'in_stock')    AS qty_in_stock,
  COUNT(pi.id) FILTER (WHERE pi.status = 'in_suitcase') AS qty_in_suitcase,
  COUNT(pi.id) FILTER (WHERE pi.status = 'sold')        AS qty_sold,
  COUNT(pi.id)                                           AS qty_total
FROM danik.products p
LEFT JOIN danik.categories c ON c.id = p.category_id
LEFT JOIN danik.suppliers s  ON s.id = p.supplier_id
LEFT JOIN danik.product_items pi ON pi.product_id = p.id AND pi.active = true
GROUP BY p.id, c.name, s.name;

CREATE OR REPLACE VIEW danik.v_suitcases_active AS
SELECT
  s.*,
  c.name AS customer_name, c.whatsapp AS customer_whatsapp,
  (CURRENT_DATE - s.expected_return) AS days_overdue
FROM danik.suitcases s
JOIN danik.customers c ON c.id = s.customer_id
WHERE s.status IN ('open','overdue','partial_return');

CREATE OR REPLACE VIEW danik.v_overdue_installments AS
SELECT
  ci.*,
  c.name AS customer_name, c.whatsapp AS customer_whatsapp,
  ROUND(ci.amount * 0.02 * ci.days_overdue / 30, 2) AS calculated_late_fee
FROM danik.credit_installments ci
JOIN danik.customers c ON c.id = ci.customer_id
WHERE ci.status IN ('pending','overdue')
ORDER BY ci.days_overdue DESC, ci.due_date;

CREATE OR REPLACE VIEW danik.v_item_trace AS
SELECT
  pi.id AS item_id, pi.item_code, pi.status AS current_status,
  p.name AS product_name, p.internal_code, p.cost_price, p.sale_price,
  ih.event_type, ih.event_at, ih.from_status, ih.to_status, ih.notes,
  c.name AS customer_name
FROM danik.item_history ih
JOIN danik.product_items pi ON pi.id = ih.item_id
JOIN danik.products p ON p.id = pi.product_id
LEFT JOIN danik.customers c ON c.id = ih.customer_id
ORDER BY ih.item_id, ih.event_at;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE danik.tenants               ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.suppliers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.product_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.item_history          ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.suitcases             ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.suitcase_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.purchase_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.sales                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.sale_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.store_credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.credit_installments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.credit_score_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.trip_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE danik.notifications         ENABLE ROW LEVEL SECURITY;

-- Helper: tenant do usuário logado (busca no schema danik)
CREATE OR REPLACE FUNCTION danik.auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM danik.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Política base: usuário só vê dados do próprio tenant
DO $$ DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'suppliers','categories','products','product_items','item_history',
    'customers','suitcases','suitcase_items','purchase_orders',
    'sales','sale_items','store_credit_accounts','credit_installments',
    'credit_score_history','trip_logs','notifications'
  ] LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS tenant_isolation ON danik.%I; CREATE POLICY tenant_isolation ON danik.%I USING (tenant_id = danik.auth_tenant_id())',
      tbl, tbl
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS own_profile ON danik.profiles;
CREATE POLICY own_profile ON danik.profiles
  USING (id = auth.uid() OR tenant_id = danik.auth_tenant_id());

-- ============================================================
-- JOBS AUTOMÁTICOS (pg_cron)
-- ============================================================

SELECT cron.unschedule('danik-mark-overdue-suitcases') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'danik-mark-overdue-suitcases'
);
SELECT cron.schedule('danik-mark-overdue-suitcases', '0 6 * * *', $$
  UPDATE danik.suitcases
  SET status = 'overdue'
  WHERE status = 'open' AND expected_return < CURRENT_DATE;
$$);

SELECT cron.unschedule('danik-mark-overdue-installments') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'danik-mark-overdue-installments'
);
SELECT cron.schedule('danik-mark-overdue-installments', '0 6 * * *', $$
  UPDATE danik.credit_installments
  SET status = 'overdue'
  WHERE status = 'pending' AND due_date < CURRENT_DATE;
$$);
