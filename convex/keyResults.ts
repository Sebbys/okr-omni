import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireEditDepartment } from "./lib/auth";
import { isGovernedPublishedKr, parseNumericValue } from "./lib/governedMetrics";

type ObjectiveStatsAccumulator = Record<string, {
  objectiveId: string;
  objective: string;
  total: number;
  achieved: number;
  onTrack: number;
  watch: number;
  offTrack: number;
  noData: number;
  totalProgress: number;
  progressCount: number;
}>;

export const list = query({
  args: {
    objectiveId: v.optional(v.string()),
    status: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    let results;
    if (args.objectiveId) {
      results = await ctx.db.query("keyResults").withIndex("by_objectiveId", (q) => q.eq("objectiveId", args.objectiveId!)).collect();
    } else if (args.status) {
      results = await ctx.db.query("keyResults").withIndex("by_status", (q) => q.eq("status", args.status!)).collect();
    } else {
      results = await ctx.db.query("keyResults").collect();
    }
    if (args.department) {
      results = results.filter((kr) => kr.department.toLowerCase().includes(args.department!.toLowerCase()));
    }
    return results;
  },
});

export const get = query({
  args: { krId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db.query("keyResults").withIndex("by_krId", (q) => q.eq("krId", args.krId)).first();
  },
});

export const update = mutation({
  args: {
    id: v.id("keyResults"),
    actualCurrent: v.optional(v.string()),
    progressPercent: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    how: v.optional(v.string()),
    target: v.optional(v.string()),
    baseline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const kr = await ctx.db.get(args.id);
    if (!kr) throw new Error("Key Result not found");
    await requireEditDepartment(ctx, kr.department);

    if (
      isGovernedPublishedKr(kr.krId) &&
      (args.actualCurrent !== undefined || args.progressPercent !== undefined || args.status !== undefined)
    ) {
      throw new Error("Governed KR values are managed by governed sync or admin override.");
    }

    const { id, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
    await ctx.db.patch(id, filtered);
  },
});

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const allKrs = await ctx.db.query("keyResults").collect();
    const total = allKrs.length;
    const achieved = allKrs.filter((kr) => kr.status === "Achieved").length;
    const onTrack = allKrs.filter((kr) => kr.status === "On track").length;
    const watch = allKrs.filter((kr) => kr.status === "Watch").length;
    const offTrack = allKrs.filter((kr) => kr.status === "Off track").length;
    const noData = allKrs.filter((kr) => kr.status === "No data").length;

    const byObjective = allKrs.reduce<ObjectiveStatsAccumulator>((acc, kr) => {
      const key = kr.objectiveId;
      if (!acc[key]) {
        acc[key] = { objectiveId: key, objective: kr.objective, total: 0, achieved: 0, onTrack: 0, watch: 0, offTrack: 0, noData: 0, totalProgress: 0, progressCount: 0 };
      }
      acc[key].total++;
      if (kr.status === "Achieved") acc[key].achieved++;
      else if (kr.status === "On track") acc[key].onTrack++;
      else if (kr.status === "Watch") acc[key].watch++;
      else if (kr.status === "Off track") acc[key].offTrack++;
      else acc[key].noData++;
      if (kr.progressPercent !== undefined) {
        acc[key].totalProgress += kr.progressPercent;
        acc[key].progressCount++;
      }
      return acc;
    }, {});

    const objectiveStats = Object.values(byObjective).map((obj) => ({
      ...obj,
      avgProgress: obj.progressCount > 0 ? obj.totalProgress / obj.progressCount : null,
    }));

    return { total, achieved, onTrack, watch, offTrack, noData, objectiveStats };
  },
});

export const ceoMetrics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const ceoKrIds = ["KR-001", "KR-002", "KR-008", "KR-009", "KR-010", "KR-011", "KR-018", "KR-019", "KR-025", "KR-012", "KR-034", "KR-044"];
    const metrics = [];
    for (const krId of ceoKrIds) {
      const kr = await ctx.db.query("keyResults").withIndex("by_krId", (q) => q.eq("krId", krId)).first();
      if (kr) {
        metrics.push({
          krId: kr.krId,
          metric: kr.keyResult,
          target: kr.target,
          actual: kr.actualCurrent,
          status: kr.status,
          owner: kr.owner,
        });
      }
    }
    return metrics;
  },
});

export const add = mutation({
  args: {
    krId: v.string(),
    krType: v.string(),
    objectiveId: v.string(),
    objective: v.string(),
    department: v.string(),
    keyResult: v.string(),
    dataSource: v.string(),
    baseline: v.optional(v.string()),
    target: v.optional(v.string()),
    status: v.string(),
    owner: v.string(),
    reportingTo: v.optional(v.string()),
    reviewFrequency: v.string(),
    how: v.optional(v.string()),
    section: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("keyResults").withIndex("by_krId", (q) => q.eq("krId", args.krId)).first();
    if (existing) throw new Error(`KR ${args.krId} already exists`);
    return await ctx.db.insert("keyResults", args);
  },
});

export const remove = mutation({
  args: { id: v.id("keyResults") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

/** System-level auto-update for cron sync — bypasses auth */
export const autoUpdate = internalMutation({
  args: {
    krId: v.string(),
    metricKey: v.optional(v.string()),
    actualCurrent: v.string(),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    date: v.string(),
    period: v.string(),
    sourcePeriod: v.string(),
    runId: v.string(),
    syncKind: v.string(),
  },
  handler: async (ctx, args) => {
    const kr = await ctx.db
      .query("keyResults")
      .withIndex("by_krId", (q) => q.eq("krId", args.krId))
      .first();
    if (!kr) return;

    const previousValue = parseNumericValue(kr.actualCurrent);
    const patch: { actualCurrent: string; status?: string } = { actualCurrent: args.actualCurrent };
    if (args.status !== undefined) patch.status = args.status;
    await ctx.db.patch(kr._id, patch);

    const existingLog = (await ctx.db
      .query("updateLog")
      .withIndex("by_krId", (q) => q.eq("krId", args.krId))
      .collect())
      .find((row) => row.date === args.date && row.period === args.period);

    if (existingLog) {
      await ctx.db.patch(existingLog._id, {
        actual: parseFloat(args.actualCurrent) || 0,
        notes: args.notes ?? existingLog.notes ?? "Auto-synced from governed feed",
      });
    } else {
      await ctx.db.insert("updateLog", {
        date: args.date,
        period: args.period,
        krId: args.krId,
        actual: parseFloat(args.actualCurrent) || 0,
        notes: args.notes ?? "Auto-synced from governed feed",
      });
    }

    await ctx.db.insert("governedSyncAudit", {
      runId: args.runId,
      syncKind: args.syncKind,
      action: "sync_applied",
      period: args.sourcePeriod,
      krId: args.krId,
      metricKey: args.metricKey,
      sourceValue: parseFloat(args.actualCurrent) || 0,
      previousValue,
      resultingValue: parseFloat(args.actualCurrent) || 0,
      actor: "system",
      reason: args.notes,
      createdAt: Date.now(),
    });
  },
});
