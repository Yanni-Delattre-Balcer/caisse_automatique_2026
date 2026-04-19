import { useAuthStore } from '../store/useAuthStore';
import type { UserSubscription } from '../types';

interface SubscriptionGate {
  plan: UserSubscription['plan'] | null;
  status: UserSubscription['status'] | null;
  currentPeriodEnd: string | null;
  isActive: boolean;
  isPro: boolean;
  isAnnual: boolean;
  canAccessAnalytics: boolean;
  canAccessInventory: boolean;
  canAccessZCaisse: boolean;
  canAccessCsvExport: boolean;
  canAccessSupport: boolean;
  canAccessScanner: boolean;
}

// Niveau numérique par plan — les aliases 'monthly'/'pro' sont des noms legacy
const PLAN_LEVEL: Record<string, number> = {
  starter: 1, monthly: 1,
  business: 2, pro: 2,
  expert: 3,
};

function planLevel(plan: string | null | undefined): number {
  return PLAN_LEVEL[plan ?? ''] ?? 1;
}

export function useSubscription(): SubscriptionGate {
  const user = useAuthStore((state) => state.user);
  const isDemo = useAuthStore((state) => state.isDemo);

  if (isDemo) {
    return {
      plan: 'starter', status: 'trialing', currentPeriodEnd: null,
      isActive: true, isPro: false, isAnnual: false,
      canAccessAnalytics: true, canAccessInventory: true,
      canAccessZCaisse: true, canAccessCsvExport: true,
      canAccessSupport: false, canAccessScanner: true,
    };
  }

  const sub = user?.subscription ?? null;
  const subscriptionStatus = user?.subscriptionStatus ?? null;

  // Utilisateur en essai = accès starter sans ligne dans subscriptions
  const isTrial = subscriptionStatus === 'trial';
  const isActive = isTrial || sub?.status === 'active' || sub?.status === 'trialing';

  // Plan effectif : depuis subscriptions si abonné, 'starter' si en essai
  const effectivePlan = sub?.plan ?? (isTrial ? 'starter' : null);
  const level = planLevel(effectivePlan);

  const starter  = isActive && level >= 1;
  const business = isActive && level >= 2;

  return {
    plan: effectivePlan as UserSubscription['plan'],
    status: sub?.status ?? (isTrial ? 'trialing' : null),
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    isActive,
    isPro: business,
    isAnnual: false, // facturation annuelle non encore implémentée
    canAccessAnalytics:  starter,
    canAccessInventory:  starter,
    canAccessZCaisse:    starter,
    canAccessCsvExport:  starter,   // export CSV Z-Caisse : tous les plans actifs
    canAccessSupport:    business,  // support prioritaire : Business+
    canAccessScanner:    starter,
  };
}
