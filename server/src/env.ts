import "dotenv/config";
import z from "zod";
const EnvSchema = z.object({
  PORT: z.string().describe("PORT for backend server"),
  FRONTEND_URL: z.url().describe("My frontend url"),
  BETTER_AUTH_URL: z.url().describe("My backend url"),
  VALID_ORIGINS: z.string().describe("Multiple Valid origins joined by `;`"),
  DATABASE_URL: z.url().describe("URL for the postgres db of server"),
  GOOGLE_CLIENT_ID: z.string().describe("google client id for google oauth"),
  GOOGLE_CLIENT_SECRET: z
    .string()
    .describe("google client secret for google oauth"),
  GITHUB_CLIENT_ID: z.string().describe("github client id for github oauth"),
  GITHUB_CLIENT_SECRET: z
    .string()
    .describe("github client secret for github oauth"),
  MAILTRAP_TOKEN: z.string().describe("Token for mailtrap client"),
  EMAIL_FROM_NAME: z.string().describe("Name for from email"),
  EMAIL_FROM_ADDRESS: z.string().describe("Email address for from email"),
  OPENAI_API_KEY: z.string().describe("API key to access openai llm models"),
  QDRANT_URL: z.url().describe("URL for the Qdrant vector database"),
  CLOUDINARY_CLOUD_NAME: z.string().describe("cloud name  for the cloudinary"),
  CLOUDINARY_API_KEY: z.string().describe("api key  for the cloudinary"),
  CLOUDINARY_API_SECRET: z.string().describe("secret key  for the cloudinary"),
  CLOUDINARY_PRESET: z.string().describe("Preset for cloudinary upload"),
});

const createEnv = () => {
  const env = EnvSchema.safeParse(process.env);

  if (!env.success) {
    throw new Error(env.error.message);
  }

  return env.data;
};

export const env = createEnv();
