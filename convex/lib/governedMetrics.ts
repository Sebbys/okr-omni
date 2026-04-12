export const GOVERNED_PUBLISHED_KR_IDS = ["KR-008", "KR-010", "KR-023", "KR-025"] as const;

export type GovernedPublishedKrId = (typeof GOVERNED_PUBLISHED_KR_IDS)[number];

const GOVERNED_KR_ID_SET = new Set<string>(GOVERNED_PUBLISHED_KR_IDS);

export function isGovernedPublishedKr(krId: string): krId is GovernedPublishedKrId {
  return GOVERNED_KR_ID_SET.has(krId);
}

export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function getPeriodEndDate(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const monthEnd = new Date(Date.UTC(year, month, 0));
  return monthEnd.toISOString().slice(0, 10);
}

export function parseNumericValue(value?: string): number | undefined {
  if (value === undefined) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}
