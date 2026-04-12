import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  objectives: defineTable({
    objectiveId: v.string(),
    name: v.string(),
  }).index("by_objectiveId", ["objectiveId"]),

  keyResults: defineTable({
    krId: v.string(),
    krType: v.string(), // "Committed" | "Aspirational"
    objectiveId: v.string(),
    objective: v.string(),
    department: v.string(),
    keyResult: v.string(),
    dataSource: v.string(),
    baseline: v.optional(v.string()),
    target: v.optional(v.string()),
    actualCurrent: v.optional(v.string()),
    progressPercent: v.optional(v.number()),
    status: v.string(),
    owner: v.string(),
    reportingTo: v.optional(v.string()),
    reviewFrequency: v.string(),
    how: v.optional(v.string()),
    notes: v.optional(v.string()),
    section: v.optional(v.string()), // "main" | "operational" | "secondary" | "individual" | "future"
  })
    .index("by_krId", ["krId"])
    .index("by_objectiveId", ["objectiveId"])
    .index("by_status", ["status"])
    .index("by_department", ["department"]),

  updateLog: defineTable({
    date: v.string(),
    period: v.string(),
    krId: v.string(),
    actual: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_krId", ["krId"])
    .index("by_date", ["date"]),

  cfr: defineTable({
    date: v.optional(v.string()),
    week: v.string(),
    krId: v.optional(v.string()),
    owner: v.optional(v.string()),
    whatMoved: v.optional(v.string()),
    blockers: v.optional(v.string()),
    supportNeeded: v.optional(v.string()),
    learnings: v.optional(v.string()),
    recognition: v.optional(v.string()),
    nextActions: v.optional(v.string()),
  }).index("by_week", ["week"]),

  metricDefinitions: defineTable({
    kpi: v.string(),
    definition: v.string(),
    sourceSystem: v.string(),
    primaryOwner: v.string(),
  }),

  lists: defineTable({
    category: v.string(), // "owners" | "frequencies" | "directions" | "statuses" | "departments"
    values: v.array(v.string()),
  }).index("by_category", ["category"]),

  // User profiles with role and department assignments
  profiles: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("hod"), v.literal("viewer")),
    departments: v.array(v.string()),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  // Cache GymMaster data (5-min TTL for live page)
  gymMasterCache: defineTable({
    endpoint: v.string(),
    data: v.string(), // JSON stringified
    fetchedAt: v.number(),
  }).index("by_endpoint", ["endpoint"]),

  // Monthly governed OKR snapshots imported from daily-dashboard
  gymMasterSnapshot: defineTable({
    date: v.string(), // "2026-04" monthly period
    metricKey: v.string(), // "wmam", "long_term_membership_mix", "visits_per_member_per_week"
    value: v.number(),
    metadata: v.optional(v.string()), // JSON for breakdowns (segments, reasons, etc.)
    fetchedAt: v.number(),
  })
    .index("by_date_and_metricKey", ["date", "metricKey"])
    .index("by_metricKey", ["metricKey"]),

  // Append-only revision log for governed published metric imports
  governedSnapshotRevision: defineTable({
    runId: v.string(),
    syncKind: v.string(), // "scheduled" | "backfill"
    period: v.string(),
    metricKey: v.string(),
    krId: v.string(),
    value: v.number(),
    metadata: v.optional(v.string()),
    fetchedAt: v.number(),
    sourceComputedAt: v.optional(v.string()),
  })
    .index("by_runId", ["runId"])
    .index("by_period_and_metricKey", ["period", "metricKey"])
    .index("by_krId_and_period", ["krId", "period"]),

  // Admin-approved exceptions for governed KRs. Active overrides out-rank sync writes.
  governedOverride: defineTable({
    krId: v.string(),
    period: v.string(),
    value: v.number(),
    reason: v.string(),
    sourceValue: v.optional(v.number()),
    approvedBy: v.string(),
    createdAt: v.number(),
    active: v.boolean(),
    clearedAt: v.optional(v.number()),
    clearedBy: v.optional(v.string()),
  })
    .index("by_krId_period_active", ["krId", "period", "active"])
    .index("by_period", ["period"]),

  // Audit/debug trail for governed syncs and override actions
  governedSyncAudit: defineTable({
    runId: v.optional(v.string()),
    syncKind: v.optional(v.string()),
    action: v.string(),
    period: v.string(),
    krId: v.string(),
    metricKey: v.optional(v.string()),
    sourceValue: v.optional(v.number()),
    previousValue: v.optional(v.number()),
    resultingValue: v.optional(v.number()),
    actor: v.string(),
    reason: v.optional(v.string()),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_krId_and_period", ["krId", "period"])
    .index("by_period", ["period"])
    .index("by_runId", ["runId"]),

  // Legacy table kept for compatibility; governed KR sync no longer uses these mappings
  krAutoMapping: defineTable({
    krId: v.string(),
    metricKey: v.string(),
    transform: v.string(), // "direct" | "percentage" | "ratio"
    enabled: v.boolean(),
  })
    .index("by_krId", ["krId"])
    .index("by_metricKey", ["metricKey"]),
});
