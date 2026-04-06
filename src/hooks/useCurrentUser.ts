"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const profile = useQuery(api.profiles.getMyProfile);

  return {
    profile,
    isLoading: profile === undefined,
    isAdmin: profile?.role === "admin",
    isHOD: profile?.role === "hod",
    isViewer: profile?.role === "viewer",
    canEditDepartment: (department: string) => {
      if (!profile) return false;
      if (profile.role === "admin") return true;
      if (profile.role === "viewer") return false;
      return profile.departments.some((d) => department.includes(d));
    },
  };
}
