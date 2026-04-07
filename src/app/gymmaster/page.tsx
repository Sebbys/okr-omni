"use client";

import { useState, useEffect, useCallback } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw,
  Dumbbell,
  CalendarCheck,
  UserMinus,
  UserPlus,
  DollarSign,
  Clock,
  AlertTriangle,
  BarChart3,
  ShoppingBag,
} from "lucide-react";
import { getDateRange, formatNumber, formatIDR } from "@/lib/gymmaster";
import { Skeleton } from "@/components/ui/skeleton";

export default function GymMasterPage() {
  const fetchKpiFields = useAction(api.gymmaster.fetchKpiFields);
  const fetchDashboard = useAction(api.gymmaster.fetchDashboard);

  const [kpiData, setKpiData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Latest snapshot sync time
  const latestSnapshot = useQuery(api.gymMasterSnapshot.latestSyncTime);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(30);

      // Fetch KPI fields
      const kpi = await fetchKpiFields({
        fields: [
          "current_members", "female_members", "male_members", "average_age",
          "monthly_recurring_revenue", "signup_members", "cancellations_occurring",
          "not_visited", "members_expiring", "member_churn_percentage",
          "overall_retention", "number_visits", "new_memberships",
          "renewed_memberships", "expiring_memberships", "member_rejoined",
          "booking_total", "booking_checkedin",
          "bookings_cancelled", "bookings_noshow",
        ],
        startDate,
        endDate,
      });
      setKpiData(kpi);

      // Fetch all dashboard endpoints in parallel batches
      const endpoints = [
        "kpi.active_members", "kpi.membershiptype_breakdown", "kpi.gendersplit",
        "kpi.agegroups", "kpi.cancel_reason", "kpi.total_revenue",
        "kpi.new_member_graph", "kpi.member_graph", "kpi.visit_graph",
        "kpi.visit_heatmap", "kpi.member_churnrate", "kpi.gm_member_count",
        "kpi.visit_today", "kpi.visit_month",
        "kpi.member_new", "kpi.member_expire", "kpi.member_cancel", "kpi.member_booking",
      ];

      const results: Record<string, any> = {};
      // Batch in groups of 6 to avoid rate limiting
      for (let i = 0; i < endpoints.length; i += 6) {
        const batch = endpoints.slice(i, i + 6);
        const batchResults = await Promise.all(
          batch.map(async (ep) => {
            try {
              return { ep, data: await fetchDashboard({ endpoint: ep }) };
            } catch {
              return { ep, data: null };
            }
          }),
        );
        for (const { ep, data } of batchResults) {
          results[ep] = data;
        }
      }
      setDashboardData(results);
      setLastFetch(new Date());
    } catch (error) {
      console.error("Failed to fetch GymMaster data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchKpiFields, fetchDashboard]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-sm font-mono tracking-widest font-semibold flex items-center gap-2">
            GYMMASTER LIVE
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </h1>
          <p className="text-muted-foreground text-[10px] font-mono tracking-wider mt-1">
            REAL TIME DATA FROM OMNI.GYMMASTERONLINE.COM
            {lastFetch && (
              <span className="ml-2 text-foreground/40">
                UPDATED: {lastFetch.toLocaleTimeString()}
              </span>
            )}
            {latestSnapshot && (
              <span className="ml-2 text-foreground/40">
                · LAST SYNC: {new Date(latestSnapshot).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={loadData} disabled={loading} className="text-[10px] tracking-wider">
          <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          REFRESH
        </Button>
      </div>

      {loading && !kpiData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/50 bg-card p-4">
                <Skeleton className="h-2 w-20 mb-3" />
                <Skeleton className="h-7 w-24 mb-1" />
                <Skeleton className="h-2 w-16 mt-2" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview" className="transition-colors duration-150">OVERVIEW</TabsTrigger>
            <TabsTrigger value="members" className="transition-colors duration-150">MEMBERS</TabsTrigger>
            <TabsTrigger value="bookings" className="transition-colors duration-150">BOOKINGS</TabsTrigger>
            <TabsTrigger value="retention" className="transition-colors duration-150">RETENTION</TabsTrigger>
            <TabsTrigger value="revenue" className="transition-colors duration-150">REVENUE</TabsTrigger>
            <TabsTrigger value="trends" className="transition-colors duration-150">TRENDS</TabsTrigger>
          </TabsList>

          {/* ─── OVERVIEW ─────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <KPICard label="CURRENT MEMBERS" value={kpiData?.current_members?.value} formatted={kpiData?.current_members?.formatted_value} icon={Users} accent="text-blue-600 dark:text-blue-400" />
              <KPICard label="NEW MEMBERSHIPS" value={kpiData?.new_memberships?.value} formatted={kpiData?.new_memberships?.formatted_value} icon={UserPlus} accent="text-emerald-600 dark:text-emerald-400" />
              <KPICard label="MEMBER VISITS" value={kpiData?.number_visits?.value} formatted={kpiData?.number_visits?.formatted_value} icon={Dumbbell} accent="text-violet-600 dark:text-violet-400" />
              <KPICard label="CHURN RATE" value={kpiData?.member_churn_percentage?.value} formatted={kpiData?.member_churn_percentage?.formatted_value} icon={TrendingDown} accent="text-red-600 dark:text-red-400" />
              <KPICard label="RETENTION RATE" value={kpiData?.overall_retention?.value} formatted={kpiData?.overall_retention?.formatted_value} icon={TrendingUp} accent="text-emerald-600 dark:text-emerald-400" />
              <KPICard label="TOTAL BOOKINGS" value={kpiData?.booking_total?.value} formatted={kpiData?.booking_total?.formatted_value} icon={CalendarCheck} accent="text-blue-600 dark:text-blue-400" />
              <KPICard label="NOT VISITED" value={kpiData?.not_visited?.value} formatted={kpiData?.not_visited?.formatted_value} icon={UserMinus} accent="text-amber-600 dark:text-amber-400" />
              <KPICard label="CANCELLATIONS" value={kpiData?.cancellations_occurring?.value} formatted={kpiData?.cancellations_occurring?.formatted_value} icon={UserMinus} accent="text-red-600 dark:text-red-400" />
              <KPICard label="MRR" value={kpiData?.monthly_recurring_revenue?.value} formatted={kpiData?.monthly_recurring_revenue?.formatted_value} icon={DollarSign} accent="text-emerald-600 dark:text-emerald-400" />
              <KPICard label="REJOINED" value={kpiData?.member_rejoined?.value} formatted={kpiData?.member_rejoined?.formatted_value} icon={UserPlus} accent="text-blue-600 dark:text-blue-400" />
              <KPICard label="SIGNUPS" value={kpiData?.signup_members?.value} formatted={kpiData?.signup_members?.formatted_value} icon={UserPlus} accent="text-emerald-600 dark:text-emerald-400" />
              <KPICard label="EXPIRING" value={kpiData?.expiring_memberships?.value} formatted={kpiData?.expiring_memberships?.formatted_value} icon={Clock} accent="text-amber-600 dark:text-amber-400" />
            </div>

            <SegmentSection title="ACTIVE MEMBER SEGMENTS" data={dashboardData["kpi.active_members"]} />
          </TabsContent>

          {/* ─── MEMBERS ──────────────────────────────────── */}
          <TabsContent value="members" className="space-y-4 mt-4">
            <SegmentTable title="MEMBERSHIP TYPE BREAKDOWN" data={dashboardData["kpi.membershiptype_breakdown"]} />

            <SegmentSection title="GENDER SPLIT" data={dashboardData["kpi.gendersplit"]} />

            <SegmentSection title="AGE GROUPS" data={dashboardData["kpi.agegroups"]} />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="FEMALE MEMBERS" value={kpiData?.female_members?.formatted_value} />
              <StatCard label="MALE MEMBERS" value={kpiData?.male_members?.formatted_value} />
              <StatCard label="AVG AGE" value={kpiData?.average_age?.formatted_value} />
              <StatCard label="SIGNUPS" value={kpiData?.signup_members?.formatted_value} />
            </div>
          </TabsContent>

          {/* ─── BOOKINGS ─────────────────────────────────── */}
          <TabsContent value="bookings" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KPICard label="TOTAL BOOKINGS" value={kpiData?.booking_total?.value} formatted={kpiData?.booking_total?.formatted_value} icon={CalendarCheck} accent="text-blue-600 dark:text-blue-400" />
              <KPICard label="CHECKED IN" value={kpiData?.booking_checkedin?.value} formatted={kpiData?.booking_checkedin?.formatted_value} icon={Dumbbell} accent="text-emerald-600 dark:text-emerald-400" />
              <KPICard label="CANCELLED" value={kpiData?.bookings_cancelled?.value} formatted={kpiData?.bookings_cancelled?.formatted_value} icon={UserMinus} accent="text-amber-600 dark:text-amber-400" />
              <KPICard label="NO SHOW" value={kpiData?.bookings_noshow?.value} formatted={kpiData?.bookings_noshow?.formatted_value} icon={Eye} accent="text-red-600 dark:text-red-400" />
            </div>

            {kpiData?.booking_total?.value > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                  label="CHECK-IN RATE"
                  value={kpiData?.booking_checkedin?.value && kpiData?.booking_total?.value
                    ? `${((kpiData.booking_checkedin.value / kpiData.booking_total.value) * 100).toFixed(1)}%`
                    : undefined}
                />
                <StatCard
                  label="NO-SHOW RATE"
                  value={kpiData?.bookings_noshow?.value && kpiData?.booking_total?.value
                    ? `${((kpiData.bookings_noshow.value / kpiData.booking_total.value) * 100).toFixed(1)}%`
                    : undefined}
                />
                <StatCard
                  label="CANCEL RATE"
                  value={kpiData?.bookings_cancelled?.value && kpiData?.booking_total?.value
                    ? `${((kpiData.bookings_cancelled.value / kpiData.booking_total.value) * 100).toFixed(1)}%`
                    : undefined}
                />
              </div>
            )}

            <SegmentSection title="BOOKING DETAILS" data={dashboardData["kpi.member_booking"]} />
          </TabsContent>

          {/* ─── RETENTION ────────────────────────────────── */}
          <TabsContent value="retention" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KPICard label="CHURN RATE" value={kpiData?.member_churn_percentage?.value} formatted={kpiData?.member_churn_percentage?.formatted_value} icon={TrendingDown} accent="text-red-600 dark:text-red-400" />
              <KPICard label="RETENTION RATE" value={kpiData?.overall_retention?.value} formatted={kpiData?.overall_retention?.formatted_value} icon={TrendingUp} accent="text-emerald-600 dark:text-emerald-400" />
              <KPICard label="EXPIRING MEMBERS" value={kpiData?.members_expiring?.value} formatted={kpiData?.members_expiring?.formatted_value} icon={UserMinus} accent="text-amber-600 dark:text-amber-400" />
              <KPICard label="RENEWED" value={kpiData?.renewed_memberships?.value} formatted={kpiData?.renewed_memberships?.formatted_value} icon={UserPlus} accent="text-blue-600 dark:text-blue-400" />
              <KPICard label="NOT VISITED" value={kpiData?.not_visited?.value} formatted={kpiData?.not_visited?.formatted_value} icon={UserMinus} accent="text-red-600 dark:text-red-400" />
              <KPICard label="CANCELLATIONS" value={kpiData?.cancellations_occurring?.value} formatted={kpiData?.cancellations_occurring?.formatted_value} icon={UserMinus} accent="text-red-600 dark:text-red-400" />
            </div>

            <SegmentTable title="CANCELLATION REASONS" data={dashboardData["kpi.cancel_reason"]} />

            <SegmentSection title="CHURN RATE TREND" data={dashboardData["kpi.member_churnrate"]} />
          </TabsContent>

          {/* ─── REVENUE ──────────────────────────────────── */}
          <TabsContent value="revenue" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KPICard label="MRR" value={kpiData?.monthly_recurring_revenue?.value} formatted={kpiData?.monthly_recurring_revenue?.formatted_value} icon={DollarSign} accent="text-emerald-600 dark:text-emerald-400" />
              <KPICard label="NEW MEMBERSHIPS" value={kpiData?.new_memberships?.value} formatted={kpiData?.new_memberships?.formatted_value} icon={UserPlus} accent="text-emerald-600 dark:text-emerald-400" />
              <KPICard label="RENEWED" value={kpiData?.renewed_memberships?.value} formatted={kpiData?.renewed_memberships?.formatted_value} icon={TrendingUp} accent="text-blue-600 dark:text-blue-400" />
            </div>

            {kpiData?.current_members?.value > 0 && kpiData?.monthly_recurring_revenue?.value > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                  label="REVENUE PER MEMBER"
                  value={formatIDR(Math.round(kpiData.monthly_recurring_revenue.value / kpiData.current_members.value))}
                />
              </div>
            )}

            <SegmentSection title="TOTAL REVENUE BREAKDOWN" data={dashboardData["kpi.total_revenue"]} />
          </TabsContent>

          {/* ─── TRENDS ───────────────────────────────────── */}
          <TabsContent value="trends" className="space-y-4 mt-4">
            <SegmentSection title="MEMBER COUNT TREND" data={dashboardData["kpi.member_graph"]} />
            <SegmentSection title="NEW MEMBER TREND" data={dashboardData["kpi.new_member_graph"]} />
            <SegmentSection title="VISIT TREND" data={dashboardData["kpi.visit_graph"]} />
            <SegmentSection title="VISIT HEATMAP" data={dashboardData["kpi.visit_heatmap"]} />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="VISITS TODAY" value={dashboardData["kpi.visit_today"]?.total?.toString()} />
              <StatCard label="VISITS THIS MONTH" value={dashboardData["kpi.visit_month"]?.total?.toString()} />
              <StatCard label="GM MEMBER COUNT" value={dashboardData["kpi.gm_member_count"]?.total?.toString()} />
            </div>

            <SegmentSection title="EXPIRING MEMBERS" data={dashboardData["kpi.member_expire"]} />
            <SegmentSection title="NEW MEMBERS" data={dashboardData["kpi.member_new"]} />
            <SegmentSection title="CANCELLED MEMBERS" data={dashboardData["kpi.member_cancel"]} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ─── Reusable Components ─────────────────────────────────────────────

function KPICard({ label, value, formatted, icon: Icon, accent }: {
  label: string;
  value: any;
  formatted?: string;
  icon: any;
  accent: string;
}) {
  const isPositive = accent.includes("emerald");
  const borderAccent = isPositive ? "border-l-2 border-emerald-500/50" : "border-l-2 border-blue-500/50";
  return (
    <div className={`rounded-lg border border-border/50 bg-card p-4 ${borderAccent}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] text-muted-foreground font-mono tracking-widest">{label}</span>
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
      </div>
      <div className="text-lg font-bold font-mono">
        {formatted || (value !== undefined ? formatNumber(value) : "--")}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-border/50 border-l-2 border-l-blue-500/50 bg-card p-4">
      <p className="text-[9px] text-muted-foreground mb-2 font-mono tracking-widest">{label}</p>
      <p className="text-lg font-bold font-mono">{value || "--"}</p>
    </div>
  );
}

function SegmentSection({ title, data }: { title: string; data: any }) {
  if (!data?.segments || data.segments.length === 0) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card p-5">
      <h2 className="text-[10px] font-mono tracking-widest text-muted-foreground mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {data.segments.map((seg: any) => (
          <div key={seg.label} className="rounded-lg border border-border/30 p-3 text-center">
            <div className="text-lg font-bold font-mono" style={{ color: seg.colour }}>
              {formatNumber(seg.count)}
            </div>
            <p className="text-[9px] text-muted-foreground mt-1 font-mono tracking-widest">
              {seg.label.toUpperCase().replace(/\s+/g, "_")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SegmentTable({ title, data }: { title: string; data: any }) {
  if (!data?.segments || data.segments.length === 0) return null;
  const total = data.segments.reduce((s: number, seg: any) => s + seg.count, 0);
  return (
    <div className="rounded-lg border border-border/50 bg-card p-5">
      <h2 className="text-[10px] font-mono tracking-widest text-muted-foreground mb-4">{title}</h2>
      <ScrollArea className="max-h-[500px]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-[9px] tracking-widest">TYPE</TableHead>
                <TableHead className="text-right text-[9px] tracking-widest">COUNT</TableHead>
                <TableHead className="w-48 text-[9px] tracking-widest">SHARE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.segments
                .sort((a: any, b: any) => b.count - a.count)
                .map((seg: any) => {
                  const pct = total > 0 ? ((seg.count / total) * 100).toFixed(1) : "0.0";
                  return (
                    <TableRow key={seg.label} className="border-border/20 hover:bg-foreground/3">
                      <TableCell className="text-[10px] font-mono">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.colour }} />
                          {seg.label.toUpperCase().replace(/\s+/g, "_")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold font-mono text-[10px]">{formatNumber(seg.count)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-foreground/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: seg.colour }} />
                          </div>
                          <span className="text-[9px] text-muted-foreground w-10 text-right font-mono">{pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
