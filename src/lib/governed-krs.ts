export const GOVERNED_PUBLISHED_KR_IDS = ["KR-008", "KR-010", "KR-023", "KR-025"] as const;

const GOVERNED_PUBLISHED_KR_SET = new Set<string>(GOVERNED_PUBLISHED_KR_IDS);

export function isGovernedPublishedKr(krId: string) {
  return GOVERNED_PUBLISHED_KR_SET.has(krId);
}
