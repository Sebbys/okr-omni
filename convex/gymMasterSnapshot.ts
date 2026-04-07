import { query } from "./_generated/server";
import { v } from "convex/values";

/** Get the latest sync timestamp from snapshots */
export const latestSyncTime = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const latest = await ctx.db
      .query("gymMasterSnapshot")
      .order("desc")
      .first();

    return latest?.fetchedAt ?? null;
  },
});

/** List all snapshots for a given month period */
export const listByPeriod = query({
  args: { period: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("gymMasterSnapshot")
      .withIndex("by_date_and_metricKey", (q) => q.eq("date", args.period))
      .collect();
  },
});

/** Get a specific metric's latest value */
export const getMetric = query({
  args: { metricKey: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("gymMasterSnapshot")
      .withIndex("by_metricKey", (q) => q.eq("metricKey", args.metricKey))
      .order("desc")
      .first();
  },
});

/** List all available periods (months) */
export const listPeriods = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const all = await ctx.db.query("gymMasterSnapshot").collect();
    const periods = new Set(all.map((s) => s.date));
    return [...periods].sort().reverse();
  },
});
