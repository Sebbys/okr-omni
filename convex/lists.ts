import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const list = await ctx.db.query("lists").withIndex("by_category", (q) => q.eq("category", args.category)).first();
    return list?.values ?? [];
  },
});
