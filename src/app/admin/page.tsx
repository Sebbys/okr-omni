"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
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
import { Shield, Plus, Pencil, Trash2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

const DEPARTMENTS = [
  "Community", "F&B", "Finance", "Fitness", "Lab", "Marketing",
  "Member Experience", "Member Experience & Wellness", "Member Success",
  "Nutrition", "Nutrition + F&B", "Operations", "People & Culture",
  "Product", "Product & Coaching", "Retail", "Sales", "Sales + MEC",
  "Tech & CX", "Wellness Science", "WellnessLab",
];

const roleColors: Record<string, string> = {
  admin: "text-violet-600 dark:text-violet-400",
  hod: "text-blue-600 dark:text-blue-400",
  viewer: "text-muted-foreground",
};

export default function AdminPage() {
  const { isAdmin, isLoading } = useCurrentUser();
  const profiles = useQuery(api.profiles.listProfiles);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground font-mono text-[10px] tracking-widest">LOADING...</div>
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
          <div className="min-w-[500px]">
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
                {profiles?.map((profile) => (
                  <TableRow key={profile._id} className="group border-border/20 hover:bg-foreground/3">
                    <TableCell className="font-semibold text-[10px] font-mono">{profile.name.toUpperCase()}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-mono">{profile.email}</TableCell>
                    <TableCell>
                      <span className={`text-[9px] font-mono tracking-wider font-medium ${roleColors[profile.role]}`}>
                        {profile.role.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground max-w-[300px] font-mono">
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
    </div>
  );
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
            <Button variant="destructive" size="sm" onClick={handleDelete}>
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
