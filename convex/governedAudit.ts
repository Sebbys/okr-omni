import { query } from "./_generated/server";
import { v } from "convex/values";

export const listAudit = query({
  args: {
    krId: v.optional(v.string()),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let rows = await ctx.db.query("governedSyncAudit").collect();
    if (args.krId) {
      rows = rows.filter((row) => row.krId === args.krId);
    }
    if (args.period) {
      rows = rows.filter((row) => row.period === args.period);
    }

    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listRevisions = query({
  args: {
    krId: v.optional(v.string()),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    let rows = await ctx.db.query("governedSnapshotRevision").collect();
    if (args.krId) {
      rows = rows.filter((row) => row.krId === args.krId);
    }
    if (args.period) {
      rows = rows.filter((row) => row.period === args.period);
    }

    return rows.sort((a, b) => b.fetchedAt - a.fetchedAt);
  },
});
