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

  // Cache GymMaster data
  gymMasterCache: defineTable({
    endpoint: v.string(),
    data: v.string(), // JSON stringified
    fetchedAt: v.number(),
  }).index("by_endpoint", ["endpoint"]),
});
