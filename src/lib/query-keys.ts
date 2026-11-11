/**
 * Clés React Query, centralisées : les invalidations déclenchées par le temps réel visent ces clés, jamais une chaîne
 * écrite à la main. Chaque feature ajoute ses clés ici en arrivant (web-kit § 4).
 */
export const queryKeys = {
  me: ['me'] as const,
} as const
