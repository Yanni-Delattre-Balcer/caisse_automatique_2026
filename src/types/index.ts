// Statut d'abonnement de l'utilisateur (depuis la table `subscriptions`)
export interface UserSubscription {
  plan: 'starter' | 'business' | 'expert' | 'monthly' | 'pro' | null;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid' | null;
  currentPeriodEnd: string | null; // ISO date string
}

// L'utilisateur tel qu'exposé par useAuthStore
export interface AppUser {
  id: string;
  email: string;
  companyName: string | null;    // Depuis businesses.name
  businessDomain: string | null; // Depuis businesses.business_type
  businessId: string | null;     // UUID de businesses.id
  subscription: UserSubscription | null; 
  trialEndsAt: string | null;    // Nouveau: date de fin d'essai
  subscriptionStatus: 'trial' | 'active' | 'canceled' | 'past_due' | 'unpaid' | null;
}

// Un produit tel qu'exposé par useCatalogStore (prix TTC calculé côté client)
export interface CatalogItem {
  id: string;
  name: string;
  price: number;       // TTC — calculé côté client depuis price_ht + tva_rate
  price_ht: number;
  tva_rate: number;
  category: string | null;
  stock: number | null;
  barcode: string | null;
}

// Un article dans le panier
export interface CartItem extends CatalogItem {
  quantity: number;
}

// Payload d'une vente envoyé à Supabase
export interface SalePayload {
  business_id: string;
  total_ttc: number;
  payment_method: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  created_at: string;
}

// Donnée brute retournée par Supabase pour un produit
export interface SupabaseProduct {
  id: string;
  name: string;
  price_ht: number;
  tva_rate: number;
  category: string | null;
  stock_quantity: number;
  barcode: string | null;
}
