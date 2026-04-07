import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

/** All 20 KPI fields available from GymMaster */
const ALL_KPI_FIELDS = [
  "current_members",
  "female_members",
  "male_members",
  "average_age",
  "monthly_recurring_revenue",
  "signup_members",
  "cancellations_occurring",
  "not_visited",
  "members_expiring",
  "member_churn_percentage",
  "overall_retention",
  "number_visits",
  "member_rejoined",
  "new_memberships",
  "renewed_memberships",
  "expiring_memberships",
  "booking_total",
  "booking_checkedin",
  "bookings_cancelled",
  "bookings_noshow",
] as const;

/** All 18 dashboard endpoints */
const ALL_DASHBOARD_ENDPOINTS = [
  "kpi.active_members",
  "kpi.membershiptype_breakdown",
  "kpi.gendersplit",
  "kpi.agegroups",
  "kpi.cancel_reason",
  "kpi.total_revenue",
  "kpi.new_member_graph",
  "kpi.member_graph",
  "kpi.visit_graph",
  "kpi.visit_heatmap",
  "kpi.member_churnrate",
  "kpi.gm_member_count",
  "kpi.visit_today",
  "kpi.visit_month",
  "kpi.member_new",
  "kpi.member_expire",
  "kpi.member_cancel",
  "kpi.member_booking",
] as const;

/** Standard report IDs to fetch */
const REPORT_IDS = {
  MEMBERS_CURRENT: 1,
  ALL_BOOKINGS: 9,
  BILLING_FAILURES: 130,
  CANCELLATIONS: 131,
  NEW_JOINERS: 133,
  PRODUCT_SALES: 136,
  SWIPE_COUNTS: 140,
} as const;

/** Get WITA (UTC+8) date and derive month period */
function getWitaPeriod(): { period: string; startDate: string; endDate: string } {
  const now = new Date();
  const wita = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const year = wita.getUTCFullYear();
  const month = String(wita.getUTCMonth() + 1).padStart(2, "0");
  const period = `${year}-${month}`;

  // 30-day lookback for KPI fields
  const end = new Date(wita);
  const start = new Date(wita);
  start.setUTCDate(start.getUTCDate() - 30);

  return {
    period,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/** Format date as "YYYY-MM-DD" for report API */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Get first/last day of current month in WITA */
function getMonthRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const wita = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const year = wita.getUTCFullYear();
  const month = wita.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  return { startDate: toDateStr(first), endDate: toDateStr(last) };
}

// ─── Main orchestrator (called by monthly cron) ──────────────────────

export const syncAllMetrics = internalAction({
  args: {},
  handler: async (ctx) => {
    const { period, startDate, endDate } = getWitaPeriod();
    const monthRange = getMonthRange();
    const fetchedAt = Date.now();

    // 1. Fetch all KPI fields
    const kpiResult = await ctx.runAction(
      internal.gymmaster.internalFetchKpiFields,
      { fields: [...ALL_KPI_FIELDS], startDate, endDate },
    );

    // 2. Fetch dashboard endpoints sequentially (avoid rate limiting)
    const dashboardResults: Record<string, unknown> = {};
    for (const endpoint of ALL_DASHBOARD_ENDPOINTS) {
      try {
        dashboardResults[endpoint] = await ctx.runAction(
          internal.gymmaster.internalFetchDashboard,
          { endpoint },
        );
      } catch (e) {
        console.error(`Dashboard endpoint ${endpoint} failed:`, e);
        dashboardResults[endpoint] = null;
      }
    }

    // 3. Fetch standard reports for the month
    const reportResults: Record<string, unknown[]> = {};
    for (const [name, reportId] of Object.entries(REPORT_IDS)) {
      try {
        reportResults[name] = await ctx.runAction(
          internal.gymmaster.internalFetchReport,
          { reportId, startDate: monthRange.startDate, endDate: monthRange.endDate },
        ) as unknown[];
      } catch (e) {
        console.error(`Report ${name} (${reportId}) failed:`, e);
        reportResults[name] = [];
      }
    }

    // 4. Build snapshot entries
    const snapshots: Array<{
      metricKey: string;
      value: number;
      metadata?: string;
    }> = [];

    // KPI fields → direct snapshots
    if (kpiResult && typeof kpiResult === "object") {
      for (const field of ALL_KPI_FIELDS) {
        const entry = (kpiResult as Record<string, { value?: number }>)[field];
        if (entry && entry.value !== undefined) {
          snapshots.push({ metricKey: `kpi.${field}`, value: entry.value });
        }
      }
    }

    // Dashboard endpoints → store segment counts as metadata
    for (const [endpoint, result] of Object.entries(dashboardResults)) {
      if (!result) continue;
      const res = result as { segments?: Array<{ label: string; count: number; colour?: string }> };
      if (res.segments) {
        const total = res.segments.reduce((s, seg) => s + (seg.count || 0), 0);
        snapshots.push({
          metricKey: `dashboard.${endpoint}`,
          value: total,
          metadata: JSON.stringify(res.segments),
        });
      }
    }

    // Report counts
    for (const [name, rows] of Object.entries(reportResults)) {
      snapshots.push({
        metricKey: `report.${name.toLowerCase()}.count`,
        value: rows.length,
      });
    }

    // Cancellation reason breakdown from R131
    if (reportResults.CANCELLATIONS && reportResults.CANCELLATIONS.length > 0) {
      const reasons: Record<string, number> = {};
      for (const row of reportResults.CANCELLATIONS as Array<Record<string, string>>) {
        const reason = row["Cancel Reason"] || row["Reason"] || "Unknown";
        reasons[reason] = (reasons[reason] || 0) + 1;
      }
      snapshots.push({
        metricKey: "report.cancellations.by_reason",
        value: reportResults.CANCELLATIONS.length,
        metadata: JSON.stringify(reasons),
      });
    }

    // Product sales total from R136
    if (reportResults.PRODUCT_SALES && reportResults.PRODUCT_SALES.length > 0) {
      let totalRevenue = 0;
      for (const row of reportResults.PRODUCT_SALES as Array<Record<string, unknown>>) {
        const amount = parseFloat(String(row["Total Received"] || row["sorted_Total Received"] || 0));
        if (!isNaN(amount)) totalRevenue += amount;
      }
      snapshots.push({
        metricKey: "report.product_sales.total_revenue",
        value: totalRevenue,
      });
    }

    // 5. Compute derived metrics
    const kpiMap: Record<string, number> = {};
    for (const s of snapshots) {
      if (s.metricKey.startsWith("kpi.")) {
        kpiMap[s.metricKey.replace("kpi.", "")] = s.value;
      }
    }

    const currentMembers = kpiMap["current_members"];
    if (currentMembers && currentMembers > 0) {
      if (kpiMap["number_visits"] !== undefined) {
        snapshots.push({
          metricKey: "computed.visits_per_member_per_week",
          value: Math.round((kpiMap["number_visits"] / currentMembers / 4) * 100) / 100,
        });
      }
      if (kpiMap["booking_total"] !== undefined) {
        snapshots.push({
          metricKey: "computed.bookings_per_member",
          value: Math.round((kpiMap["booking_total"] / currentMembers) * 100) / 100,
        });
      }
      if (kpiMap["monthly_recurring_revenue"] !== undefined) {
        snapshots.push({
          metricKey: "computed.revenue_per_member",
          value: Math.round(kpiMap["monthly_recurring_revenue"] / currentMembers),
        });
      }
    }

    if (kpiMap["members_expiring"] && kpiMap["members_expiring"] > 0 && kpiMap["renewed_memberships"] !== undefined) {
      snapshots.push({
        metricKey: "computed.renewal_conversion_rate",
        value: Math.round((kpiMap["renewed_memberships"] / kpiMap["members_expiring"]) * 10000) / 100,
      });
    }

    if (kpiMap["cancellations_occurring"] && kpiMap["cancellations_occurring"] > 0 && kpiMap["member_rejoined"] !== undefined) {
      snapshots.push({
        metricKey: "computed.winback_rate",
        value: Math.round((kpiMap["member_rejoined"] / kpiMap["cancellations_occurring"]) * 10000) / 100,
      });
    }

    if (kpiMap["booking_total"] && kpiMap["booking_total"] > 0) {
      if (kpiMap["booking_checkedin"] !== undefined) {
        snapshots.push({
          metricKey: "computed.checkin_rate",
          value: Math.round((kpiMap["booking_checkedin"] / kpiMap["booking_total"]) * 10000) / 100,
        });
      }
      if (kpiMap["bookings_noshow"] !== undefined) {
        snapshots.push({
          metricKey: "computed.noshow_rate",
          value: Math.round((kpiMap["bookings_noshow"] / kpiMap["booking_total"]) * 10000) / 100,
        });
      }
    }

    // Co-working member count from membershiptype_breakdown
    const memberBreakdown = dashboardResults["kpi.membershiptype_breakdown"] as {
      segments?: Array<{ label: string; count: number }>;
    } | null;
    if (memberBreakdown?.segments) {
      const coworkCount = memberBreakdown.segments
        .filter((s) => s.label.toLowerCase().includes("co-work") || s.label.toLowerCase().includes("cowork"))
        .reduce((sum, s) => sum + s.count, 0);
      snapshots.push({ metricKey: "computed.cowork_member_count", value: coworkCount });

      // Long-term membership % (6mo+ types)
      const total = memberBreakdown.segments.reduce((s, seg) => s + seg.count, 0);
      if (total > 0) {
        const longTermCount = memberBreakdown.segments
          .filter((s) => {
            const l = s.label.toLowerCase();
            return l.includes("12") || l.includes("6 month") || l.includes("annual") || l.includes("yearly");
          })
          .reduce((sum, s) => sum + s.count, 0);
        snapshots.push({
          metricKey: "computed.longterm_membership_pct",
          value: Math.round((longTermCount / total) * 10000) / 100,
        });
      }
    }

    // 6. Store all snapshots
    await ctx.runMutation(internal.gymMasterSync.storeSnapshots, {
      period,
      snapshots: snapshots.map((s) => ({
        metricKey: s.metricKey,
        value: s.value,
        metadata: s.metadata,
      })),
      fetchedAt,
    });

    console.log(`GymMaster sync complete: ${snapshots.length} metrics stored for ${period}`);
  },
});

// ─── Persist snapshots ───────────────────────────────────────────────

export const storeSnapshots = internalMutation({
  args: {
    period: v.string(),
    snapshots: v.array(
      v.object({
        metricKey: v.string(),
        value: v.number(),
        metadata: v.optional(v.string()),
      }),
    ),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    for (const snap of args.snapshots) {
      const existing = await ctx.db
        .query("gymMasterSnapshot")
        .withIndex("by_date_and_metricKey", (q) =>
          q.eq("date", args.period).eq("metricKey", snap.metricKey),
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          value: snap.value,
          metadata: snap.metadata,
          fetchedAt: args.fetchedAt,
        });
      } else {
        await ctx.db.insert("gymMasterSnapshot", {
          date: args.period,
          metricKey: snap.metricKey,
          value: snap.value,
          metadata: snap.metadata,
          fetchedAt: args.fetchedAt,
        });
      }
    }

    // Auto-update KRs after storing
    await ctx.runMutation(internal.gymMasterSync.autoUpdateKRs, {
      period: args.period,
    });
  },
});

// ─── Auto-update mapped KRs ─────────────────────────────────────────

export const autoUpdateKRs = internalMutation({
  args: { period: v.string() },
  handler: async (ctx, args) => {
    const mappings = await ctx.db.query("krAutoMapping").collect();
    const enabled = mappings.filter((m) => m.enabled);

    const today = new Date();
    const wita = new Date(today.getTime() + 8 * 60 * 60 * 1000);
    const dateStr = wita.toISOString().slice(0, 10);

    // Determine period label (e.g., "Apr" for "2026-04")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIdx = parseInt(args.period.split("-")[1], 10) - 1;
    const periodLabel = monthNames[monthIdx] || args.period;

    let updated = 0;
    for (const mapping of enabled) {
      const snapshot = await ctx.db
        .query("gymMasterSnapshot")
        .withIndex("by_date_and_metricKey", (q) =>
          q.eq("date", args.period).eq("metricKey", mapping.metricKey),
        )
        .first();

      if (!snapshot) continue;

      const value = String(snapshot.value);

      await ctx.runMutation(internal.keyResults.autoUpdate, {
        krId: mapping.krId,
        actualCurrent: value,
        date: dateStr,
        period: periodLabel,
        notes: `Auto-synced from GymMaster (${args.period})`,
      });
      updated++;
    }

    console.log(`Auto-updated ${updated} KRs for period ${args.period}`);
  },
});
