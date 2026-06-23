import z from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().describe("Base url for backend server"),
});

const createEnv = () => {
  // Reference each NEXT_PUBLIC_* var explicitly so Next.js can statically
  // inline the values into the client bundle. Passing the whole `process.env`
  // object does not work in the browser, where it is not populated.
  const env = EnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });

  if (!env.success) {
    throw new Error(env.error.message);
  }

  return env.data;
};

export const env = createEnv();
