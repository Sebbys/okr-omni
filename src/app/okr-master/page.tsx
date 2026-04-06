"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function OKRMasterPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [objectiveFilter, setObjectiveFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const { canEditDepartment } = useCurrentUser();

  const allKrs = useQuery(api.keyResults.list, {});
  const objectives = useQuery(api.objectives.list);

  if (!allKrs || !objectives) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground font-mono text-[10px] tracking-widest">LOADING OKR MASTER...</div>
      </div>
    );
  }

  let filtered = allKrs;
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (kr) =>
        kr.krId.toLowerCase().includes(s) ||
        kr.keyResult.toLowerCase().includes(s) ||
        kr.owner.toLowerCase().includes(s) ||
        kr.department.toLowerCase().includes(s)
    );
  }
  if (statusFilter !== "all") {
    filtered = filtered.filter((kr) => kr.status === statusFilter);
  }
  if (objectiveFilter !== "all") {
    filtered = filtered.filter((kr) => kr.objectiveId === objectiveFilter);
  }
  if (sectionFilter !== "all") {
    filtered = filtered.filter((kr) => kr.section === sectionFilter);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-sm font-mono tracking-widest font-semibold">OKR MASTER</h1>
        <p className="text-muted-foreground text-[10px] font-mono tracking-wider mt-1">{allKrs.length} KRS | {objectives.length} OBJECTIVES</p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border/50 bg-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="SEARCH KR_ID, KEY RESULT, OWNER, DEPT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-[10px]"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="STATUS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL STATUSES</SelectItem>
              <SelectItem value="Achieved">ACHIEVED</SelectItem>
              <SelectItem value="On track">ON TRACK</SelectItem>
              <SelectItem value="Watch">WATCH</SelectItem>
              <SelectItem value="Off track">OFF TRACK</SelectItem>
              <SelectItem value="No data">NO DATA</SelectItem>
            </SelectContent>
          </Select>
          <Select value={objectiveFilter} onValueChange={(v) => setObjectiveFilter(v ?? "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="OBJECTIVE" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL OBJECTIVES</SelectItem>
              {objectives
                .sort((a, b) => a.objectiveId.localeCompare(b.objectiveId, undefined, { numeric: true }))
                .map((obj) => (
                  <SelectItem key={obj._id} value={obj.objectiveId}>
                    {obj.objectiveId}: {obj.name.substring(0, 40)}...
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={sectionFilter} onValueChange={(v) => setSectionFilter(v ?? "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="SECTION" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL SECTIONS</SelectItem>
              <SelectItem value="main">MAIN</SelectItem>
              <SelectItem value="operational">OPERATIONAL</SelectItem>
              <SelectItem value="secondary">SECONDARY</SelectItem>
              <SelectItem value="individual">INDIVIDUAL DEPT</SelectItem>
              <SelectItem value="future">FUTURE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-[9px] text-muted-foreground mt-2 font-mono tracking-wider">SHOWING {filtered.length} OF {allKrs.length} RESULTS</p>
      </div>

      {/* KR Table */}
      <div className="rounded-lg border border-border/50 bg-card">
        <ScrollArea className="max-h-[calc(100vh-320px)]">
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="w-20 sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">KR_ID</TableHead>
                    <TableHead className="w-14 sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">TYPE</TableHead>
                    <TableHead className="w-14 sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">OBJ</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">DEPT</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 max-w-[280px] text-[9px] tracking-widest">KEY RESULT</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">BASE</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">TARGET</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">ACTUAL</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 w-16 text-[9px] tracking-widest">PROG</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">STATUS</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">OWNER</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">FREQ</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((kr) => (
                    <TableRow key={kr._id} className="group border-border/20 hover:bg-foreground/3">
                      <TableCell className="font-mono text-[10px] font-semibold">{kr.krId}</TableCell>
                      <TableCell>
                        <span className={`text-[9px] font-mono tracking-wider font-medium ${kr.krType === "Aspirational" ? "text-violet-600 dark:text-violet-400" : "text-sky-600 dark:text-sky-400"}`}>
                          {kr.krType === "Aspirational" ? "ASP" : "COM"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">{kr.objectiveId}</TableCell>
                      <TableCell className="text-[10px] max-w-[120px] truncate font-mono text-muted-foreground">{kr.department.toUpperCase().replace(/\s+/g, "_")}</TableCell>
                      <TableCell className="text-[10px] max-w-[280px] font-mono text-muted-foreground">
                        <span className="line-clamp-2">{kr.keyResult}</span>
                      </TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground">{kr.baseline || "--"}</TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground">{kr.target || "--"}</TableCell>
                      <TableCell className="text-[10px] font-semibold font-mono">{kr.actualCurrent || "--"}</TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground">
                        {kr.progressPercent !== undefined ? `${(kr.progressPercent * 100).toFixed(0)}%` : "--"}
                      </TableCell>
                      <TableCell>
                        <StatusText status={kr.status} />
                      </TableCell>
                      <TableCell className="text-[10px] max-w-[100px] truncate font-mono text-muted-foreground">{kr.owner}</TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground">{kr.reviewFrequency}</TableCell>
                      <TableCell>
                        {canEditDepartment(kr.department) && <KREditDialog kr={kr} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ScrollArea>
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

function KREditDialog({ kr }: { kr: any }) {
  const updateKR = useMutation(api.keyResults.update);
  const [actual, setActual] = useState(kr.actualCurrent || "");
  const [status, setStatus] = useState(kr.status);
  const [notes, setNotes] = useState(kr.notes || "");
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    await updateKR({
      id: kr._id,
      actualCurrent: actual || undefined,
      status: status !== kr.status ? status : undefined,
      notes: notes !== (kr.notes || "") ? notes : undefined,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "opacity-0 group-hover:opacity-100 h-7 w-7 p-0")}>
        <Pencil className="h-3 w-3" />
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <span className="font-mono text-[10px] bg-foreground/10 px-2 py-0.5 rounded font-semibold">{kr.krId}</span>
            UPDATE KEY RESULT
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <p className="text-[10px] font-medium mb-1 font-mono">{kr.keyResult}</p>
            <p className="text-[9px] text-muted-foreground font-mono tracking-wider">{kr.department.toUpperCase().replace(/\s+/g, "_")} | OWNER: {kr.owner.toUpperCase()}</p>
          </div>
          {kr.how && (
            <div className="bg-foreground/5 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-muted-foreground mb-1 font-mono tracking-widest">HOW</p>
              <p className="text-[10px] text-foreground whitespace-pre-wrap font-mono">{kr.how}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">ACTUAL CURRENT</label>
              <Input value={actual} onChange={(e) => setActual(e.target.value)} placeholder="Enter value" />
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">STATUS</label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? kr.status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="No data">NO DATA</SelectItem>
                  <SelectItem value="Achieved">ACHIEVED</SelectItem>
                  <SelectItem value="On track">ON TRACK</SelectItem>
                  <SelectItem value="Watch">WATCH</SelectItem>
                  <SelectItem value="Off track">OFF TRACK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">NOTES</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>CANCEL</Button>
            <Button size="sm" onClick={handleSave}>SAVE</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
