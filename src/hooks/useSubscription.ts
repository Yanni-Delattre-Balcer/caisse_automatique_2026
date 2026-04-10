// src/hooks/useSubscription.ts
// Hook centralisé pour vérifier les droits d'abonnement dans les composants.
//
// ⚠️ FEATURE GATING INACTIF : En attendant la décision finale sur les plans et
// les prix, toutes les fonctions retournent `true` par défaut. Le système est
// prêt techniquement mais n'applique aucune restriction réelle.
// Pour activer le gating, remplacer les valeurs hardcodées par la logique commentée.

import { useAuthStore } from '../store/useAuthStore';
import type { UserSubscription } from '../types';

interface SubscriptionGate {
  /** Plan actuel de l'utilisateur */
  plan: UserSubscription['plan'];
  /** Statut de l'abonnement */
  status: UserSubscription['status'];
  /** Date de fin de la période d'abonnement */
  currentPeriodEnd: string | null;
  /** L'abonnement est-il actuellement actif ? */
  isActive: boolean;
  /** Est-ce un plan Pro ou supérieur ? */
  isPro: boolean;
  /** Est-ce un plan Annuel ou supérieur ? */
  isAnnual: boolean;
  // ── Droits par fonctionnalité ── (tous true pour l'instant)
  canAccessAnalytics: boolean;
  canAccessInventory: boolean;
  canAccessZCaisse: boolean;
  canAccessCsvExport: boolean;
  canAccessSupport: boolean;
  canAccessScanner: boolean;
}

export function useSubscription(): SubscriptionGate {
  const user = useAuthStore((state) => state.user);
  const isDemo = useAuthStore((state) => state.isDemo);

  const sub = user?.subscription ?? null;

  // ── Logique future (commentée) ──────────────────────────────────────────────
  // const isActive = sub?.status === 'active' || sub?.status === 'trialing';
  // const isPro = isActive && (sub?.plan === 'pro' || sub?.plan === 'annual');
  // const isAnnual = isActive && (sub?.plan === 'annual');
  // const canAccessAnalytics = isPro;
  // const canAccessInventory = isActive;
  // const canAccessZCaisse = isActive;
  // const canAccessCsvExport = isActive;
  // const canAccessSupport = isPro;
  // const canAccessScanner = true; // disponible sur tous les plans
  // ────────────────────────────────────────────────────────────────────────────

  return {
    plan: sub?.plan ?? null,
    status: sub?.status ?? null,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,

    // Tout est activé tant que le gating n'est pas décidé
    isActive: true,
    isPro: true,
    isAnnual: true,
    canAccessAnalytics: true,
    canAccessInventory: true,
    canAccessZCaisse: true,
    canAccessCsvExport: true,
    canAccessSupport: true,
    canAccessScanner: true,
  };
}
