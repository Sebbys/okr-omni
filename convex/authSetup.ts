"use node";

import { betterAuth } from "better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import authConfig from "./auth.config";
import { component } from "./auth";

export const createAuth = (ctx: any) =>
  betterAuth({
    database: component.adapter(ctx),
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((s) => s.trim()),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    plugins: [
      convex({ authConfig }),
    ],
  });
