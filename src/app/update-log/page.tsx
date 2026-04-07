"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Skeleton } from "@/components/ui/skeleton";

export default function UpdateLogPage() {
  const [search, setSearch] = useState("");
  const [krFilter, setKrFilter] = useState<string>("all");
  const { isViewer } = useCurrentUser();

  const logs = useQuery(api.updateLog.list, {});
  const krs = useQuery(api.keyResults.list, {});

  if (!logs || !krs) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-64 mt-2" />
        </div>
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  let filtered = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.krId.toLowerCase().includes(s) ||
        (log.notes || "").toLowerCase().includes(s)
    );
  }
  if (krFilter !== "all") {
    filtered = filtered.filter((log) => log.krId === krFilter);
  }

  const uniqueKrIds = [...new Set(logs.map((l) => l.krId))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-sm font-mono tracking-widest font-semibold">UPDATE LOG</h1>
          <p className="text-muted-foreground text-[10px] font-mono tracking-wider mt-1">{logs.length} ENTRIES | WEEKLY/MONTHLY KR UPDATES</p>
        </div>
        {!isViewer && <AddUpdateDialog krs={krs} />}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border/50 bg-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="SEARCH KR_ID OR NOTES..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-[10px]"
              />
            </div>
          </div>
          <Select value={krFilter} onValueChange={(v) => setKrFilter(v ?? "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="KR_ID" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL KRS</SelectItem>
              {uniqueKrIds.map((krId) => (
                <SelectItem key={krId} value={krId}>{krId}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Log Table */}
      <div className="rounded-lg border border-border/50 bg-card">
        <ScrollArea className="max-h-[calc(100vh-300px)]">
          <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="w-28 text-[9px] tracking-widest">DATE</TableHead>
                    <TableHead className="w-48 text-[9px] tracking-widest">PERIOD</TableHead>
                    <TableHead className="w-24 text-[9px] tracking-widest">KR_ID</TableHead>
                    <TableHead className="w-32 text-[9px] tracking-widest">ACTUAL</TableHead>
                    <TableHead className="text-[9px] tracking-widest">NOTES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => (
                    <TableRow key={log._id} className="border-border/20 hover:bg-foreground/3">
                      <TableCell className="font-mono text-[10px] font-semibold">{log.date}</TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]" title={log.period}>{log.period}</TableCell>
                      <TableCell className="font-mono text-[10px] font-semibold">{log.krId}</TableCell>
                      <TableCell className="font-semibold text-[10px] font-mono">
                        {typeof log.actual === "number" && log.actual > 10000
                          ? new Intl.NumberFormat("en-US").format(log.actual)
                          : log.actual}
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground font-mono max-w-[300px] truncate" title={log.notes || ""}>{log.notes || "--"}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8 font-mono text-[10px] tracking-wider">
                        NO ENTRIES FOUND
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function generatePeriods() {
  const year = new Date().getFullYear();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const periods: { value: string; label: string }[] = [];

  // Generate weekly periods
  for (let week = 1; week <= 52; week++) {
    // Estimate month from week number
    const approxDay = (week - 1) * 7 + 4;
    const d = new Date(year, 0, approxDay);
    const month = months[d.getMonth()];
    const quarter = `Q${Math.ceil((d.getMonth() + 1) / 3)}`;
    const wStr = String(week).padStart(2, "0");
    periods.push({
      value: `${year}-W${wStr} (${month} | ${quarter})`,
      label: `W${wStr} — ${month} | ${quarter}`,
    });
  }

  // Generate monthly periods
  for (let m = 0; m < 12; m++) {
    const quarter = `Q${Math.ceil((m + 1) / 3)}`;
    periods.push({
      value: `${year}-${months[m]} (${quarter})`,
      label: `${months[m]} ${year} | ${quarter}`,
    });
  }

  // Generate quarterly periods
  for (let q = 1; q <= 4; q++) {
    const startMonth = months[(q - 1) * 3];
    const endMonth = months[q * 3 - 1];
    periods.push({
      value: `${year}-Q${q} (${startMonth}–${endMonth})`,
      label: `Q${q} ${year} — ${startMonth}–${endMonth}`,
    });
  }

  return periods;
}

const PERIODS = generatePeriods();

function AddUpdateDialog({ krs }: { krs: any[] }) {
  const addLog = useMutation(api.updateLog.add);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [period, setPeriod] = useState("");
  const [krId, setKrId] = useState("");
  const [actual, setActual] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!date || !period || !krId || !actual) return;
    await addLog({
      date,
      period,
      krId,
      actual: parseFloat(actual),
      notes: notes || undefined,
    });
    setOpen(false);
    setPeriod("");
    setKrId("");
    setActual("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm" }), "text-[10px] tracking-wider")}>
        <Plus className="h-3 w-3 mr-1.5" /> ADD ENTRY
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-sm">ADD UPDATE LOG ENTRY</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">DATE</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">PERIOD</label>
              <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
                <SelectTrigger><SelectValue placeholder="Select period..." /></SelectTrigger>
                <SelectContent className="max-h-[300px] min-w-[280px]">
                  <SelectItem value="_q" disabled><span className="text-[9px] font-mono tracking-widest font-semibold">QUARTERLY</span></SelectItem>
                  {PERIODS.filter((p) => p.value.includes("-Q")).map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                  <SelectItem value="_m" disabled><span className="text-[9px] font-mono tracking-widest font-semibold">MONTHLY</span></SelectItem>
                  {PERIODS.filter((p) => p.value.match(/-[A-Z][a-z]{2} /)).map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                  <SelectItem value="_w" disabled><span className="text-[9px] font-mono tracking-widest font-semibold">WEEKLY</span></SelectItem>
                  {PERIODS.filter((p) => p.value.includes("-W")).map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">KR ID</label>
              <Select value={krId} onValueChange={(v) => v && setKrId(v)}>
                <SelectTrigger><SelectValue placeholder="Select KR" /></SelectTrigger>
                <SelectContent className="min-w-[350px]">
                  {krs
                    .sort((a, b) => a.krId.localeCompare(b.krId, undefined, { numeric: true }))
                    .map((kr) => (
                      <SelectItem key={kr._id} value={kr.krId}>
                        {kr.krId} - {kr.keyResult}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">ACTUAL VALUE</label>
              <Input type="number" step="any" value={actual} onChange={(e) => setActual(e.target.value)} placeholder="Enter number" />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">NOTES</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>CANCEL</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!date || !period || !krId || !actual}>ADD ENTRY</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
