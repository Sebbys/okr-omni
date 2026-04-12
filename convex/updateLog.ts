import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireEditDepartment } from "./lib/auth";
import { isGovernedPublishedKr } from "./lib/governedMetrics";

export const list = query({
  args: { krId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    if (args.krId) {
      return await ctx.db.query("updateLog").withIndex("by_krId", (q) => q.eq("krId", args.krId!)).collect();
    }
    return await ctx.db.query("updateLog").collect();
  },
});

export const add = mutation({
  args: {
    date: v.string(),
    period: v.string(),
    krId: v.string(),
    actual: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check department permission via the KR
    const kr = await ctx.db.query("keyResults").withIndex("by_krId", (q) => q.eq("krId", args.krId)).first();
    if (kr) {
      await requireEditDepartment(ctx, kr.department);
      if (isGovernedPublishedKr(kr.krId)) {
        throw new Error("Governed KRs must be updated via governed sync or admin override.");
      }
    }

    await ctx.db.insert("updateLog", args);
    // Auto-update the KR's actual value
    if (kr) {
      await ctx.db.patch(kr._id, { actualCurrent: String(args.actual) });
    }
  },
});
