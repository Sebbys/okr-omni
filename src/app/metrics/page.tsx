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

export default function MetricDefinitionsPage() {
  const metrics = useQuery(api.metricDefinitions.list);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground font-mono text-[10px] tracking-widest">LOADING METRIC DEFINITIONS...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-sm font-mono tracking-widest font-semibold">METRIC DEFINITIONS</h1>
        <p className="text-muted-foreground text-[10px] font-mono tracking-wider mt-1">STANDARD KPI DEFINITIONS FOR OKR SYSTEM</p>
      </div>

      <div className="rounded-lg border border-border/50 bg-card p-5">
        <div className="overflow-x-auto -mx-5">
          <div className="min-w-[600px] px-5">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="w-48 text-[9px] tracking-widest">KPI</TableHead>
                  <TableHead className="text-[9px] tracking-widest">DEFINITION / FORMULA</TableHead>
                  <TableHead className="w-40 text-[9px] tracking-widest">SOURCE SYSTEM</TableHead>
                  <TableHead className="w-36 text-[9px] tracking-widest">PRIMARY OWNER</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric._id} className="border-border/20 hover:bg-foreground/3">
                    <TableCell className="font-semibold text-[10px] font-mono">{metric.kpi.toUpperCase()}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-mono">{metric.definition}</TableCell>
                    <TableCell>
                      <span className="text-[9px] font-mono tracking-wider text-blue-600 dark:text-blue-400 font-medium">
                        {metric.sourceSystem.toUpperCase().replace(/\s+/g, "_")}
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground">{metric.primaryOwner.toUpperCase()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Status Rules */}
      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h2 className="text-[10px] font-mono tracking-widest text-muted-foreground mb-4">STATUS RULES</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono tracking-wider">ACHIEVED</div>
            <p className="text-[9px] text-emerald-600/60 dark:text-emerald-400/60 mt-1 font-mono">&gt;= 100% PROGRESS</p>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 font-mono tracking-wider">ON TRACK</div>
            <p className="text-[9px] text-blue-600/60 dark:text-blue-400/60 mt-1 font-mono">&gt;= 70% PROGRESS</p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 font-mono tracking-wider">WATCH</div>
            <p className="text-[9px] text-amber-600/60 dark:text-amber-400/60 mt-1 font-mono">&gt;= 40% PROGRESS</p>
          </div>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div className="text-[10px] font-semibold text-red-600 dark:text-red-400 font-mono tracking-wider">OFF TRACK</div>
            <p className="text-[9px] text-red-600/60 dark:text-red-400/60 mt-1 font-mono">&lt; 40% PROGRESS</p>
          </div>
        </div>
        <p className="text-[9px] text-muted-foreground mt-3 font-mono tracking-wider">
          FOR "DECREASE" METRICS, THE FORMULA REVERSES DIRECTION.
        </p>
      </div>

      <div className="rounded-lg border border-border/50 bg-card p-5">
        <h2 className="text-[10px] font-mono tracking-widest text-muted-foreground mb-4">UPDATE CADENCE</h2>
        <div className="space-y-2 text-[10px] text-muted-foreground font-mono leading-relaxed">
          <p>1. EVERY WEEK/MONTH, ADD A NEW LINE IN UPDATE LOG WITH DATE, PERIOD, KR_ID, ACTUAL AND NOTES.</p>
          <p>2. OKR MASTER PULLS THE LATEST ACTUAL FOR EACH KR AUTOMATICALLY FROM UPDATE LOG.</p>
          <p>3. FILL ANY REMAINING BLANK BASELINES/TARGETS IN OKR MASTER BEFORE USING PROGRESS %.</p>
          <p>4. RECOMMENDED WEEKLY CEO REVIEW: WMAM, TOURS, CONVERSION, VISITS/MEMBER, RETENTION, RENEWAL, REVENUE/MEMBER, PT REVENUE, CLINIC REVENUE, CONSULT ATTACH RATE, F&B REVENUE, NPS.</p>
        </div>
      </div>
    </div>
  );
}
