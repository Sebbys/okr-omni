"use client";

import { usePathname } from "next/navigation";
import { ViewTransition } from "react";
import { Sidebar } from "@/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
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
