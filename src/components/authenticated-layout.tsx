"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ViewTransition } from "react";
import { useConvexAuth } from "convex/react";
import { Sidebar } from "@/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen" role="status" aria-live="polite">
        <div className="animate-pulse text-muted-foreground font-mono text-[10px] tracking-widest">AUTHENTICATING...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Sidebar />
      <main className="flex-1 lg:ml-60 min-h-screen bg-background">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <ViewTransition
            enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
            exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
            default="none"
          >
            {children}
          </ViewTransition>
        </div>
      </main>
    </TooltipProvider>
  );
}
