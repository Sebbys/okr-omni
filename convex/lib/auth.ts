import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

export async function getProfile(ctx: QueryCtx | MutationCtx): Promise<Doc<"profiles">> {
  const identity = await requireAuth(ctx);
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .first();
  if (!profile) {
    throw new Error("Profile not found. Contact your admin.");
  }
  return profile;
}

export async function requireAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<"profiles">> {
  const profile = await getProfile(ctx);
  if (profile.role !== "admin") {
    throw new Error("Admin access required");
  }
  return profile;
}

export async function canEditDepartment(
  ctx: QueryCtx | MutationCtx,
  department: string
): Promise<boolean> {
  const profile = await getProfile(ctx);
  if (profile.role === "admin") return true;
  if (profile.role === "viewer") return false;
  // HOD: check if any of user's departments appear in the KR's department string
  return profile.departments.some((d) => department.includes(d));
}

export async function requireEditDepartment(
  ctx: QueryCtx | MutationCtx,
  department: string
): Promise<void> {
  const allowed = await canEditDepartment(ctx, department);
  if (!allowed) {
    throw new Error("Not authorized to edit this department's data");
  }
}
