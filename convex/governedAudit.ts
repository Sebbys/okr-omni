import { query } from "./_generated/server";
import { v } from "convex/values";
import { GOVERNED_PUBLISHED_KR_IDS, formatPeriodLabel, getPeriodEndDate } from "./lib/governedMetrics";

export const listAudit = query({
  args: {
    krId: v.optional(v.string()),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let rows = await ctx.db.query("governedSyncAudit").collect();
    if (args.krId) {
      rows = rows.filter((row) => row.krId === args.krId);
    }
    if (args.period) {
      rows = rows.filter((row) => row.period === args.period);
    }

    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listRevisions = query({
  args: {
    krId: v.optional(v.string()),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let rows = await ctx.db.query("governedSnapshotRevision").collect();
    if (args.krId) {
      rows = rows.filter((row) => row.krId === args.krId);
    }
    if (args.period) {
      rows = rows.filter((row) => row.period === args.period);
    }

    return rows.sort((a, b) => b.fetchedAt - a.fetchedAt);
  },
});

export const mirrorStatus = query({
  args: {
    period: v.string(),
  },
  handler: async (ctx, args) => {
    const periodLabel = formatPeriodLabel(args.period);
    const periodDate = getPeriodEndDate(args.period);

    const snapshots = await ctx.db
      .query("gymMasterSnapshot")
      .withIndex("by_date_and_metricKey", (q) => q.eq("date", args.period))
      .collect();

    const keyedSnapshots = snapshots.map((snapshot) => {
      let metadata: { krId?: string; status?: string } | null = null;
      try {
        metadata = snapshot.metadata ? JSON.parse(snapshot.metadata) : null;
      } catch {
        metadata = null;
      }
      return {
        metricKey: snapshot.metricKey,
        value: snapshot.value,
        krId: metadata?.krId ?? null,
        status: metadata?.status ?? null,
        fetchedAt: snapshot.fetchedAt,
      };
    });

    const rows = [];
    for (const krId of GOVERNED_PUBLISHED_KR_IDS) {
      const kr = await ctx.db
        .query("keyResults")
        .withIndex("by_krId", (q) => q.eq("krId", krId))
        .first();
      const log = (await ctx.db
        .query("updateLog")
        .withIndex("by_krId", (q) => q.eq("krId", krId))
        .collect())
        .find((item) => item.date === periodDate && item.period === periodLabel);

      const snapshot = keyedSnapshots.find((item) => item.krId === krId);
      rows.push({
        krId,
        krActualCurrent: kr?.actualCurrent ?? null,
        krStatus: kr?.status ?? null,
        logActual: log?.actual ?? null,
        logPeriod: log?.period ?? null,
        snapshotMetricKey: snapshot?.metricKey ?? null,
        snapshotValue: snapshot?.value ?? null,
        snapshotStatus: snapshot?.status ?? null,
        mirrored:
          snapshot?.value !== undefined &&
          log?.actual !== undefined &&
          String(snapshot.value) === String(log.actual) &&
          kr?.actualCurrent === String(snapshot.value),
      });
    }

    return {
      period: args.period,
      snapshotCount: snapshots.length,
      rows,
    };
  },
});
