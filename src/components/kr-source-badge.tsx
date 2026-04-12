"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isGovernedPublishedKr } from "@/lib/governed-krs";

type KrSourceBadgeProps = {
  krId: string;
  className?: string;
};

export function KrSourceBadge({ krId, className }: KrSourceBadgeProps) {
  const governed = isGovernedPublishedKr(krId);

  return (
    <Badge
      variant="outline"
      title={governed ? "Auto-filled from governed daily-dashboard data." : "Manual value managed in the OKR app."}
      className={cn(
        "h-4 px-1.5 text-[8px] tracking-[0.18em]",
        governed
          ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300"
          : "border-border/60 bg-foreground/[0.03] text-muted-foreground",
        className
      )}
    >
      {governed ? "AUTO" : "MANUAL"}
    </Badge>
  );
}
