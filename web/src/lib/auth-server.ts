import { headers } from "next/headers";
import { authClient } from "./auth";

/**
 * Resolves the current session on the server.
 *
 * The browser auth client has no access to the incoming request on the
 * server, so we forward the request headers (including the session cookie)
 * to the backend explicitly.
 */
export function useAuthServer() {
  async function getServerSession() {
    const { data } = await authClient.getSession({
      fetchOptions: { headers: await headers() },
    });

    return data;
  }
  return { getServerSession };
}
