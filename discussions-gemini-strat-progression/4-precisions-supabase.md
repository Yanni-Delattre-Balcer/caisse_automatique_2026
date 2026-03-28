# ☁️ Précisions sur l'Infrastructure Supabase

## 📌 Table des Matières
- [Pourquoi Supabase ?](#pourquoi-supabase-)
- [1. Le Plan Gratuit (Free Tier)](#1-le-plan-gratuit-free-tier)
- [2. Le Passage au Mode Pro](#2-le-passage-au-mode-pro)
- [3. Script SQL de Base (SaaS Multi-tenant)](#3-script-sql-de-base-saas-multi-tenant)

---

## Pourquoi Supabase ?
Pour un projet "Caisse 2026", Supabase est le choix optimal :
- **SQL (PostgreSQL)** : Base relationnelle indispensable pour la cohérence des chiffres.
- **Realtime** : Mise à jour instantanée des stocks sur tous les terminaux.
- **Sécurité (RLS)** : Isolation native des données par entreprise.

---

## 1. Le Plan Gratuit (Free Tier)
> [!TIP]
> Idéal pour lancer votre MVP et valider vos premières ventes sans frais.

- **Base de données (500 MB)** : Suffisant pour des centaines de milliers de transactions.
- **Authentification illimitée** : Autant de commerçants que nécessaire.
- **Bande passante (5 GB/mois)** : Largement suffisant pour du JSON.
- **Realtime** : Jusqu'à 200 connexions simultanées.

> [!WARNING]
> **Le mode Pause** : Si aucune activité pendant 7 jours, la base s'endort. Le réveil peut prendre ~30s pour le premier client.

---

## 2. Le Passage au Mode Pro
Le forfait suivant est à **25$ / mois**. À envisager uniquement si :
- Vous dépassez 500 MB de données.
- Vous exigez des **sauvegardes automatiques quotidiennes** (Recommandé pour rassurer les clients payants).
- Vous dépassez 200 clients connectés simultanément.

---

## 3. Script SQL de Base (SaaS Multi-tenant)
Copiez-collez ce script dans le **SQL Editor** de Supabase pour initialiser votre structure.

```sql
-- 1. Table des Entreprises (SaaS Tenants)
CREATE TABLE businesses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users NOT NULL,
  business_type text CHECK (business_type IN ('retail', 'restauration', 'service', 'beaute')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table des Produits
CREATE TABLE products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  price_ht numeric(10,2) NOT NULL,
  tva_rate numeric(5,2) DEFAULT 20.0,
  category text,
  stock_quantity integer DEFAULT 0,
  barcode text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table des Ventes (Immuable NF525 Ready)
CREATE TABLE sales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES businesses(id) NOT NULL,
  total_ttc numeric(10,2) NOT NULL,
  payment_method text,
  items jsonb NOT NULL, -- Détail du panier
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SECURITE : Row Level Security (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Isolation : Un utilisateur ne voit que ses données
CREATE POLICY "Accès entreprise par propriétaire" ON businesses 
FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Accès produits par entreprise" ON products 
FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Accès ventes par entreprise" ON sales 
FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
```

---
**Navigation :** [Bilan](file:///home/briacl/Development/caisse_automatique_2026/discussions-gemini-strat-progression/1-bilan_developpement_1.md) | [Stratégie](file:///home/briacl/Development/caisse_automatique_2026/discussions-gemini-strat-progression/3-strat2.md) | [Guide IA](file:///home/briacl/Development/caisse_automatique_2026/discussions-gemini-strat-progression/5-supabase-etude.md)
ns sales est de type jsonb, ce qui permet de stocker le détail d'une vente sans créer 50 tables compliquées au début.