import z from "zod";
import { HeaderKeys } from "../../lib/constants.js";

const UserPreferenceResultSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ---- Get User Preference
export const GetUserPreferenceInputSchema = z.object({
  ctx: z.object({
    userId: z.string(),
  }),
});

export const GetUserPreferenceHeadersSchema = z.object({});

export const GetUserPreferenceResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: UserPreferenceResultSchema,
});

export type GetUserPreferencePropType = z.infer<
  typeof GetUserPreferenceInputSchema
>;

// ---- Update User Preference
export const UpdateUserPreferenceInputSchema = z.object({
  body: z.object({
    organizationId: z.string().nonempty().nullish(),
    lastOpenedHomeConversation: z.string().nonempty().nullish(),
    lastOpenedDMConversation: z.string().nonempty().nullish(),
  }),
  ctx: z.object({
    userId: z.string(),
  }),
});

export const UpdateUserPreferenceHeadersSchema = z.object({});

export const UpdateUserPreferenceResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  result: UserPreferenceResultSchema,
});

export type UpdateUserPreferencePropType = z.infer<
  typeof UpdateUserPreferenceInputSchema
>;

// ---- Delete User Preference
export const DeleteUserPreferenceInputSchema = z.object({
  ctx: z.object({
    userId: z.string(),
  }),
});

export const DeleteUserPreferenceHeadersSchema = z.object({});

export const DeleteUserPreferenceResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
});

export type DeleteUserPreferencePropType = z.infer<
  typeof DeleteUserPreferenceInputSchema
>;
