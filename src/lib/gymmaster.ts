// GymMaster API constants and helpers for client-side use

export const GM_BASE = "https://omni.gymmasteronline.com/api/v2";
export const STAFF_API_KEY = "309b28e47ec3126feab3f4319c8ed8e5";
export const MEMBERS_API_KEY = "1db1f20df37d8af92da68c0fe5f36fcd";

export const KPI_FIELDS = [
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

export const DASHBOARD_ENDPOINTS = [
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

export function getDateRange(days: number = 30) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "Achieved":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "On track":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "Watch":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "Off track":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function getStatusDot(status: string): string {
  switch (status) {
    case "Achieved":
      return "bg-emerald-500";
    case "On track":
      return "bg-blue-500";
    case "Watch":
      return "bg-amber-500";
    case "Off track":
      return "bg-red-500";
    default:
      return "bg-muted-foreground";
  }
}
