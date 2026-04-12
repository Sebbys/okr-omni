"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Lock, Search, Pencil, Plus, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Skeleton } from "@/components/ui/skeleton";
import { isGovernedPublishedKr } from "@/lib/governed-krs";
import { KrSourceBadge } from "@/components/kr-source-badge";

export default function OKRMasterPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [objectiveFilter, setObjectiveFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const { isAdmin, canEditDepartment } = useCurrentUser();

  const allKrs = useQuery(api.keyResults.list, {});
  const objectives = useQuery(api.objectives.list);
  const governedPeriods = useQuery(api.gymMasterSnapshot.listPeriods);
  const activeOverrides = useQuery(api.governedOverrides.listActive, {});

  if (!allKrs || !objectives) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48 mt-2" />
          </div>
        </div>
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-mono tracking-widest font-semibold">OKR MASTER</h1>
          <p className="text-muted-foreground text-[10px] font-mono tracking-wider mt-1">{allKrs.length} KRS | {objectives.length} OBJECTIVES</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <AddObjectiveDialog />
            <AddKRDialog objectives={objectives} />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="border-b border-border/30 pb-4">
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
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="OBJECTIVE" />
            </SelectTrigger>
            <SelectContent className="min-w-[450px]">
              <SelectItem value="all">ALL OBJECTIVES</SelectItem>
              {objectives
                .sort((a, b) => a.objectiveId.localeCompare(b.objectiveId, undefined, { numeric: true }))
                .map((obj) => (
                  <SelectItem key={obj._id} value={obj.objectiveId}>
                    {obj.objectiveId}: {obj.name}
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
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest w-10"></TableHead>
                <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">KR_ID</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">OBJ</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">KEY RESULT</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">DEPT</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">TARGET</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">ACTUAL</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">STATUS</TableHead>
                <TableHead className="sticky top-0 z-10 bg-card border-b border-border/30 text-[9px] tracking-widest">OWNER</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((kr, index) => (
                <TableRow key={kr._id} className={cn("group border-border/20 hover:bg-foreground/5", index % 2 === 0 && "bg-foreground/[0.02]")}>
                  <TableCell className="w-10 px-2">
                    {canEditDepartment(kr.department) && (
                      <KREditDialog
                        kr={kr}
                        governedPeriods={governedPeriods ?? []}
                        activeOverride={(activeOverrides ?? []).find((override) => override.krId === kr.krId && override.active)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] font-semibold text-foreground whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{kr.krId}</span>
                      <KrSourceBadge krId={kr.krId} />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground">{kr.objectiveId}</TableCell>
                  <TableCell className="text-[10px] font-mono text-muted-foreground max-w-[300px]" title={kr.keyResult}>
                    <span className="line-clamp-2">{kr.keyResult}</span>
                  </TableCell>
                  <TableCell className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{kr.department}</TableCell>
                  <TableCell className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{kr.target || "--"}</TableCell>
                  <TableCell className="text-[10px] font-semibold font-mono whitespace-nowrap">{kr.actualCurrent || "--"}</TableCell>
                  <TableCell>
                    <StatusText status={kr.status} />
                  </TableCell>
                  <TableCell className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{kr.owner}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
  const bgMap: Record<string, string> = {
    "Achieved": "bg-emerald-500/10",
    "On track": "bg-blue-500/10",
    "Watch": "bg-amber-500/10",
    "Off track": "bg-red-500/10",
    "No data": "bg-foreground/5",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider font-medium whitespace-nowrap ${colorMap[status] || "text-muted-foreground"} ${bgMap[status] || "bg-foreground/5"}`}>
      {status.toUpperCase().replace(/\s+/g, "_")}
    </span>
  );
}

// --- Add Objective Dialog ---

function AddObjectiveDialog() {
  const addObjective = useMutation(api.objectives.add);
  const [objectiveId, setObjectiveId] = useState("");
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!objectiveId || !name) { setError("All fields are required"); return; }
    try {
      await addObjective({ objectiveId, name });
      setObjectiveId(""); setName(""); setOpen(false);
    } catch (e: any) {
      setError(e.message || "Failed to add objective");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-[10px] font-mono tracking-wider")}>
        <Plus className="h-3 w-3 mr-1.5" /> OBJECTIVE
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono tracking-wider">ADD OBJECTIVE</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-[10px] text-red-600 dark:text-red-400 font-mono">{error}</div>
          )}
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">OBJECTIVE ID</label>
            <Input value={objectiveId} onChange={(e) => setObjectiveId(e.target.value)} placeholder="e.g. O12" />
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">OBJECTIVE NAME</label>
            <Textarea value={name} onChange={(e) => setName(e.target.value)} placeholder="Describe the objective" rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>CANCEL</Button>
            <Button size="sm" onClick={handleSave}>ADD</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Add KR Dialog ---

function AddKRDialog({ objectives }: { objectives: any[] }) {
  const addKR = useMutation(api.keyResults.add);
  const departments = useQuery(api.lists.getByCategory, { category: "departments" });
  const owners = useQuery(api.lists.getByCategory, { category: "owners" });

  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    krId: "",
    krType: "Committed",
    objectiveId: "",
    keyResult: "",
    department: "",
    dataSource: "",
    baseline: "",
    target: "",
    owner: "",
    reviewFrequency: "Monthly",
    how: "",
    section: "main",
  });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setError(null);
    if (!form.krId || !form.objectiveId || !form.keyResult || !form.department || !form.owner) {
      setError("KR ID, Objective, Key Result, Department, and Owner are required");
      return;
    }
    const obj = objectives.find((o) => o.objectiveId === form.objectiveId);
    try {
      await addKR({
        krId: form.krId,
        krType: form.krType,
        objectiveId: form.objectiveId,
        objective: obj?.name || "",
        department: form.department,
        keyResult: form.keyResult,
        dataSource: form.dataSource || "Manual",
        baseline: form.baseline || undefined,
        target: form.target || undefined,
        status: "No data",
        owner: form.owner,
        reviewFrequency: form.reviewFrequency,
        how: form.how || undefined,
        section: form.section || undefined,
      });
      setForm({ krId: "", krType: "Committed", objectiveId: "", keyResult: "", department: "", dataSource: "", baseline: "", target: "", owner: "", reviewFrequency: "Monthly", how: "", section: "main" });
      setOpen(false);
    } catch (e: any) {
      setError(e.message || "Failed to add KR");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm" }), "text-[10px] font-mono tracking-wider")}>
        <Plus className="h-3 w-3 mr-1.5" /> KEY RESULT
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono tracking-wider">ADD KEY RESULT</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-[10px] text-red-600 dark:text-red-400 font-mono">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">KR ID</label>
              <Input value={form.krId} onChange={(e) => set("krId", e.target.value)} placeholder="e.g. KR-067" />
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">TYPE</label>
              <Select value={form.krType} onValueChange={(v) => v && set("krType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Committed">COMMITTED</SelectItem>
                  <SelectItem value="Aspirational">ASPIRATIONAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">OBJECTIVE</label>
              <Select value={form.objectiveId} onValueChange={(v) => v && set("objectiveId", v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {objectives
                    .sort((a, b) => a.objectiveId.localeCompare(b.objectiveId, undefined, { numeric: true }))
                    .map((obj) => (
                      <SelectItem key={obj._id} value={obj.objectiveId}>{obj.objectiveId}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">DEPARTMENT</label>
              <Select value={form.department} onValueChange={(v) => v && set("department", v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {(departments || []).map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">KEY RESULT</label>
            <Textarea value={form.keyResult} onChange={(e) => set("keyResult", e.target.value)} placeholder="Describe the key result" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">BASELINE</label>
              <Input value={form.baseline} onChange={(e) => set("baseline", e.target.value)} placeholder="Starting value" />
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">TARGET</label>
              <Input value={form.target} onChange={(e) => set("target", e.target.value)} placeholder="Target value" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">OWNER</label>
              <Select value={form.owner} onValueChange={(v) => v && set("owner", v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {(owners || []).map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">REVIEW FREQUENCY</label>
              <Select value={form.reviewFrequency} onValueChange={(v) => v && set("reviewFrequency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">WEEKLY</SelectItem>
                  <SelectItem value="Monthly">MONTHLY</SelectItem>
                  <SelectItem value="Quarterly">QUARTERLY</SelectItem>
                  <SelectItem value="Annual">ANNUAL</SelectItem>
                  <SelectItem value="Manual">MANUAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">SECTION</label>
              <Select value={form.section} onValueChange={(v) => v && set("section", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">MAIN</SelectItem>
                  <SelectItem value="operational">OPERATIONAL</SelectItem>
                  <SelectItem value="secondary">SECONDARY</SelectItem>
                  <SelectItem value="individual">INDIVIDUAL DEPT</SelectItem>
                  <SelectItem value="future">FUTURE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">DATA SOURCE</label>
              <Input value={form.dataSource} onChange={(e) => set("dataSource", e.target.value)} placeholder="e.g. Manual, GymMaster" />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">HOW</label>
            <Textarea value={form.how} onChange={(e) => set("how", e.target.value)} placeholder="How will this be achieved?" rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>CANCEL</Button>
            <Button size="sm" onClick={handleSave}>ADD</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit KR Dialog ---

function KREditDialog({
  kr,
  governedPeriods,
  activeOverride,
}: {
  kr: any;
  governedPeriods: string[];
  activeOverride?: any;
}) {
  const updateKR = useMutation(api.keyResults.update);
  const applyOverride = useMutation(api.governedOverrides.applyOverride);
  const clearOverride = useMutation(api.governedOverrides.clearOverride);
  const { isAdmin } = useCurrentUser();
  const governed = isGovernedPublishedKr(kr.krId);
  const [actual, setActual] = useState(kr.actualCurrent || "");
  const [target, setTarget] = useState(kr.target || "");
  const [baseline, setBaseline] = useState(kr.baseline || "");
  const [status, setStatus] = useState(kr.status);
  const [notes, setNotes] = useState(kr.notes || "");
  const [overridePeriod, setOverridePeriod] = useState(activeOverride?.period || governedPeriods[0] || "");
  const [overrideValue, setOverrideValue] = useState(activeOverride ? String(activeOverride.value) : kr.actualCurrent || "");
  const [overrideReason, setOverrideReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    try {
      setError(null);
      await updateKR({
        id: kr._id,
        actualCurrent: actual || undefined,
        target: target !== (kr.target || "") ? target : undefined,
        baseline: baseline !== (kr.baseline || "") ? baseline : undefined,
        status: status !== kr.status ? status : undefined,
        notes: notes !== (kr.notes || "") ? notes : undefined,
      });
      setOpen(false);
    } catch (e: any) {
      setError(e.message || "Failed to update key result");
    }
  };

  const handleApplyOverride = async () => {
    if (!overridePeriod || !overrideValue || !overrideReason) {
      setError("Override period, value, and reason are required.");
      return;
    }
    try {
      setError(null);
      await applyOverride({
        krId: kr.krId,
        period: overridePeriod,
        value: parseFloat(overrideValue),
        reason: overrideReason,
      });
      setOpen(false);
    } catch (e: any) {
      setError(e.message || "Failed to apply override.");
    }
  };

  const handleClearOverride = async () => {
    if (!activeOverride) return;
    try {
      setError(null);
      await clearOverride({
        krId: kr.krId,
        period: activeOverride.period,
      });
      setOpen(false);
    } catch (e: any) {
      setError(e.message || "Failed to clear override.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 w-7 p-0")}>
        <Pencil className="h-3 w-3" />
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <span className="font-mono text-[10px] bg-foreground/10 px-2 py-0.5 rounded font-semibold">{kr.krId}</span>
            {governed && (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/8 text-[8px] text-emerald-600 dark:text-emerald-400">
                PUBLISHED_GOVERNED
              </Badge>
            )}
            UPDATE KEY RESULT
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-mono text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <div>
            <p className="text-[10px] font-medium mb-1 font-mono">{kr.keyResult}</p>
            <p className="text-[9px] text-muted-foreground font-mono tracking-wider">{kr.department.toUpperCase().replace(/\s+/g, "_")} | OWNER: {kr.owner.toUpperCase()}</p>
          </div>
          {governed && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[10px] font-semibold font-mono tracking-wider text-emerald-700 dark:text-emerald-300">
                  GOVERNED VALUE PATH
                </p>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Actual and status are locked to the published monthly governed snapshot from <span className="text-foreground">daily-dashboard</span>.
                Only admins can apply a traced exception.
              </p>
              {activeOverride && (
                <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-[9px] font-mono tracking-wider text-amber-700 dark:text-amber-300">
                      ACTIVE_OVERRIDE {activeOverride.period} · {activeOverride.value}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{activeOverride.reason}</p>
                </div>
              )}
            </div>
          )}
          {kr.how && (
            <div className="bg-foreground/5 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-muted-foreground mb-1 font-mono tracking-widest">HOW</p>
              <p className="text-[10px] text-foreground whitespace-pre-wrap font-mono">{kr.how}</p>
            </div>
          )}
          {isAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">BASELINE</label>
                <Input value={baseline} onChange={(e) => setBaseline(e.target.value)} placeholder="Baseline value" />
              </div>
              <div>
                <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">TARGET</label>
                <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target value" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">ACTUAL CURRENT</label>
              <Input
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                placeholder="Enter value"
                disabled={governed}
              />
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">STATUS</label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? kr.status)} disabled={governed}>
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
          {governed && isAdmin && (
            <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-4">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] font-semibold font-mono tracking-wider">ADMIN OVERRIDE</p>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Use only when the governed value is wrong and you need a persistent approved exception.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">OVERRIDE PERIOD</label>
                  <Select value={overridePeriod} onValueChange={(v) => setOverridePeriod(v ?? overridePeriod)}>
                    <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                    <SelectContent>
                      {governedPeriods.map((period) => (
                        <SelectItem key={period} value={period}>{period}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">OVERRIDE VALUE</label>
                  <Input value={overrideValue} onChange={(e) => setOverrideValue(e.target.value)} placeholder="Override value" />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">APPROVAL REASON</label>
                <Textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  placeholder="Why this governed exception is necessary"
                />
              </div>
              <div className="mt-4 flex justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearOverride}
                  disabled={!activeOverride}
                >
                  CLEAR ACTIVE OVERRIDE
                </Button>
                <Button size="sm" onClick={handleApplyOverride}>
                  APPLY OVERRIDE
                </Button>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>CANCEL</Button>
            <Button size="sm" onClick={handleSave} disabled={governed && !isAdmin}>
              SAVE
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
