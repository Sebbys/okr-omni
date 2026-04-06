"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ViewTransition } from "react";
import {
  LayoutDashboard,
  Target,
  ClipboardList,
  MessageSquare,
  Activity,
  BookOpen,
  Crown,
  Shield,
  LogOut,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ceo", label: "CEO Dashboard", icon: Crown },
  { href: "/okr-master", label: "OKR Master", icon: Target },
  { href: "/update-log", label: "Update Log", icon: ClipboardList },
  { href: "/cfr", label: "CFR", icon: MessageSquare },
  { href: "/gymmaster", label: "GymMaster Live", icon: Activity },
  { href: "/metrics", label: "Metric Definitions", icon: BookOpen },
];

const roleLabels: Record<string, string> = {
  admin: "Admin",
  hod: "Head of Dept",
  viewer: "Viewer",
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[11px] font-medium font-mono tracking-wider text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
    >
      <Sun className="h-3.5 w-3.5 hidden dark:block" />
      <Moon className="h-3.5 w-3.5 dark:hidden" />
      <span className="dark:hidden">DARK_MODE</span>
      <span className="hidden dark:inline">LIGHT_MODE</span>
    </button>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { profile, isAdmin } = useCurrentUser();

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-border/50 px-5">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-foreground/90 flex items-center justify-center">
            <span className="text-background font-bold text-xs">O</span>
          </div>
          <div>
            <span className="text-xs font-semibold font-mono tracking-widest text-foreground">OMNI_OKR</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              transitionTypes={["nav-forward"]}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-[11px] font-medium font-mono tracking-wider transition-colors",
                isActive
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-3.5 w-3.5", isActive ? "text-foreground" : "text-muted-foreground")} />
              {item.label.toUpperCase().replace(/\s+/g, "_")}
              {item.label === "GymMaster Live" && (
                <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            onClick={onNavigate}
            transitionTypes={["nav-forward"]}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-[11px] font-medium font-mono tracking-wider transition-colors",
              pathname === "/admin"
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <Shield className={cn("h-3.5 w-3.5", pathname === "/admin" ? "text-foreground" : "text-muted-foreground")} />
            USER_MGMT
          </Link>
        )}
      </nav>

      <div className="border-t border-border/50 p-3 space-y-2">
        {profile && (
          <div className="rounded-md bg-foreground/5 px-3 py-2">
            <p className="text-[11px] font-medium font-mono tracking-wider truncate">{profile.name.toUpperCase()}</p>
            <p className="text-[10px] text-muted-foreground truncate font-mono">{profile.email}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono tracking-wider">
              {(roleLabels[profile.role] ?? profile.role).toUpperCase()}
              {profile.role === "hod" && profile.departments.length > 0 && (
                <span> | {profile.departments.map((d: string) => d.substring(0, 3).toUpperCase()).join(", ")}</span>
              )}
            </p>
          </div>
        )}
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[11px] font-medium font-mono tracking-wider text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          SIGN_OUT
        </button>
      </div>
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <ViewTransition name="sidebar" default="none">
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-60 border-r border-border/50 bg-background flex-col">
        <SidebarNav />
      </aside>
    </ViewTransition>
  );
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden sticky top-0 z-40 flex h-12 items-center border-b border-border/50 bg-background/80 backdrop-blur-md px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="p-1.5 rounded-md hover:bg-foreground/5 transition-colors">
          <Menu className="h-4 w-4 text-foreground" />
        </SheetTrigger>
        <SheetContent side="left" showCloseButton={false} className="w-60 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2 ml-3">
        <div className="h-5 w-5 rounded-sm bg-foreground/90 flex items-center justify-center">
          <span className="text-background font-bold text-[9px]">O</span>
        </div>
        <span className="text-[10px] font-semibold font-mono tracking-widest text-foreground">OMNI_OKR</span>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileHeader />
    </>
  );
}
