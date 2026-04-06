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

export default function UpdateLogPage() {
  const [search, setSearch] = useState("");
  const [krFilter, setKrFilter] = useState<string>("all");
  const { isViewer } = useCurrentUser();

  const logs = useQuery(api.updateLog.list, {});
  const krs = useQuery(api.keyResults.list, {});

  if (!logs || !krs) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground font-mono text-[10px] tracking-widest">LOADING UPDATE LOG...</div>
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
            <div className="min-w-[500px]">
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
                      <TableCell className="text-[10px] font-mono text-muted-foreground">{log.period}</TableCell>
                      <TableCell className="font-mono text-[10px] font-semibold">{log.krId}</TableCell>
                      <TableCell className="font-semibold text-[10px] font-mono">
                        {typeof log.actual === "number" && log.actual > 10000
                          ? new Intl.NumberFormat("en-US").format(log.actual)
                          : log.actual}
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground font-mono">{log.notes || "--"}</TableCell>
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
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

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
              <Input placeholder="e.g. 2026-W12 (Mar | Q1)" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">KR ID</label>
              <Select value={krId} onValueChange={(v) => setKrId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select KR" /></SelectTrigger>
                <SelectContent>
                  {krs
                    .sort((a, b) => a.krId.localeCompare(b.krId, undefined, { numeric: true }))
                    .map((kr) => (
                      <SelectItem key={kr._id} value={kr.krId}>
                        {kr.krId} - {kr.keyResult.substring(0, 30)}...
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
