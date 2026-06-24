import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

import { env } from "./env";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  plugins: [organizationClient()],
  //   basePath:"/"
});
