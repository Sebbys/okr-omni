"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  History,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const DEPARTMENTS = [
  "Community", "F&B", "Finance", "Fitness", "Lab", "Marketing",
  "Member Experience", "Member Experience & Wellness", "Member Success",
  "Nutrition", "Nutrition + F&B", "Operations", "People & Culture",
  "Product", "Product & Coaching", "Retail", "Sales", "Sales + MEC",
  "Tech & CX", "Wellness Science", "WellnessLab",
];

const roleBadgeStyles: Record<string, string> = {
  admin: "bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full",
  hod: "bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full",
  viewer: "bg-foreground/5 text-muted-foreground px-2 py-0.5 rounded-full",
};

export default function AdminPage() {
  const { isAdmin, isLoading } = useCurrentUser();
  const profiles = useQuery(api.profiles.listProfiles);
  const latestSync = useQuery(api.gymMasterSnapshot.latestSyncTime);
  const activeOverrides = useQuery(api.governedOverrides.listActive, {});
  const auditRows = useQuery(api.governedAudit.listAudit, {});

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48 mt-2" />
        </div>
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-8 w-8 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground font-mono text-[10px] tracking-widest">ADMIN ACCESS REQUIRED</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GovernedControlPanel
        latestSync={latestSync}
        activeOverrides={activeOverrides ?? []}
        auditRows={auditRows ?? []}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-sm font-mono tracking-widest font-semibold">USER MANAGEMENT</h1>
          <p className="text-muted-foreground text-[10px] font-mono tracking-wider mt-1">
            {profiles?.length ?? 0} USERS | MANAGE ROLES AND DEPT ACCESS
          </p>
        </div>
        <CreateProfileDialog />
      </div>

      <div className="rounded-lg border border-border/50 bg-card">
        <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-[9px] tracking-widest">NAME</TableHead>
                  <TableHead className="text-[9px] tracking-widest">EMAIL</TableHead>
                  <TableHead className="text-[9px] tracking-widest">ROLE</TableHead>
                  <TableHead className="text-[9px] tracking-widest">DEPTS</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles?.map((profile, index) => (
                  <TableRow key={profile._id} className={cn("group border-border/20 hover:bg-foreground/3", index % 2 === 1 && "bg-foreground/[0.02]")}>
                    <TableCell className="font-semibold text-[10px] font-mono">{profile.name.toUpperCase()}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-mono max-w-[200px] truncate" title={profile.email}>{profile.email}</TableCell>
                    <TableCell>
                      <span className={`text-[9px] font-mono tracking-wider font-medium ${roleBadgeStyles[profile.role]}`}>
                        {profile.role.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground max-w-[300px] truncate font-mono" title={profile.departments.join(", ")}>
                      {profile.departments.length > 0 ? profile.departments.map((d: string) => d.substring(0, 3).toUpperCase()).join(", ") : "--"}
                    </TableCell>
                    <TableCell>
                      <EditProfileDialog profile={profile} />
                    </TableCell>
                  </TableRow>
                ))}
                {(!profiles || profiles.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8 font-mono text-[10px] tracking-wider">
                      NO USERS YET. CREATE FIRST ACCOUNT.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}

function GovernedControlPanel({
  latestSync,
  activeOverrides,
  auditRows,
}: {
  latestSync: number | null | undefined;
  activeOverrides: any[];
  auditRows: any[];
}) {
  const runPublishedSync = useAction(api.gymMasterSync.runPublishedSync);
  const runPublishedBackfill = useAction(api.gymMasterSync.runPublishedBackfill);
  const [running, setRunning] = useState<null | "sync" | "backfill">(null);
  const [message, setMessage] = useState<string | null>(null);

  const recentAudit = auditRows.slice(0, 8);

  const handleLatestSync = async () => {
    setRunning("sync");
    setMessage(null);
    try {
      const result = await runPublishedSync({});
      setMessage(`Latest governed sync completed for ${result.period}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to run governed sync.");
    } finally {
      setRunning(null);
    }
  };

  const handleBackfill = async () => {
    setRunning("backfill");
    setMessage(null);
    try {
      const result = await runPublishedBackfill({ from: "2025-04" });
      setMessage(`Governed backfill completed for ${result.from} to ${result.to}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to run governed backfill.");
    } finally {
      setRunning(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="relative border-b border-border/50 px-5 py-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400">
                GOVERNED_OKR
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                PUBLISHED_ONLY
              </Badge>
            </div>
            <div>
              <h2 className="text-sm font-semibold font-mono tracking-[0.2em]">SYNC CONTROL ROOM</h2>
              <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground font-mono">
                Published governed KR values are pulled from <span className="text-foreground">daily-dashboard</span>, stored locally,
                and audited here. Raw GymMaster values stay out of the main OKR path.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleLatestSync}
              disabled={running !== null}
              className="text-[10px] tracking-wider"
            >
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", running === "sync" && "animate-spin")} />
              SYNC_LATEST_CLOSED_MONTH
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBackfill}
              disabled={running !== null}
              className="text-[10px] tracking-wider"
            >
              <History className={cn("mr-1.5 h-3.5 w-3.5", running === "backfill" && "animate-pulse")} />
              BACKFILL_FROM_2025_04
            </Button>
          </div>
        </div>

        {message && (
          <div className="mt-4 rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-[10px] font-mono tracking-wider text-muted-foreground">
            {message}
          </div>
        )}
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricSyncStat
              icon={ShieldCheck}
              label="LAST LOCAL SNAPSHOT"
              value={latestSync ? formatDateTime(latestSync) : "NEVER"}
              tone="emerald"
              detail="Latest published governed import stored in dashboard."
            />
            <MetricSyncStat
              icon={Lock}
              label="ACTIVE OVERRIDES"
              value={String(activeOverrides.length)}
              tone={activeOverrides.length > 0 ? "amber" : "slate"}
              detail="Admin-approved exceptions that currently outrank sync writes."
            />
            <MetricSyncStat
              icon={Sparkles}
              label="AUDIT EVENTS"
              value={String(auditRows.length)}
              tone="blue"
              detail="Sync, skip, and override events retained for debugging."
            />
          </div>

          <div className="space-y-3">
            <SectionHeading
              icon={AlertTriangle}
              title="Active Overrides"
              subtitle="These are the only cases where governed monthly values are intentionally not the displayed value."
            />
            <div className="overflow-hidden rounded-xl border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="text-[9px] tracking-widest">KR_ID</TableHead>
                    <TableHead className="text-[9px] tracking-widest">PERIOD</TableHead>
                    <TableHead className="text-[9px] tracking-widest">VALUE</TableHead>
                    <TableHead className="text-[9px] tracking-widest">APPROVED BY</TableHead>
                    <TableHead className="text-[9px] tracking-widest">REASON</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeOverrides.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-[10px] font-mono tracking-wider text-muted-foreground">
                        NO_ACTIVE_OVERRIDES
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeOverrides
                      .sort((a, b) => b.createdAt - a.createdAt)
                      .map((override) => (
                        <TableRow key={override._id} className="border-border/20">
                          <TableCell className="font-mono text-[10px] font-semibold">{override.krId}</TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground">{override.period}</TableCell>
                          <TableCell className="font-mono text-[10px]">{formatNumeric(override.value)}</TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground">{override.approvedBy}</TableCell>
                          <TableCell className="max-w-[300px] truncate text-[10px] text-muted-foreground" title={override.reason}>
                            {override.reason}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 px-5 py-5 lg:border-l lg:border-t-0">
          <SectionHeading
            icon={History}
            title="Recent Audit Trail"
            subtitle="System writes, skips, and admin exceptions for governed monthly KR sync."
          />
          <div className="mt-3 space-y-2">
            {recentAudit.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-[10px] font-mono tracking-wider text-muted-foreground">
                NO_AUDIT_EVENTS_YET
              </div>
            ) : (
              recentAudit.map((event, index) => (
                <div key={event._id} className="rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AuditActionBadge action={event.action} />
                        <span className="text-[10px] font-semibold font-mono">{event.krId}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{event.period}</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-muted-foreground">
                        {event.reason || "Governed audit event recorded."}
                      </p>
                    </div>
                    <span className="shrink-0 text-[9px] font-mono tracking-wider text-muted-foreground">
                      {formatDateTime(event.createdAt)}
                    </span>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid gap-2 text-[9px] font-mono tracking-wider text-muted-foreground sm:grid-cols-3">
                    <span>SOURCE: {event.sourceValue !== undefined ? formatNumeric(event.sourceValue) : "--"}</span>
                    <span>PREV: {event.previousValue !== undefined ? formatNumeric(event.previousValue) : "--"}</span>
                    <span>RESULT: {event.resultingValue !== undefined ? formatNumeric(event.resultingValue) : "--"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-[11px] font-semibold font-mono tracking-[0.18em]">{title.toUpperCase()}</h3>
      </div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function MetricSyncStat({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  detail: string;
  tone: "emerald" | "amber" | "blue" | "slate";
}) {
  const toneClass = {
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border-emerald-500/20",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/8 border-amber-500/20",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/8 border-blue-500/20",
    slate: "text-foreground bg-foreground/5 border-border/60",
  }[tone];

  return (
    <div className={cn("rounded-xl border px-3 py-3", toneClass)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[9px] font-mono tracking-[0.18em]">{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="mt-3 text-[14px] font-semibold font-mono leading-none">{value}</div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  );
}

function AuditActionBadge({ action }: { action: string }) {
  const config: Record<string, { label: string; className: string }> = {
    sync_applied: { label: "SYNC_APPLIED", className: "border-emerald-500/30 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400" },
    sync_skipped_missing: { label: "MISSING_SOURCE", className: "border-amber-500/30 bg-amber-500/8 text-amber-600 dark:text-amber-400" },
    sync_skipped_override: { label: "OVERRIDE_ACTIVE", className: "border-orange-500/30 bg-orange-500/8 text-orange-600 dark:text-orange-400" },
    override_applied: { label: "OVERRIDE_APPLIED", className: "border-violet-500/30 bg-violet-500/8 text-violet-600 dark:text-violet-400" },
    override_cleared: { label: "OVERRIDE_CLEARED", className: "border-blue-500/30 bg-blue-500/8 text-blue-600 dark:text-blue-400" },
  };

  const item = config[action] ?? { label: action.toUpperCase(), className: "border-border/60 bg-foreground/5 text-foreground" };
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[9px] font-mono tracking-wider", item.className)}>
      {item.label}
    </span>
  );
}

function formatDateTime(value: number) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumeric(value: number) {
  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US").format(value);
  }
  return String(value);
}

function CreateProfileDialog() {
  const createProfile = useMutation(api.profiles.createProfile);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("hod");
  const [departments, setDepartments] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!name || !email) return;
    await createProfile({
      tokenIdentifier: `placeholder:${email}`,
      name,
      email,
      role: role as "admin" | "hod" | "viewer",
      departments,
    });
    setOpen(false);
    setName("");
    setEmail("");
    setRole("hod");
    setDepartments([]);
  };

  const toggleDept = (dept: string) => {
    setDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm" }), "text-[10px] tracking-wider")}>
        <Plus className="h-3 w-3 mr-1.5" /> ADD USER
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">ADD USER PROFILE</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">NAME</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">EMAIL</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@omni.club" />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">ROLE</label>
            <Select value={role} onValueChange={(v) => setRole(v ?? "hod")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="hod">Head of Department</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === "hod" && (
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-2 block text-muted-foreground">DEPARTMENTS</label>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDept(dept)}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded-md border transition-colors font-mono",
                      departments.includes(dept)
                        ? "bg-foreground/10 text-foreground border-foreground/20"
                        : "bg-transparent text-muted-foreground border-border/50 hover:bg-foreground/5"
                    )}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>CANCEL</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!name || !email}>CREATE</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditProfileDialog({ profile }: { profile: any }) {
  const updateProfile = useMutation(api.profiles.updateProfile);
  const deleteProfile = useMutation(api.profiles.deleteProfile);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [departments, setDepartments] = useState<string[]>(profile.departments);

  const handleSave = async () => {
    await updateProfile({
      id: profile._id,
      name,
      role: role as "admin" | "hod" | "viewer",
      departments,
    });
    setOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${profile.name}?`)) return;
    await deleteProfile({ id: profile._id });
    setOpen(false);
  };

  const toggleDept = (dept: string) => {
    setDepartments((prev: string[]) =>
      prev.includes(dept) ? prev.filter((d: string) => d !== dept) : [...prev, dept]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "opacity-0 group-hover:opacity-100 h-7 w-7 p-0")}>
        <Pencil className="h-3 w-3" />
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">EDIT {profile.name.toUpperCase()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">NAME</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-[9px] font-mono tracking-widest mb-1 block text-muted-foreground">ROLE</label>
            <Select value={role} onValueChange={(v) => setRole(v ?? profile.role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="hod">Head of Department</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === "hod" && (
            <div>
              <label className="text-[9px] font-mono tracking-widest mb-2 block text-muted-foreground">DEPARTMENTS</label>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDept(dept)}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded-md border transition-colors font-mono",
                      departments.includes(dept)
                        ? "bg-foreground/10 text-foreground border-foreground/20"
                        : "bg-transparent text-muted-foreground border-border/50 hover:bg-foreground/5"
                    )}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={handleDelete} className="hover:bg-red-500/10 hover:text-red-500 transition-colors duration-150">
              <Trash2 className="h-3 w-3 mr-1" /> DELETE
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>CANCEL</Button>
              <Button size="sm" onClick={handleSave}>SAVE</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
