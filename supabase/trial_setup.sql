-- ====================================================================================
-- SCRIPT SQL : MISE EN PLACE DE L'ESSAI 14 JOURS ET SÉCURITÉ DE L'ABONNEMENT
-- À copier et exécuter directement dans le SQL Editor de Supabase
-- ====================================================================================

-- 1. Ajout des colonnes nécessaires à la table 'businesses' (votre table d'entreprises)
-- Si votre table s'appelle autrement (ex: profiles), changez le nom ci-dessous.
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'canceled', 'past_due', 'unpaid')),
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;


-- 2. Fonction : Définir automatiquement la fin de l'essai à la création d'un business
-- (Fixe à J+14 minuit UTC pile).
CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
  -- L'essai se termine 14 jours après la création, à la dernière seconde de la journée.
  NEW.trial_ends_at := date_trunc('day', NOW() + INTERVAL '15 days') - INTERVAL '1 second';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger : Lier la fonction à la création d'une ligne
DROP TRIGGER IF EXISTS trigger_set_trial ON businesses;
CREATE TRIGGER trigger_set_trial
BEFORE INSERT ON businesses
FOR EACH ROW
EXECUTE FUNCTION set_trial_end_date();


-- ====================================================================================
-- RLS (ROW LEVEL SECURITY) - LE "HARD WALL" CÔTÉ BASE DE DONNÉES
-- ====================================================================================
-- /!\ ATTENTION /!\ : Ne lancez la partie ci-dessous QUE SI vous avez déjà
-- activé le RLS sur vos tables et que c'est déjà configuré. 
-- Sinon, gardez l'idée, mais activez-le quand vous serez prêt.

-- Exemple de politique stricte bloquant l'accès si l'essai est échu et non payé.
-- Supposons que votre table 'sales' contienne un 'business_id'

/*
DROP POLICY IF EXISTS "Restreindre l'accès hors abonnement" ON sales;
CREATE POLICY "Restreindre l'accès hors abonnement" ON sales
FOR ALL USING (
  -- L'utilisateur appartient à ce business (vous avez sûrement déjà une logique de ce type)
  business_id IN (
    SELECT id FROM businesses 
    WHERE id = sales.business_id 
    -- CONDITION CRUCIALE : Le business paie OU a encore du temps d'essai
    AND (
      subscription_status = 'active'
      OR 
      trial_ends_at > NOW()
    )
  )
);
*/
