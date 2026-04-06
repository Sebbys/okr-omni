import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireEditDepartment } from "./lib/auth";

export const list = query({
  args: {
    objectiveId: v.optional(v.string()),
    status: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    let results;
    if (args.objectiveId) {
      results = await ctx.db.query("keyResults").withIndex("by_objectiveId", (q) => q.eq("objectiveId", args.objectiveId!)).collect();
    } else if (args.status) {
      results = await ctx.db.query("keyResults").withIndex("by_status", (q) => q.eq("status", args.status!)).collect();
    } else {
      results = await ctx.db.query("keyResults").collect();
    }
    if (args.department) {
      results = results.filter((kr) => kr.department.toLowerCase().includes(args.department!.toLowerCase()));
    }
    return results;
  },
});

export const get = query({
  args: { krId: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.query("keyResults").withIndex("by_krId", (q) => q.eq("krId", args.krId)).first();
  },
});

export const update = mutation({
  args: {
    id: v.id("keyResults"),
    actualCurrent: v.optional(v.string()),
    progressPercent: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    how: v.optional(v.string()),
    target: v.optional(v.string()),
    baseline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const kr = await ctx.db.get(args.id);
    if (!kr) throw new Error("Key Result not found");
    await requireEditDepartment(ctx, kr.department);

    const { id, ...updates } = args;
    const filtered = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
    await ctx.db.patch(id, filtered);
  },
});

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const allKrs = await ctx.db.query("keyResults").collect();
    const total = allKrs.length;
    const achieved = allKrs.filter((kr) => kr.status === "Achieved").length;
    const onTrack = allKrs.filter((kr) => kr.status === "On track").length;
    const watch = allKrs.filter((kr) => kr.status === "Watch").length;
    const offTrack = allKrs.filter((kr) => kr.status === "Off track").length;
    const noData = allKrs.filter((kr) => kr.status === "No data").length;

    const byObjective = allKrs.reduce((acc, kr) => {
      const key = kr.objectiveId;
      if (!acc[key]) {
        acc[key] = { objectiveId: key, objective: kr.objective, total: 0, achieved: 0, onTrack: 0, watch: 0, offTrack: 0, noData: 0, totalProgress: 0, progressCount: 0 };
      }
      acc[key].total++;
      if (kr.status === "Achieved") acc[key].achieved++;
      else if (kr.status === "On track") acc[key].onTrack++;
      else if (kr.status === "Watch") acc[key].watch++;
      else if (kr.status === "Off track") acc[key].offTrack++;
      else acc[key].noData++;
      if (kr.progressPercent !== undefined) {
        acc[key].totalProgress += kr.progressPercent;
        acc[key].progressCount++;
      }
      return acc;
    }, {} as Record<string, any>);

    const objectiveStats = Object.values(byObjective).map((obj: any) => ({
      ...obj,
      avgProgress: obj.progressCount > 0 ? obj.totalProgress / obj.progressCount : null,
    }));

    return { total, achieved, onTrack, watch, offTrack, noData, objectiveStats };
  },
});

export const ceoMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const ceoKrIds = ["KR-001", "KR-002", "KR-008", "KR-009", "KR-010", "KR-011", "KR-018", "KR-019", "KR-025", "KR-012", "KR-034", "KR-044"];
    const metrics = [];
    for (const krId of ceoKrIds) {
      const kr = await ctx.db.query("keyResults").withIndex("by_krId", (q) => q.eq("krId", krId)).first();
      if (kr) {
        metrics.push({
          krId: kr.krId,
          metric: kr.keyResult,
          target: kr.target,
          actual: kr.actualCurrent,
          status: kr.status,
          owner: kr.owner,
        });
      }
    }
    return metrics;
  },
});
