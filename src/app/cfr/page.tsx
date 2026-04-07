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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Skeleton } from "@/components/ui/skeleton";

export default function CFRPage() {
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const { isViewer } = useCurrentUser();

  const cfrs = useQuery(api.cfr.list, {});
  const krs = useQuery(api.keyResults.list, {});

  if (!cfrs || !krs) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-56 mt-2" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border/50 bg-card p-5">
              <Skeleton className="h-3 w-32 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const weeks = [...new Set(cfrs.map((c) => c.week))].sort().reverse();
  let filtered = cfrs;
  if (weekFilter !== "all") {
    filtered = cfrs.filter((c) => c.week === weekFilter);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-sm font-mono tracking-widest font-semibold">CFR</h1>
          <p className="text-muted-foreground text-[10px] font-mono tracking-wider mt-1">CONVERSATIONS, FEEDBACK, RECOGNITION | WEEKLY TEAM CHECK-INS</p>
        </div>
        {!isViewer && <AddCFRDialog krs={krs} weeks={weeks} />}
      </div>

      {/* Week filter */}
      <div className="border-b border-border/30 pb-4">
        <Select value={weekFilter} onValueChange={(v) => setWeekFilter(v ?? "all")}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="FILTER BY WEEK" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ALL WEEKS</SelectItem>
            {weeks.map((w) => (
              <SelectItem key={w} value={w}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* CFR Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border/50 bg-card py-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-foreground/5 mb-4">
            <MessageSquare className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="text-foreground/60 font-mono text-xs tracking-wider font-medium mb-1">NO CFR ENTRIES YET</p>
          <p className="text-muted-foreground/50 font-mono text-[10px] tracking-wider">ADD AN ENTRY TO START TRACKING CONVERSATIONS, FEEDBACK & RECOGNITION</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cfr) => (
            <div key={cfr._id} className="rounded-lg border border-border/50 bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-foreground/10 px-2 py-0.5 rounded font-mono font-semibold tracking-wider">{cfr.week}</span>
                  {cfr.krId && <span className="text-[9px] text-blue-600 dark:text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded font-mono font-semibold">{cfr.krId}</span>}
                </div>
                {cfr.owner && <span className="text-[9px] text-muted-foreground font-mono tracking-wider">{cfr.owner.toUpperCase()}</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cfr.whatMoved && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 border-l-3 border-l-emerald-500/30 rounded-lg p-3 hover:shadow-sm transition-shadow duration-200">
                    <p className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1 font-mono tracking-widest">WHAT MOVED</p>
                    <p className="text-[10px] text-foreground/70 font-mono">{cfr.whatMoved}</p>
                  </div>
                )}
                {cfr.blockers && (
                  <div className="bg-red-500/5 border border-red-500/10 border-l-3 border-l-red-500/30 rounded-lg p-3 hover:shadow-sm transition-shadow duration-200">
                    <p className="text-[9px] font-semibold text-red-600 dark:text-red-400 mb-1 font-mono tracking-widest">BLOCKERS</p>
                    <p className="text-[10px] text-foreground/70 font-mono">{cfr.blockers}</p>
                  </div>
                )}
                {cfr.supportNeeded && (
                  <div className="bg-amber-500/5 border border-amber-500/10 border-l-3 border-l-amber-500/30 rounded-lg p-3 hover:shadow-sm transition-shadow duration-200">
                    <p className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 mb-1 font-mono tracking-widest">SUPPORT NEEDED</p>
                    <p className="text-[10px] text-foreground/70 font-mono">{cfr.supportNeeded}</p>
                  </div>
                )}
                {cfr.learnings && (
                  <div className="bg-blue-500/5 border border-blue-500/10 border-l-3 border-l-blue-500/30 rounded-lg p-3 hover:shadow-sm transition-shadow duration-200">
                    <p className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 mb-1 font-mono tracking-widest">LEARNINGS</p>
                    <p className="text-[10px] text-foreground/70 font-mono">{cfr.learnings}</p>
                  </div>
                )}
                {cfr.recognition && (
                  <div className="bg-violet-500/5 border border-violet-500/10 border-l-3 border-l-violet-500/30 rounded-lg p-3 hover:shadow-sm transition-shadow duration-200">
                    <p className="text-[9px] font-semibold text-violet-600 dark:text-violet-400 mb-1 font-mono tracking-widest">RECOGNITION / WINS</p>
                    <p className="text-[10px] text-foreground/70 font-mono">{cfr.recognition}</p>
                  </div>
                )}
                {cfr.nextActions && (
                  <div className="bg-foreground/3 border border-border/30 border-l-3 border-l-foreground/20 rounded-lg p-3 hover:shadow-sm transition-shadow duration-200">
                    <p className="text-[9px] font-semibold text-foreground/60 mb-1 font-mono tracking-widest">NEXT ACTIONS</p>
                    <p className="text-[10px] text-foreground/70 font-mono">{cfr.nextActions}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddCFRDialog({ krs, weeks }: { krs: any[]; weeks: string[] }) {
  const addCfr = useMutation(api.cfr.add);
  const [open, setOpen] = useState(false);
  const [week, setWeek] = useState("");
  const [krId, setKrId] = useState("");
  const [owner, setOwner] = useState("");
  const [whatMoved, setWhatMoved] = useState("");
  const [blockers, setBlockers] = useState("");
  const [supportNeeded, setSupportNeeded] = useState("");
  const [learnings, setLearnings] = useState("");
  const [recognition, setRecognition] = useState("");
  const [nextActions, setNextActions] = useState("");

  const handleSubmit = async () => {
    if (!week) return;
    await addCfr({
      week,
      krId: krId || undefined,
      owner: owner || undefined,
      whatMoved: whatMoved || undefined,
      blockers: blockers || undefined,
      supportNeeded: supportNeeded || undefined,
      learnings: learnings || undefined,
      recognition: recognition || undefined,
      nextActions: nextActions || undefined,
    });
    setOpen(false);
    setWeek(""); setKrId(""); setOwner(""); setWhatMoved("");
    setBlockers(""); setSupportNeeded(""); setLearnings("");
    setRecognition(""); setNextActions("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm" }), "text-[10px] tracking-wider")}>
        <Plus className="h-3 w-3 mr-1.5" /> ADD ENTRY
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">ADD CFR ENTRY</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">WEEK *</label>
              <Input placeholder="e.g. 2026-W13 (Mar | Q1)" value={week} onChange={(e) => setWeek(e.target.value)} />
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">KR ID</label>
              <Select value={krId} onValueChange={(v) => setKrId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {krs.sort((a, b) => a.krId.localeCompare(b.krId, undefined, { numeric: true })).map((kr) => (
                    <SelectItem key={kr._id} value={kr.krId}>{kr.krId}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">OWNER</label>
              <Input placeholder="Who's reporting" value={owner} onChange={(e) => setOwner(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">WHAT MOVED THIS WEEK?</label>
            <Textarea value={whatMoved} onChange={(e) => setWhatMoved(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">BLOCKERS</label>
            <Textarea value={blockers} onChange={(e) => setBlockers(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">SUPPORT NEEDED</label>
            <Textarea value={supportNeeded} onChange={(e) => setSupportNeeded(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">LEARNINGS</label>
            <Textarea value={learnings} onChange={(e) => setLearnings(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">RECOGNITION / WINS</label>
            <Textarea value={recognition} onChange={(e) => setRecognition(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">NEXT ACTIONS</label>
            <Textarea value={nextActions} onChange={(e) => setNextActions(e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>CANCEL</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!week}>ADD ENTRY</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
