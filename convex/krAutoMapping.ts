import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db.query("krAutoMapping").collect();
  },
});

export const upsert = mutation({
  args: {
    krId: v.string(),
    metricKey: v.string(),
    transform: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("krAutoMapping")
      .withIndex("by_krId", (q) => q.eq("krId", args.krId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        metricKey: args.metricKey,
        transform: args.transform,
        enabled: args.enabled,
      });
    } else {
      await ctx.db.insert("krAutoMapping", args);
    }
  },
});

export const remove = mutation({
  args: { id: v.id("krAutoMapping") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});

/** Deprecated: governed KR sync no longer uses manual metric-key mappings. */
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("krAutoMapping").collect();
    console.log(`krAutoMapping seed skipped; ${existing.length} legacy mappings remain untouched.`);
  },
});
