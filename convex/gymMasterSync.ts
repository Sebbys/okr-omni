import { action, internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import {
  GOVERNED_PUBLISHED_KR_IDS,
  formatPeriodLabel,
  getPeriodEndDate,
} from "./lib/governedMetrics";

const DAILY_DASHBOARD_BASE_URL = process.env.DAILY_DASHBOARD_BASE_URL ?? "https://daily-omni.vercel.app";

type GovernedMetricStatus = "on-track" | "at-risk" | "off-track" | "insufficient-data";
type GovernedPublishStatus = "published" | "candidate" | "manual";
type GovernedMetricCadence = "monthly" | "quarterly" | "annual" | "manual";

interface GovernedMetricPayload {
  id: string;
  metricKey: string;
  name: string;
  cadence: GovernedMetricCadence;
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

interface GovernedManualMetricPayload {
  id: string;
  metricKey: string;
  name: string;
  cadence: GovernedMetricCadence;
  target: number | string;
  unit: string;
  publishStatus: GovernedPublishStatus;
  sourceFamily: "snapshot_truth" | "activity_truth" | "transaction_truth" | "manual";
  sourceReports: string[];
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

function cadenceToReviewFrequency(cadence: GovernedMetricCadence): string {
  switch (cadence) {
    case "quarterly":
      return "Quarterly";
    case "annual":
      return "Annual";
    case "manual":
      return "Manual";
    default:
      return "Monthly";
  }
}

function formatDataSource(sourceReports: string[]): string {
  return sourceReports.length > 0
    ? `Governed daily-dashboard (${sourceReports.join(", ")})`
    : "Governed daily-dashboard";
}

function formatTarget(target: number | string, unit: string): string {
  if (typeof target === "number") {
    return unit === "%" ? `${target}%` : String(target);
  }
  return target;
}

function calculateProgressPercent(current: number | null, target: number | string): number | undefined {
  if (current === null || typeof target !== "number" || target === 0) return undefined;
  return current / target;
}

function hasMetricValue(
  metric: GovernedMetricPayload | GovernedManualMetricPayload,
): metric is GovernedMetricPayload {
  return "current" in metric;
}

async function fetchGovernedFeed(period: string): Promise<{
  month: string;
  computedAt: string;
  metrics: GovernedMetricPayload[];
  candidateMetrics?: GovernedMetricPayload[];
  manualMetrics?: GovernedManualMetricPayload[];
  meta?: Record<string, unknown>;
}> {
  const url = new URL("/api/okr-metrics", DAILY_DASHBOARD_BASE_URL);
  url.searchParams.set("month", period);
  url.searchParams.set("include_candidates", "true");

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

type SyncKind = "scheduled" | "backfill";

function monthRange(start: string, end: string): string[] {
  const periods: string[] = [];
  let [year, month] = start.split("-").map(Number);
  const [endYear, endMonth] = end.split("-").map(Number);

  while (year < endYear || (year === endYear && month <= endMonth)) {
    periods.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return periods;
}

async function syncPublishedPeriod(
  ctx: any,
  period: string,
  syncKind: SyncKind,
) {
  const fetchedAt = Date.now();
  const runId = `${syncKind}:${period}:${fetchedAt}`;
  const payload = await fetchGovernedFeed(period);
  const published = (payload.metrics as GovernedMetricPayload[]).filter(
    (metric) => metric.publishStatus === "published" && GOVERNED_PUBLISHED_KR_IDS.includes(metric.id as (typeof GOVERNED_PUBLISHED_KR_IDS)[number]),
  );
  const syncablePublished = published.filter((metric) => metric.current !== null);
  const missingPublished = published.filter((metric) => metric.current === null);

  if (syncablePublished.length > 0) {
    await ctx.runMutation(internal.gymMasterSync.storeSnapshots, {
      period,
      runId,
      syncKind,
      sourceComputedAt: payload.computedAt,
      snapshots: syncablePublished.map((metric) => ({
        metricKey: metric.metricKey,
        krId: metric.id,
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
  }

  await ctx.runMutation(internal.gymMasterSync.syncKrMetadata, {
    metrics: published,
    manualMetrics: payload.manualMetrics ?? [],
  });

  if (missingPublished.length > 0) {
    await ctx.runMutation(internal.gymMasterSync.recordMissingMetrics, {
      period,
      runId,
      syncKind,
      metrics: missingPublished.map((metric) => ({
        krId: metric.id,
        metricKey: metric.metricKey,
        reason: metric.notes ?? `Published metric ${metric.id} had no current value for ${period}`,
        metadata: JSON.stringify({
          validationState: metric.validationState,
          confidence: metric.confidence,
          sourceReports: metric.sourceReports,
        }),
      })),
      createdAt: fetchedAt,
    });
  }

  await ctx.runMutation(internal.gymMasterSync.autoUpdateKRs, {
    period,
    runId,
    syncKind,
  });
}

async function requireAdminAction(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const profile = await ctx.runQuery(api.profiles.getMyProfile, {});
  if (!profile || profile.role !== "admin") {
    throw new Error("Admin access required");
  }

  return profile;
}

// Run on monthly cron to import governed monthly metrics from daily-dashboard.
export const syncAllMetrics = internalAction({
  args: {},
  handler: async (ctx) => {
    const period = getPreviousClosedMonthPeriod();
    await syncPublishedPeriod(ctx, period, "scheduled");
  },
});

export const backfillPublishedMetrics = internalAction({
  args: {
    from: v.optional(v.string()),
    to: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const from = args.from ?? "2025-04";
    const to = args.to ?? getPreviousClosedMonthPeriod();

    for (const period of monthRange(from, to)) {
      await syncPublishedPeriod(ctx, period, "backfill");
    }
  },
});

export const runPublishedSync = action({
  args: {},
  handler: async (ctx) => {
    await requireAdminAction(ctx);
    await ctx.runAction(internal.gymMasterSync.syncAllMetrics, {});
    return { ok: true, period: getPreviousClosedMonthPeriod() };
  },
});

export const runPublishedBackfill = action({
  args: {
    from: v.optional(v.string()),
    to: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdminAction(ctx);
    await ctx.runAction(internal.gymMasterSync.backfillPublishedMetrics, {
      from: args.from,
      to: args.to,
    });
    return {
      ok: true,
      from: args.from ?? "2025-04",
      to: args.to ?? getPreviousClosedMonthPeriod(),
    };
  },
});

export const storeSnapshots = internalMutation({
  args: {
    period: v.string(),
    runId: v.string(),
    syncKind: v.string(),
    sourceComputedAt: v.optional(v.string()),
    snapshots: v.array(
      v.object({
        metricKey: v.string(),
        krId: v.string(),
        value: v.number(),
        metadata: v.optional(v.string()),
      }),
    ),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    for (const snap of args.snapshots) {
      await ctx.db.insert("governedSnapshotRevision", {
        runId: args.runId,
        syncKind: args.syncKind,
        period: args.period,
        metricKey: snap.metricKey,
        krId: snap.krId,
        value: snap.value,
        metadata: snap.metadata,
        fetchedAt: args.fetchedAt,
        sourceComputedAt: args.sourceComputedAt,
      });

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
  args: {
    period: v.string(),
    runId: v.string(),
    syncKind: v.string(),
  },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("gymMasterSnapshot")
      .withIndex("by_date_and_metricKey", (q) => q.eq("date", args.period))
      .collect();

    const dateStr = getPeriodEndDate(args.period);
    const periodLabel = formatPeriodLabel(args.period);

    let updated = 0;
    for (const snapshot of snapshots) {
      const metadata = snapshot.metadata ? JSON.parse(snapshot.metadata) as { krId?: string; status?: GovernedMetricStatus } : {};
      if (!metadata.krId) continue;
      const krId = metadata.krId;

      const kr = await ctx.db
        .query("keyResults")
        .withIndex("by_krId", (q) => q.eq("krId", krId))
        .first();
      if (!kr) continue;

      const previousValue = kr.actualCurrent ? Number(kr.actualCurrent) : undefined;
      const activeOverride = await ctx.db
        .query("governedOverride")
        .withIndex("by_krId_period_active", (q) => q.eq("krId", krId).eq("period", args.period).eq("active", true))
        .first();

      if (activeOverride) {
        await ctx.db.insert("governedSyncAudit", {
          runId: args.runId,
          syncKind: args.syncKind,
          action: "sync_skipped_override",
          period: args.period,
          krId,
          metricKey: snapshot.metricKey,
          sourceValue: snapshot.value,
          previousValue,
          resultingValue: activeOverride.value,
          actor: "system",
          reason: activeOverride.reason,
          metadata: snapshot.metadata,
          createdAt: Date.now(),
        });
        continue;
      }

      await ctx.runMutation(internal.keyResults.autoUpdate, {
        krId,
        metricKey: snapshot.metricKey,
        actualCurrent: String(snapshot.value),
        status: metadata.status ? statusToDashboardStatus(metadata.status) : undefined,
        date: dateStr,
        period: periodLabel,
        sourcePeriod: args.period,
        runId: args.runId,
        syncKind: args.syncKind,
        notes: `Auto-synced from governed daily-dashboard feed (${args.period})`,
      });
      updated++;
    }

    console.log(`Auto-updated ${updated} governed KRs for period ${args.period}`);
  },
});

export const recordMissingMetrics = internalMutation({
  args: {
    period: v.string(),
    runId: v.string(),
    syncKind: v.string(),
    createdAt: v.number(),
    metrics: v.array(
      v.object({
        krId: v.string(),
        metricKey: v.string(),
        reason: v.string(),
        metadata: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const metric of args.metrics) {
      await ctx.db.insert("governedSyncAudit", {
        runId: args.runId,
        syncKind: args.syncKind,
        action: "sync_skipped_missing",
        period: args.period,
        krId: metric.krId,
        metricKey: metric.metricKey,
        actor: "system",
        reason: metric.reason,
        metadata: metric.metadata,
        createdAt: args.createdAt,
      });
    }
  },
});

export const syncKrMetadata = internalMutation({
  args: {
    metrics: v.array(
      v.object({
        id: v.string(),
        metricKey: v.string(),
        name: v.string(),
        cadence: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual"), v.literal("manual")),
        target: v.union(v.number(), v.string()),
        current: v.union(v.number(), v.null()),
        unit: v.string(),
        status: v.union(v.literal("on-track"), v.literal("at-risk"), v.literal("off-track"), v.literal("insufficient-data")),
        confidence: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
        methodology: v.string(),
        notes: v.union(v.string(), v.null()),
        publishStatus: v.union(v.literal("published"), v.literal("candidate"), v.literal("manual")),
        sourceFamily: v.union(v.literal("snapshot_truth"), v.literal("activity_truth"), v.literal("transaction_truth"), v.literal("manual")),
        sourceReports: v.array(v.string()),
        definition: v.string(),
        validationState: v.union(v.literal("validated"), v.literal("review-needed"), v.literal("not-published"), v.literal("manual-source")),
        validationRequirements: v.array(v.string()),
        previousValue: v.union(v.number(), v.null()),
        changePct: v.union(v.number(), v.null()),
      }),
    ),
    manualMetrics: v.array(
      v.object({
        id: v.string(),
        metricKey: v.string(),
        name: v.string(),
        cadence: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual"), v.literal("manual")),
        target: v.union(v.number(), v.string()),
        unit: v.string(),
        publishStatus: v.union(v.literal("published"), v.literal("candidate"), v.literal("manual")),
        sourceFamily: v.union(v.literal("snapshot_truth"), v.literal("activity_truth"), v.literal("transaction_truth"), v.literal("manual")),
        sourceReports: v.array(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const metadataRows = [...args.metrics, ...args.manualMetrics];

    for (const metric of metadataRows) {
      const kr = await ctx.db
        .query("keyResults")
        .withIndex("by_krId", (q) => q.eq("krId", metric.id))
        .first();

      if (!kr) continue;

      const patch: {
        target?: string;
        reviewFrequency?: string;
        dataSource?: string;
        progressPercent?: number;
      } = {
        target: formatTarget(metric.target, metric.unit),
        reviewFrequency: cadenceToReviewFrequency(metric.cadence),
        dataSource: formatDataSource(metric.sourceReports),
      };

      if (hasMetricValue(metric)) {
        const progressPercent = calculateProgressPercent(metric.current, metric.target);
        if (progressPercent !== undefined) {
          patch.progressPercent = progressPercent;
        }
      }

      await ctx.db.patch(kr._id, patch);
    }
  },
});
