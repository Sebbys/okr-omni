"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, DollarSign, TrendingUp, Activity } from "lucide-react";
import { getStatusColor } from "@/lib/gymmaster";
import { Skeleton } from "@/components/ui/skeleton";

export default function CEODashboardPage() {
  const metrics = useQuery(api.keyResults.ceoMetrics);

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-72 mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/50 bg-card p-4">
              <Skeleton className="h-2 w-20 mb-3" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-2 w-16" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border/50 bg-card p-5">
          <Skeleton className="h-3 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const highlights = [
    { label: "ONBOARDING COMPLETIONS", kr: metrics.find((m) => m.krId === "KR-001"), icon: Users, accent: "text-blue-600 dark:text-blue-400", border: "border-t-blue-500" },
    { label: "CLINIC REVENUE", kr: metrics.find((m) => m.krId === "KR-002"), icon: DollarSign, accent: "text-emerald-600 dark:text-emerald-400", border: "border-t-emerald-500" },
    { label: "WMAM", kr: metrics.find((m) => m.krId === "KR-008"), icon: TrendingUp, accent: "text-violet-600 dark:text-violet-400", border: "border-t-violet-500" },
    { label: "LONG-TERM MIX", kr: metrics.find((m) => m.krId === "KR-025"), icon: Activity, accent: "text-amber-600 dark:text-amber-400", border: "border-t-amber-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-sm font-mono tracking-widest font-semibold">CEO DASHBOARD</h1>
        <p className="text-muted-foreground text-[10px] font-mono tracking-wider mt-1">WEEKLY REVIEW METRICS | MON LEADERSHIP MEETING</p>
      </div>

      {/* Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {highlights.map((h) => (
          <div key={h.label} className={`rounded-lg border border-border/50 border-t-2 ${h.border} bg-card p-4`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] text-muted-foreground font-mono tracking-widest">{h.label}</span>
              <h.icon className={`h-3.5 w-3.5 ${h.accent}`} />
            </div>
            <div className="text-xl font-bold font-mono">
              {h.kr?.actual || <span className="text-muted-foreground/40">--</span>}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[9px] text-muted-foreground font-mono tracking-wider">TARGET: {h.kr?.target || "--"}</span>
              {h.kr && (
                <StatusText status={h.kr.status} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Full Metrics Table */}
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h2 className="text-[10px] font-mono tracking-widest text-muted-foreground mb-4">WEEKLY REVIEW METRICS</h2>
        <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-[9px] tracking-widest">METRIC</TableHead>
                  <TableHead className="w-20 text-[9px] tracking-widest">KR_ID</TableHead>
                  <TableHead className="text-[9px] tracking-widest">TARGET</TableHead>
                  <TableHead className="text-[9px] tracking-widest">ACTUAL</TableHead>
                  <TableHead className="text-[9px] tracking-widest">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((m, idx) => (
                  <TableRow key={m.krId} className={`border-border/20 hover:bg-foreground/3 ${idx % 2 === 0 ? "bg-foreground/[0.02]" : ""}`}>
                    <TableCell className="font-semibold text-[10px] font-mono">{m.metric.toUpperCase()}</TableCell>
                    <TableCell className="font-mono text-[10px] font-semibold text-muted-foreground">{m.krId}</TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground">{m.target || "--"}</TableCell>
                    <TableCell className="text-[10px] font-semibold font-mono">{m.actual || <span className="text-muted-foreground/40 font-normal">--</span>}</TableCell>
                    <TableCell>
                      <StatusText status={m.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}

function StatusText({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    "Achieved": "text-emerald-600 dark:text-emerald-400",
    "On track": "text-blue-600 dark:text-blue-400",
    "Watch": "text-amber-600 dark:text-amber-400",
    "Off track": "text-red-600 dark:text-red-400",
    "No data": "text-muted-foreground",
  };
  return (
    <span className={`text-[9px] font-mono tracking-wider font-medium ${colorMap[status] || "text-muted-foreground"}`}>
      {status.toUpperCase().replace(/\s+/g, "_")}
    </span>
  );
}
