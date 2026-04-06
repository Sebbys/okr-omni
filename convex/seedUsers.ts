import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const HOD_ACCOUNTS = [
  { name: "Admin", email: "admin@omni.club", role: "admin" as const, departments: [] },
  { name: "General Manager", email: "gm@omni.club", role: "hod" as const, departments: ["Operations"] },
  { name: "Sales Lead", email: "sales@omni.club", role: "hod" as const, departments: ["Sales", "Sales + MEC"] },
  { name: "Fitness Lead", email: "fitness@omni.club", role: "hod" as const, departments: ["Fitness"] },
  { name: "Head of Nutrition", email: "nutrition@omni.club", role: "hod" as const, departments: ["Nutrition", "Nutrition + F&B"] },
  { name: "F&B Manager", email: "fnb@omni.club", role: "hod" as const, departments: ["F&B", "Nutrition + F&B"] },
  { name: "Marketing Lead", email: "marketing@omni.club", role: "hod" as const, departments: ["Marketing"] },
  { name: "MEC Lead", email: "mec@omni.club", role: "hod" as const, departments: ["Member Experience", "Member Experience & Wellness", "Member Success", "Sales + MEC"] },
  { name: "Community Lead", email: "community@omni.club", role: "hod" as const, departments: ["Community"] },
  { name: "Finance Lead", email: "finance@omni.club", role: "hod" as const, departments: ["Finance"] },
  { name: "HR Lead", email: "hr@omni.club", role: "hod" as const, departments: ["People & Culture"] },
  { name: "Product Lead", email: "product@omni.club", role: "hod" as const, departments: ["Product", "Product & Coaching"] },
  { name: "Lab Lead", email: "lab@omni.club", role: "hod" as const, departments: ["Lab", "WellnessLab", "Wellness Science"] },
  { name: "Retail Lead", email: "retail@omni.club", role: "hod" as const, departments: ["Retail"] },
  { name: "Tech Lead", email: "tech@omni.club", role: "hod" as const, departments: ["Tech & CX"] },
  { name: "FOH Manager", email: "foh@omni.club", role: "hod" as const, departments: ["Operations"] },
  { name: "Coworking Lead", email: "coworking@omni.club", role: "hod" as const, departments: ["Community"] },
  { name: "Recovery Lead", email: "recovery@omni.club", role: "hod" as const, departments: ["Wellness Science"] },
];

// Seed profile records. Run this AFTER creating Better Auth accounts.
// Usage: call from Convex dashboard or via a one-off script.
export const seedProfiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("profiles").take(1);
    if (existing.length > 0) {
      console.log("Profiles already seeded, skipping.");
      return;
    }

    for (const account of HOD_ACCOUNTS) {
      await ctx.db.insert("profiles", {
        tokenIdentifier: `placeholder:${account.email}`,
        name: account.name,
        email: account.email,
        role: account.role,
        departments: account.departments,
      });
    }

    console.log(`Seeded ${HOD_ACCOUNTS.length} profiles. Update tokenIdentifier after users sign up.`);
  },
});

// Update a profile's tokenIdentifier after a user signs up via Better Auth.
// Call this from the admin panel or after first login.
export const linkProfile = internalMutation({
  args: {
    email: v.string(),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!profile) {
      throw new Error(`No profile found for ${args.email}`);
    }
    await ctx.db.patch(profile._id, { tokenIdentifier: args.tokenIdentifier });
  },
});
