import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireAdmin } from "./lib/auth";

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

/** Seed initial KR-to-metric mappings */
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const mappings: Array<{
      krId: string;
      metricKey: string;
      transform: string;
      enabled: boolean;
    }> = [
      // Direct KPI field mappings
      { krId: "KR-008", metricKey: "kpi.current_members", transform: "direct", enabled: true },
      { krId: "KR-074", metricKey: "kpi.member_churn_percentage", transform: "direct", enabled: true },
      { krId: "KR-023", metricKey: "computed.visits_per_member_per_week", transform: "direct", enabled: true },
      { krId: "KR-024", metricKey: "computed.renewal_conversion_rate", transform: "direct", enabled: true },
      { krId: "KR-025", metricKey: "computed.longterm_membership_pct", transform: "direct", enabled: true },
      { krId: "KR-010", metricKey: "computed.longterm_membership_pct", transform: "direct", enabled: true },
      { krId: "KR-011", metricKey: "computed.cowork_member_count", transform: "direct", enabled: true },
      { krId: "KR-027", metricKey: "computed.winback_rate", transform: "direct", enabled: true },
      { krId: "KR-072", metricKey: "computed.bookings_per_member", transform: "direct", enabled: true },
    ];

    let inserted = 0;
    for (const m of mappings) {
      const existing = await ctx.db
        .query("krAutoMapping")
        .withIndex("by_krId", (q) => q.eq("krId", m.krId))
        .first();
      if (!existing) {
        await ctx.db.insert("krAutoMapping", m);
        inserted++;
      }
    }
    console.log(`Seeded ${inserted} KR auto-mappings`);
  },
});
