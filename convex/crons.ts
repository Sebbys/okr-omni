import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run on the 1st of each month at 17:00 UTC (01:00 WITA)
crons.cron(
  "monthly gymmaster sync",
  "0 17 1 * *",
  internal.gymMasterSync.syncAllMetrics,
  {},
);

export default crons;
