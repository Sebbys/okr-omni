import { httpRouter } from "convex/server";
import { component } from "./auth";
import { createAuth } from "./authSetup";

const http = httpRouter();

component.registerRoutesLazy(http, createAuth, {
  trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim()),
});

export default http;
