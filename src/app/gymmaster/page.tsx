"use client";

import { useState, useEffect, useCallback } from "react";
import { useAction } from "convex/react";
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
} from "lucide-react";
import { getDateRange, formatNumber } from "@/lib/gymmaster";

export default function GymMasterPage() {
  const fetchKpiFields = useAction(api.gymmaster.fetchKpiFields);
  const fetchDashboard = useAction(api.gymmaster.fetchDashboard);

  const [kpiData, setKpiData] = useState<any>(null);
  const [activeMembers, setActiveMembers] = useState<any>(null);
  const [membershipBreakdown, setMembershipBreakdown] = useState<any>(null);
  const [genderSplit, setGenderSplit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(30);

      const [kpi, active, membership, gender] = await Promise.all([
        fetchKpiFields({
          fields: [
            "current_members", "female_members", "male_members", "average_age",
            "monthly_recurring_revenue", "signup_members", "cancellations_occurring",
            "not_visited", "members_expiring", "member_churn_percentage",
            "overall_retention", "number_visits", "new_memberships",
            "renewed_memberships", "booking_total", "booking_checkedin",
            "bookings_cancelled", "bookings_noshow",
          ],
          startDate,
          endDate,
        }),
        fetchDashboard({ endpoint: "kpi.active_members" }),
        fetchDashboard({ endpoint: "kpi.membershiptype_breakdown" }),
        fetchDashboard({ endpoint: "kpi.gendersplit" }),
      ]);

      setKpiData(kpi);
      setActiveMembers(active);
      setMembershipBreakdown(membership);
      setGenderSplit(gender);
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
          <h1 className="text-sm font-mono tracking-widest font-semibold">GYMMASTER LIVE</h1>
          <p className="text-muted-foreground text-[10px] font-mono tracking-wider mt-1">
            REAL TIME DATA FROM OMNI.GYMMASTERONLINE.COM
            {lastFetch && (
              <span className="ml-2 text-foreground/40">
                UPDATED: {lastFetch.toLocaleTimeString()}
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
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-foreground/30 mb-3" />
            <p className="text-muted-foreground font-mono text-[10px] tracking-widest">FETCHING LIVE DATA...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">OVERVIEW</TabsTrigger>
            <TabsTrigger value="members">MEMBERS</TabsTrigger>
            <TabsTrigger value="bookings">BOOKINGS</TabsTrigger>
            <TabsTrigger value="retention">RETENTION</TabsTrigger>
          </TabsList>

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
            </div>

            {activeMembers?.segments && (
              <div className="rounded-lg border border-border/50 bg-card p-5">
                <h2 className="text-[10px] font-mono tracking-widest text-muted-foreground mb-4">ACTIVE MEMBER SEGMENTS</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {activeMembers.segments.map((seg: any) => (
                    <div key={seg.label} className="rounded-lg border border-border/30 p-3 text-center">
                      <div className="text-lg font-bold font-mono" style={{ color: seg.colour }}>
                        {formatNumber(seg.count)}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 font-mono tracking-widest">{seg.label.toUpperCase().replace(/\s+/g, "_")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4 mt-4">
            {membershipBreakdown?.segments && (
              <div className="rounded-lg border border-border/50 bg-card p-5">
                <h2 className="text-[10px] font-mono tracking-widest text-muted-foreground mb-4">MEMBERSHIP TYPE BREAKDOWN</h2>
                <ScrollArea className="max-h-[500px]">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/30 hover:bg-transparent">
                          <TableHead className="text-[9px] tracking-widest">MEMBERSHIP TYPE</TableHead>
                          <TableHead className="text-right text-[9px] tracking-widest">COUNT</TableHead>
                          <TableHead className="w-48 text-[9px] tracking-widest">SHARE</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {membershipBreakdown.segments
                          .sort((a: any, b: any) => b.count - a.count)
                          .map((seg: any) => {
                            const total = membershipBreakdown.segments.reduce((s: number, seg: any) => s + seg.count, 0);
                            const pct = ((seg.count / total) * 100).toFixed(1);
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
            )}

            {genderSplit?.segments && (
              <div className="rounded-lg border border-border/50 bg-card p-5">
                <h2 className="text-[10px] font-mono tracking-widest text-muted-foreground mb-4">GENDER SPLIT</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {genderSplit.segments.map((seg: any) => (
                    <div key={seg.label} className="rounded-lg border border-border/30 p-4 text-center">
                      <div className="text-xl font-bold font-mono" style={{ color: seg.colour }}>
                        {formatNumber(seg.count)}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1 font-mono tracking-widest">{seg.label.toUpperCase()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="FEMALE MEMBERS" value={kpiData?.female_members?.formatted_value} />
              <StatCard label="MALE MEMBERS" value={kpiData?.male_members?.formatted_value} />
              <StatCard label="AVG AGE" value={kpiData?.average_age?.formatted_value} />
              <StatCard label="SIGNUPS" value={kpiData?.signup_members?.formatted_value} />
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KPICard label="TOTAL BOOKINGS" value={kpiData?.booking_total?.value} formatted={kpiData?.booking_total?.formatted_value} icon={CalendarCheck} accent="text-blue-600 dark:text-blue-400" />
              <KPICard label="CHECKED IN" value={kpiData?.booking_checkedin?.value} formatted={kpiData?.booking_checkedin?.formatted_value} icon={Dumbbell} accent="text-emerald-600 dark:text-emerald-400" />
              <KPICard label="CANCELLED" value={kpiData?.bookings_cancelled?.value} formatted={kpiData?.bookings_cancelled?.formatted_value} icon={UserMinus} accent="text-amber-600 dark:text-amber-400" />
              <KPICard label="NO SHOW" value={kpiData?.bookings_noshow?.value} formatted={kpiData?.bookings_noshow?.formatted_value} icon={Eye} accent="text-red-600 dark:text-red-400" />
            </div>
          </TabsContent>

          <TabsContent value="retention" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KPICard label="CHURN RATE" value={kpiData?.member_churn_percentage?.value} formatted={kpiData?.member_churn_percentage?.formatted_value} icon={TrendingDown} accent="text-red-600 dark:text-red-400" />
              <KPICard label="RETENTION RATE" value={kpiData?.overall_retention?.value} formatted={kpiData?.overall_retention?.formatted_value} icon={TrendingUp} accent="text-emerald-600 dark:text-emerald-400" />
              <KPICard label="EXPIRING MEMBERS" value={kpiData?.members_expiring?.value} formatted={kpiData?.members_expiring?.formatted_value} icon={UserMinus} accent="text-amber-600 dark:text-amber-400" />
              <KPICard label="RENEWED" value={kpiData?.renewed_memberships?.value} formatted={kpiData?.renewed_memberships?.formatted_value} icon={UserPlus} accent="text-blue-600 dark:text-blue-400" />
              <KPICard label="NOT VISITED" value={kpiData?.not_visited?.value} formatted={kpiData?.not_visited?.formatted_value} icon={UserMinus} accent="text-red-600 dark:text-red-400" />
              <KPICard label="CANCELLATIONS" value={kpiData?.cancellations_occurring?.value} formatted={kpiData?.cancellations_occurring?.formatted_value} icon={UserMinus} accent="text-red-600 dark:text-red-400" />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function KPICard({ label, value, formatted, icon: Icon, accent }: {
  label: string;
  value: any;
  formatted?: string;
  icon: any;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-4">
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
    <div className="rounded-lg border border-border/50 bg-card p-4">
      <p className="text-[9px] text-muted-foreground mb-2 font-mono tracking-widest">{label}</p>
      <p className="text-lg font-bold font-mono">{value || "--"}</p>
    </div>
  );
}
