import z from "zod";

export type ChannelAccessConfig = {
  removeMember: boolean;
  inviteMember: boolean;
  changeMemberConfig: boolean;
  changeMemberRole: boolean;
};
export type OrganizationAccessConfig = {
  removeMember: boolean;
  inviteMember: boolean;
  changeMemberConfig: boolean;
  changeMemberRole: boolean;
  aiHubWrite: boolean;
  createChannel: boolean;
};

/**
 * `res.accessConfig` as forwarded by `authMiddleware` through `HttpRequest`.
 * Route schemas that guard on capabilities include this so the validated
 * request keeps the field.
 */
export const AccessConfigInputSchema = z
  .object({
    channel: z.record(z.string(), z.boolean()).default({}),
    organization: z.record(z.string(), z.boolean()).default({}),
  })
  .nullish();
