import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('votre-projet');

if (!isConfigured) {
  console.warn(
    '[Heryze] Variables Supabase non configurées dans .env → Mode démo actif (aucune donnée cloud).'
  );
}

// On crée le client avec des valeurs fallback pour éviter le crash au démarrage.
// En mode démo, toutes les requêtes Supabase échoueront silencieusement (géré par useAuthStore).
export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder-key'
);

export const isSupabaseConfigured = isConfigured;
