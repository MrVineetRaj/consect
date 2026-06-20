import { betterAuth } from "better-auth";
import { organization, emailOTP } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/connection.js";
import { env } from "../../env.js";

export const auth = betterAuth({
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
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: env.VALID_ORIGINS.split(";"),
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      console.log({ url, user });
    },
    sendOnSignUp: true,
    expiresIn: 3600,
    redirectTo: "http://localhost:5173/verified",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    onExistingUserSignUp: async (_) => {
      throw new Error("User with this email already exist");
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
  plugins: [organization()],
});
