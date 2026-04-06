import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireEditDepartment } from "./lib/auth";

export const list = query({
  args: { week: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    if (args.week) {
      return await ctx.db.query("cfr").withIndex("by_week", (q) => q.eq("week", args.week!)).collect();
    }
    return await ctx.db.query("cfr").collect();
  },
});

export const add = mutation({
  args: {
    date: v.optional(v.string()),
    week: v.string(),
    krId: v.optional(v.string()),
    owner: v.optional(v.string()),
    whatMoved: v.optional(v.string()),
    blockers: v.optional(v.string()),
    supportNeeded: v.optional(v.string()),
    learnings: v.optional(v.string()),
    recognition: v.optional(v.string()),
    nextActions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // If linked to a KR, check department permission
    if (args.krId) {
      const kr = await ctx.db.query("keyResults").withIndex("by_krId", (q) => q.eq("krId", args.krId!)).first();
      if (kr) {
        await requireEditDepartment(ctx, kr.department);
      }
    } else {
      // No KR link — just require authentication
      await requireAuth(ctx);
    }

    await ctx.db.insert("cfr", args);
  },
});
