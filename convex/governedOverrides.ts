import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import {
  formatPeriodLabel,
  getPeriodEndDate,
  isGovernedPublishedKr,
  parseNumericValue,
} from "./lib/governedMetrics";

async function findSnapshotForKr(ctx: any, krId: string, period: string) {
  const snapshots = await ctx.db.query("gymMasterSnapshot").collect();
  return snapshots.find((snapshot: { date: string; metadata?: string }) => {
    if (snapshot.date !== period || !snapshot.metadata) return false;
    try {
      const metadata = JSON.parse(snapshot.metadata) as { krId?: string };
      return metadata.krId === krId;
    } catch {
      return false;
    }
  });
}

export const listActive = query({
  args: { period: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const overrides = args.period
      ? await ctx.db
          .query("governedOverride")
          .withIndex("by_period", (q) => q.eq("period", args.period!))
          .collect()
      : await ctx.db.query("governedOverride").collect();

    return overrides.filter((override) => override.active);
  },
});

export const applyOverride = mutation({
  args: {
    krId: v.string(),
    period: v.string(),
    value: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!isGovernedPublishedKr(args.krId)) {
      throw new Error("Only governed published KRs support overrides.");
    }

    const kr = await ctx.db.query("keyResults").withIndex("by_krId", (q) => q.eq("krId", args.krId)).first();
    if (!kr) throw new Error("Key Result not found");

    const existingActive = await ctx.db
      .query("governedOverride")
      .withIndex("by_krId_period_active", (q) => q.eq("krId", args.krId).eq("period", args.period).eq("active", true))
      .first();

    const snapshot = await findSnapshotForKr(ctx, args.krId, args.period);
    const previousValue = parseNumericValue(kr.actualCurrent);
    const now = Date.now();

    if (existingActive) {
      await ctx.db.patch(existingActive._id, {
        active: false,
        clearedAt: now,
        clearedBy: admin.email,
      });
    }

    await ctx.db.insert("governedOverride", {
      krId: args.krId,
      period: args.period,
      value: args.value,
      reason: args.reason,
      sourceValue: snapshot?.value,
      approvedBy: admin.email,
      createdAt: now,
      active: true,
    });

    await ctx.db.patch(kr._id, { actualCurrent: String(args.value) });

    const date = getPeriodEndDate(args.period);
    const periodLabel = formatPeriodLabel(args.period);
    const existingLog = (await ctx.db
      .query("updateLog")
      .withIndex("by_krId", (q) => q.eq("krId", args.krId))
      .collect()).find((row) => row.date === date && row.period === periodLabel);

    const notes = `Admin override for governed metric (${args.period}): ${args.reason}`;
    if (existingLog) {
      await ctx.db.patch(existingLog._id, {
        actual: args.value,
        notes,
      });
    } else {
      await ctx.db.insert("updateLog", {
        date,
        period: periodLabel,
        krId: args.krId,
        actual: args.value,
        notes,
      });
    }

    await ctx.db.insert("governedSyncAudit", {
      action: "override_applied",
      period: args.period,
      krId: args.krId,
      metricKey: snapshot?.metricKey,
      sourceValue: snapshot?.value,
      previousValue,
      resultingValue: args.value,
      actor: admin.email,
      reason: args.reason,
      metadata: snapshot?.metadata,
      createdAt: now,
    });
  },
});

export const clearOverride = mutation({
  args: {
    krId: v.string(),
    period: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    if (!isGovernedPublishedKr(args.krId)) {
      throw new Error("Only governed published KRs support overrides.");
    }

    const activeOverride = await ctx.db
      .query("governedOverride")
      .withIndex("by_krId_period_active", (q) => q.eq("krId", args.krId).eq("period", args.period).eq("active", true))
      .first();
    if (!activeOverride) {
      throw new Error("No active override found for this KR and period.");
    }

    const kr = await ctx.db.query("keyResults").withIndex("by_krId", (q) => q.eq("krId", args.krId)).first();
    if (!kr) throw new Error("Key Result not found");

    const snapshot = await findSnapshotForKr(ctx, args.krId, args.period);
    if (!snapshot) {
      throw new Error("No governed snapshot found to restore for this period.");
    }

    const previousValue = parseNumericValue(kr.actualCurrent);
    const now = Date.now();

    await ctx.db.patch(activeOverride._id, {
      active: false,
      clearedAt: now,
      clearedBy: admin.email,
    });

    await ctx.db.patch(kr._id, { actualCurrent: String(snapshot.value) });

    const date = getPeriodEndDate(args.period);
    const periodLabel = formatPeriodLabel(args.period);
    const existingLog = (await ctx.db
      .query("updateLog")
      .withIndex("by_krId", (q) => q.eq("krId", args.krId))
      .collect()).find((row) => row.date === date && row.period === periodLabel);

    const reason = args.reason ?? "Admin cleared governed override";
    const notes = `Governed sync restored after override clear (${args.period}): ${reason}`;
    if (existingLog) {
      await ctx.db.patch(existingLog._id, {
        actual: snapshot.value,
        notes,
      });
    } else {
      await ctx.db.insert("updateLog", {
        date,
        period: periodLabel,
        krId: args.krId,
        actual: snapshot.value,
        notes,
      });
    }

    await ctx.db.insert("governedSyncAudit", {
      action: "override_cleared",
      period: args.period,
      krId: args.krId,
      metricKey: snapshot.metricKey,
      sourceValue: snapshot.value,
      previousValue,
      resultingValue: snapshot.value,
      actor: admin.email,
      reason,
      metadata: snapshot.metadata,
      createdAt: now,
    });
  },
});
