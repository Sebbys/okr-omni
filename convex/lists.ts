import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";

export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const list = await ctx.db.query("lists").withIndex("by_category", (q) => q.eq("category", args.category)).first();
    return list?.values ?? [];
  },
});
