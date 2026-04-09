import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const DAILY_DASHBOARD_BASE_URL = process.env.DAILY_DASHBOARD_BASE_URL ?? "https://daily-omni.vercel.app";

type GovernedMetricStatus = "on-track" | "at-risk" | "off-track" | "insufficient-data";
type GovernedPublishStatus = "published" | "candidate" | "manual";

interface GovernedMetricPayload {
  id: string;
  metricKey: string;
  name: string;
  target: number | string;
  current: number | null;
  unit: string;
  status: GovernedMetricStatus;
  previousValue: number | null;
  changePct: number | null;
  methodology: string;
  confidence: "high" | "medium" | "low";
  notes: string | null;
  publishStatus: GovernedPublishStatus;
  sourceFamily: "snapshot_truth" | "activity_truth" | "transaction_truth" | "manual";
  sourceReports: string[];
  definition: string;
  validationState: "validated" | "review-needed" | "not-published" | "manual-source";
  validationRequirements: string[];
}

function getPreviousClosedMonthPeriod(): string {
  const now = new Date();
  const witaNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const year = witaNow.getUTCFullYear();
  const month = witaNow.getUTCMonth() + 1;

  let targetYear = year;
  let targetMonth = month - 1;
  if (targetMonth === 0) {
    targetYear -= 1;
    targetMonth = 12;
  }

  return `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function statusToDashboardStatus(status: GovernedMetricStatus): string {
  switch (status) {
    case "on-track":
      return "On track";
    case "at-risk":
      return "Watch";
    case "off-track":
      return "Off track";
    default:
      return "No data";
  }
}

async function fetchGovernedFeed(period: string): Promise<{
  month: string;
  computedAt: string;
  metrics: GovernedMetricPayload[];
  meta?: Record<string, unknown>;
}> {
  const url = new URL("/api/okr-metrics", DAILY_DASHBOARD_BASE_URL);
  url.searchParams.set("month", period);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Governed OKR fetch failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (!payload || !Array.isArray(payload.metrics)) {
    throw new Error("Governed OKR feed returned invalid payload");
  }

  return payload;
}

// Run on monthly cron to import governed monthly metrics from daily-dashboard.
export const syncAllMetrics = internalAction({
  args: {},
  handler: async (ctx) => {
    const period = getPreviousClosedMonthPeriod();
    const fetchedAt = Date.now();
    const payload = await fetchGovernedFeed(period);

    const published = (payload.metrics as GovernedMetricPayload[]).filter((metric) => metric.publishStatus === "published");

    await ctx.runMutation(internal.gymMasterSync.storeSnapshots, {
      period,
      snapshots: published.map((metric) => ({
        metricKey: metric.metricKey,
        value: metric.current ?? 0,
        metadata: JSON.stringify({
          krId: metric.id,
          name: metric.name,
          target: metric.target,
          unit: metric.unit,
          status: metric.status,
          confidence: metric.confidence,
          sourceFamily: metric.sourceFamily,
          sourceReports: metric.sourceReports,
          validationState: metric.validationState,
          notes: metric.notes,
          computedAt: payload.computedAt,
        }),
      })),
      fetchedAt,
    });

    await ctx.runMutation(internal.gymMasterSync.autoUpdateKRs, {
      period,
    });
  },
});

export const storeSnapshots = internalMutation({
  args: {
    period: v.string(),
    snapshots: v.array(
      v.object({
        metricKey: v.string(),
        value: v.number(),
        metadata: v.optional(v.string()),
      }),
    ),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    for (const snap of args.snapshots) {
      const existing = await ctx.db
        .query("gymMasterSnapshot")
        .withIndex("by_date_and_metricKey", (q) =>
          q.eq("date", args.period).eq("metricKey", snap.metricKey),
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          value: snap.value,
          metadata: snap.metadata,
          fetchedAt: args.fetchedAt,
        });
      } else {
        await ctx.db.insert("gymMasterSnapshot", {
          date: args.period,
          metricKey: snap.metricKey,
          value: snap.value,
          metadata: snap.metadata,
          fetchedAt: args.fetchedAt,
        });
      }
    }
  },
});

export const autoUpdateKRs = internalMutation({
  args: { period: v.string() },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("gymMasterSnapshot")
      .withIndex("by_date_and_metricKey", (q) => q.eq("date", args.period))
      .collect();

    const dateStr = new Date().toISOString().slice(0, 10);
    const periodLabel = formatPeriodLabel(args.period);

    let updated = 0;
    for (const snapshot of snapshots) {
      const metadata = snapshot.metadata ? JSON.parse(snapshot.metadata) as { krId?: string; status?: GovernedMetricStatus } : {};
      if (!metadata.krId) continue;

      await ctx.runMutation(internal.keyResults.autoUpdate, {
        krId: metadata.krId,
        actualCurrent: String(snapshot.value),
        status: metadata.status ? statusToDashboardStatus(metadata.status) : undefined,
        date: dateStr,
        period: periodLabel,
        notes: `Auto-synced from governed daily-dashboard feed (${args.period})`,
      });
      updated++;
    }

    console.log(`Auto-updated ${updated} governed KRs for period ${args.period}`);
  },
});
