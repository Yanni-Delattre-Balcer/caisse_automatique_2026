-- ============================================================
-- OmniPOS — Schéma Supabase complet
-- À exécuter dans Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
-- ============================================================

-- Commerce / Entreprise
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('Restauration', 'Retail', 'Beauté', 'Multi-services', 'Autre')),
  address TEXT,
  phone TEXT,
  email TEXT,
  siret TEXT,
  tva_intracom TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index unique : un owner = un commerce (pour l'instant)
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);

-- Produits / Catalogue
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  tva_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  category TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  barcode TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(business_id, category);

-- Ventes / Tickets
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  total_ttc NUMERIC(10,2) NOT NULL,
  total_ht NUMERIC(10,2),
  total_tva NUMERIC(10,2),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CB', 'Espèces', 'Mixte', 'Autre')),
  items JSONB NOT NULL DEFAULT '[]',
  cashier_name TEXT,
  client_name TEXT,
  receipt_number TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_business ON sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment ON sales(business_id, payment_method);

-- Catégories personnalisées (optionnel)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0055ff',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique ON categories(business_id, name);

-- Staff / Caissiers
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pin_code TEXT,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_business ON staff(business_id);

-- Abonnements / Stripe
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'monthly', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_business ON subscriptions(business_id);

-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Businesses: le propriétaire voit/modifie uniquement son commerce
CREATE POLICY "businesses_owner_select" ON businesses
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "businesses_owner_insert" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "businesses_owner_update" ON businesses
  FOR UPDATE USING (auth.uid() = owner_id);

-- Products: accès via le business_id lié à l'owner
CREATE POLICY "products_business_select" ON products
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_business_insert" ON products
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_business_update" ON products
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "products_business_delete" ON products
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Sales: même logique
CREATE POLICY "sales_business_select" ON sales
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "sales_business_insert" ON sales
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Categories
CREATE POLICY "categories_business_all" ON categories
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Staff
CREATE POLICY "staff_business_all" ON staff
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Subscriptions
CREATE POLICY "subscriptions_business_select" ON subscriptions
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- 4. FONCTIONS UTILITAIRES
-- ============================================================

-- Auto-update du champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Générer un numéro de reçu séquentiel par commerce
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(receipt_number FROM '#([0-9]+)$') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM sales
  WHERE business_id = NEW.business_id;

  NEW.receipt_number := 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_receipt_number
  BEFORE INSERT ON sales
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL)
  EXECUTE FUNCTION generate_receipt_number();

-- 5. REALTIME
-- ============================================================
-- Activer le Realtime sur les tables nécessaires
-- (À faire dans le Dashboard Supabase > Database > Replication)
-- Tables à activer: products, sales

-- 6. DONNÉES DE SEED (optionnel pour les tests)
-- ============================================================
-- Décommentez si vous voulez des données de test après inscription

-- INSERT INTO categories (business_id, name, color, sort_order) VALUES
--   ('VOTRE_BUSINESS_ID', 'Viennoiserie', '#f59e0b', 1),
--   ('VOTRE_BUSINESS_ID', 'Pains', '#84cc16', 2),
--   ('VOTRE_BUSINESS_ID', 'Boissons', '#06b6d4', 3),
--   ('VOTRE_BUSINESS_ID', 'Snacking', '#f97316', 4),
--   ('VOTRE_BUSINESS_ID', 'Pâtisserie', '#ec4899', 5);
