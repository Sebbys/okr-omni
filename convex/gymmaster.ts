import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";

const GM_BASE = "https://omni.gymmasteronline.com/api/v2";
const STAFF_API_KEY = "309b28e47ec3126feab3f4319c8ed8e5";

export const getCache = query({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("gymMasterCache")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (!cached) return null;
    if (Date.now() - cached.fetchedAt > 5 * 60 * 1000) return null;
    return JSON.parse(cached.data);
  },
});

export const setCache = mutation({
  args: { endpoint: v.string(), data: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("gymMasterCache")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { data: args.data, fetchedAt: Date.now() });
    } else {
      await ctx.db.insert("gymMasterCache", { endpoint: args.endpoint, data: args.data, fetchedAt: Date.now() });
    }
  },
});

export const fetchKpiFields = action({
  args: {
    fields: v.array(v.string()),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (_ctx, args) => {
    const response = await fetch(`${GM_BASE}/report/kpi/fields`, {
      method: "POST",
      headers: {
        "X-GM-API-KEY": STAFF_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: { start: args.startDate, end: args.endDate },
        selected_fields: args.fields,
      }),
    });
    const data = await response.json();
    return data.result;
  },
});

export const fetchDashboard = action({
  args: { endpoint: v.string() },
  handler: async (_ctx, args) => {
    const response = await fetch(
      `${GM_BASE}/dashboard?endpoint=${args.endpoint}`,
      {
        headers: { "X-GM-API-KEY": STAFF_API_KEY },
      }
    );
    const data = await response.json();
    return data.result;
  },
});

export const fetchReport = action({
  args: {
    reportId: v.number(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (_ctx, args) => {
    const response = await fetch(`${GM_BASE}/report/standard_report`, {
      method: "POST",
      headers: {
        "X-GM-API-KEY": STAFF_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start_date: args.startDate,
        end_date: args.endDate,
        report_id: args.reportId,
      }),
    });
    const data = await response.json();
    return data.result;
  },
});

export const fetchKpiCategories = action({
  args: {
    categories: v.array(v.string()),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (_ctx, args) => {
    const response = await fetch(`${GM_BASE}/report/kpi/categories`, {
      method: "POST",
      headers: {
        "X-GM-API-KEY": STAFF_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: { start: args.startDate, end: args.endDate },
        selected_categories: args.categories,
        grouped_categories: true,
      }),
    });
    const data = await response.json();
    return data.result;
  },
});
