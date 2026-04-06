import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireEditDepartment } from "./lib/auth";

export const list = query({
  args: { krId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
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
    }

    await ctx.db.insert("updateLog", args);
    // Auto-update the KR's actual value
    if (kr) {
      await ctx.db.patch(kr._id, { actualCurrent: String(args.actual) });
    }
  },
});
