import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, getProfile, requireAdmin } from "./lib/auth";

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    return profile;
  },
});

export const listProfiles = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("profiles").collect();
  },
});

export const createProfile = mutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("hod"), v.literal("viewer")),
    departments: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Allow creation if no profiles exist (first admin setup) or if caller is admin
    const allProfiles = await ctx.db.query("profiles").take(1);
    if (allProfiles.length > 0) {
      await requireAdmin(ctx);
    }
    // Check for duplicate
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      throw new Error(`Profile already exists for ${args.email}`);
    }
    return await ctx.db.insert("profiles", args);
  },
});

export const updateProfile = mutation({
  args: {
    id: v.id("profiles"),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("hod"), v.literal("viewer"))),
    departments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const deleteProfile = mutation({
  args: { id: v.id("profiles") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
