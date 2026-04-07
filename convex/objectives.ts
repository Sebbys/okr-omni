import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db.query("objectives").collect();
  },
});

export const add = mutation({
  args: {
    objectiveId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("objectives").withIndex("by_objectiveId", (q) => q.eq("objectiveId", args.objectiveId)).first();
    if (existing) throw new Error(`Objective ${args.objectiveId} already exists`);
    return await ctx.db.insert("objectives", args);
  },
});

export const remove = mutation({
  args: { id: v.id("objectives") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
