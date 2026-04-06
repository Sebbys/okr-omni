import { createClient } from "@convex-dev/better-auth";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

const component = createClient<DataModel>(components.betterAuth);

export const { getAuthUser } = component.clientApi();

export { component };
