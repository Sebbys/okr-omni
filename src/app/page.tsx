"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Target, CheckCircle2, AlertTriangle, XCircle, Eye, HelpCircle } from "lucide-react";
import { getStatusColor } from "@/lib/gymmaster";

export default function DashboardPage() {
  const stats = useQuery(api.keyResults.dashboardStats);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground font-mono text-[10px] tracking-widest">LOADING_DASHBOARD...</div>
      </div>
    );
  }

  const summaryCards = [
    { label: "TOTAL_KRS", value: stats.total, icon: Target, accent: "text-foreground" },
    { label: "ACHIEVED", value: stats.achieved, icon: CheckCircle2, accent: "text-emerald-600 dark:text-emerald-400" },
    { label: "ON_TRACK", value: stats.onTrack, icon: Eye, accent: "text-blue-600 dark:text-blue-400" },
    { label: "WATCH", value: stats.watch, icon: AlertTriangle, accent: "text-amber-600 dark:text-amber-400" },
    { label: "OFF_TRACK", value: stats.offTrack, icon: XCircle, accent: "text-red-600 dark:text-red-400" },
    { label: "NO_DATA", value: stats.noData, icon: HelpCircle, accent: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-sm font-mono tracking-widest font-semibold">DASHBOARD</h1>
        <p className="text-muted-foreground text-[10px] font-mono tracking-wider mt-1">OVERVIEW OF ALL OBJECTIVES AND KEY RESULTS</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <card.icon className={`h-3.5 w-3.5 ${card.accent}`} />
            </div>
            <div className={`text-2xl font-bold font-mono ${card.accent}`}>{card.value}</div>
            <p className="text-[9px] text-muted-foreground mt-1 font-mono tracking-widest">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Status Distribution */}
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h2 className="text-[10px] font-mono tracking-widest text-muted-foreground mb-4">STATUS DISTRIBUTION</h2>
        <div className="flex h-2 rounded-full overflow-hidden gap-px bg-background">
          {stats.achieved > 0 && (
            <div className="bg-emerald-500/80 transition-all rounded-full" style={{ width: `${(stats.achieved / stats.total) * 100}%` }} />
          )}
          {stats.onTrack > 0 && (
            <div className="bg-blue-500/80 transition-all rounded-full" style={{ width: `${(stats.onTrack / stats.total) * 100}%` }} />
          )}
          {stats.watch > 0 && (
            <div className="bg-amber-500/80 transition-all rounded-full" style={{ width: `${(stats.watch / stats.total) * 100}%` }} />
          )}
          {stats.offTrack > 0 && (
            <div className="bg-red-500/80 transition-all rounded-full" style={{ width: `${(stats.offTrack / stats.total) * 100}%` }} />
          )}
          {stats.noData > 0 && (
            <div className="bg-muted-foreground/20 transition-all rounded-full" style={{ width: `${(stats.noData / stats.total) * 100}%` }} />
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono tracking-wider"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" /> ACHIEVED ({stats.achieved})</span>
          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono tracking-wider"><span className="h-1.5 w-1.5 rounded-full bg-blue-500/80" /> ON_TRACK ({stats.onTrack})</span>
          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono tracking-wider"><span className="h-1.5 w-1.5 rounded-full bg-amber-500/80" /> WATCH ({stats.watch})</span>
          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono tracking-wider"><span className="h-1.5 w-1.5 rounded-full bg-red-500/80" /> OFF_TRACK ({stats.offTrack})</span>
          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-mono tracking-wider"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" /> NO_DATA ({stats.noData})</span>
        </div>
      </div>

      {/* Objective Breakdown */}
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h2 className="text-[10px] font-mono tracking-widest text-muted-foreground mb-4">OBJECTIVE BREAKDOWN</h2>
        <div className="overflow-x-auto -mx-5">
          <div className="min-w-[700px] px-5">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="w-14 text-[9px] tracking-widest">ID</TableHead>
                  <TableHead className="text-[9px] tracking-widest">OBJECTIVE</TableHead>
                  <TableHead className="text-center w-16 text-[9px] tracking-widest">TOTAL</TableHead>
                  <TableHead className="text-center w-16 text-[9px] tracking-widest">ACH</TableHead>
                  <TableHead className="text-center w-16 text-[9px] tracking-widest">OT</TableHead>
                  <TableHead className="text-center w-16 text-[9px] tracking-widest">WAT</TableHead>
                  <TableHead className="text-center w-16 text-[9px] tracking-widest">OFF</TableHead>
                  <TableHead className="w-36 text-[9px] tracking-widest">PROGRESS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.objectiveStats
                  .sort((a: any, b: any) => a.objectiveId.localeCompare(b.objectiveId, undefined, { numeric: true }))
                  .map((obj: any) => (
                    <TableRow key={obj.objectiveId} className="border-border/20 hover:bg-foreground/3">
                      <TableCell className="font-mono text-[10px] font-semibold text-foreground">{obj.objectiveId}</TableCell>
                      <TableCell className="text-[10px] max-w-xs truncate font-mono text-muted-foreground">{obj.objective}</TableCell>
                      <TableCell className="text-center font-semibold font-mono text-[10px]">{obj.total}</TableCell>
                      <TableCell className="text-center">
                        {obj.achieved > 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold">{obj.achieved}</span> : <span className="text-muted-foreground/30 font-mono text-[10px]">0</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {obj.onTrack > 0 ? <span className="text-blue-600 dark:text-blue-400 font-mono text-[10px] font-semibold">{obj.onTrack}</span> : <span className="text-muted-foreground/30 font-mono text-[10px]">0</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {obj.watch > 0 ? <span className="text-amber-600 dark:text-amber-400 font-mono text-[10px] font-semibold">{obj.watch}</span> : <span className="text-muted-foreground/30 font-mono text-[10px]">0</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {obj.offTrack > 0 ? <span className="text-red-600 dark:text-red-400 font-mono text-[10px] font-semibold">{obj.offTrack}</span> : <span className="text-muted-foreground/30 font-mono text-[10px]">0</span>}
                      </TableCell>
                      <TableCell>
                        {obj.avgProgress !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-foreground/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-foreground/40 rounded-full transition-all"
                                style={{ width: `${Math.max(0, Math.min(100, obj.avgProgress * 100))}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-muted-foreground w-10 text-right font-mono">
                              {(obj.avgProgress * 100).toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-muted-foreground/40 font-mono">--</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Top Risks */}
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h2 className="text-[10px] font-mono tracking-widest text-muted-foreground mb-4">TOP RISKS / OFF TRACK ITEMS</h2>
        <OffTrackItems />
      </div>
    </div>
  );
}

function OffTrackItems() {
  const krs = useQuery(api.keyResults.list, { status: "Off track" });
  if (!krs) return <div className="text-[10px] text-muted-foreground font-mono tracking-wider animate-pulse">LOADING...</div>;
  if (krs.length === 0) return <div className="text-[10px] text-muted-foreground/50 font-mono tracking-wider">NO OFF TRACK ITEMS</div>;

  return (
    <div className="overflow-x-auto -mx-5">
      <div className="min-w-[500px] px-5">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="w-20 text-[9px] tracking-widest">KR_ID</TableHead>
              <TableHead className="text-[9px] tracking-widest">KEY_RESULT</TableHead>
              <TableHead className="text-[9px] tracking-widest">OWNER</TableHead>
              <TableHead className="text-[9px] tracking-widest">STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {krs.map((kr) => (
              <TableRow key={kr._id} className="border-border/20 hover:bg-foreground/3">
                <TableCell className="font-mono text-[10px] font-semibold">{kr.krId}</TableCell>
                <TableCell className="text-[10px] font-mono text-muted-foreground">{kr.keyResult}</TableCell>
                <TableCell className="text-[10px] font-mono text-muted-foreground">{kr.owner}</TableCell>
                <TableCell>
                  <span className="text-[9px] font-mono tracking-wider text-red-600 dark:text-red-400 font-medium">{kr.status?.toUpperCase().replace(/\s+/g, "_")}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
