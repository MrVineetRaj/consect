import { betterAuth } from "better-auth";
import { organization, openAPI, bearer } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { env } from "../../env.js";
import { cachingClient } from "../clients/caching.js";
import { conversationRepository } from "../db/repository/conversation.js";
import { vectorDB } from "../vector_db/client.js";

export const auth = betterAuth({
  secondaryStorage: {
    get: async (key) => {
      return await cachingClient.get(key);
    },
    set: async (key, value, ttl) => {
      if (ttl) await cachingClient.setex(key, ttl, value);
      else await cachingClient.set(key, value);
    },
    delete: async (key) => {
      await cachingClient.del(key);
    },
  },
  rateLimit: {
    enabled: false,
    window: 10, // time window in seconds
    max: 100, // max requests in the window
    customRules: {
      "/get-session": false,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: env.VALID_ORIGINS.split(";"),
  onAPIError: {
    // Force Better Auth to throw standard errors when API calls fail on the server
    throw: true,

    // Custom callback to log or intercept authentication anomalies
    onError: (error, ctx) => {
      throw error;
      // Add custom tracking or notification logic here
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      console.log({ url, user });
    },
    sendOnSignUp: true,
    expiresIn: 3600,
    redirectTo: env.FRONTEND_URL + "/ws",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    onExistingUserSignUp: async (_) => {
      // throw new Error("User with this email already exist");
    },
    resetPasswordTokenExpiresIn: 60 * 60,
    autoSignIn: false,
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    organization({
      organizationHooks: {
        afterCreateOrganization: async ({ organization, member, user }) => {
          vectorDB.initCollection({
            size: 1536,
            collection: organization.id,
          });
        },
      },
    }),
    openAPI(),
    bearer(),
  ],
});
