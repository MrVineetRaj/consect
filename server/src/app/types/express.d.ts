import type { accessConfig } from "../db/schema.js";
import type {
  ChannelAccessConfig,
  OrganizationAccessConfig,
} from "./access-config.ts";

type AccessConfigType = typeof accessConfig.$inferSelect;

declare global {
  namespace Express {
    interface Response {
      accessConfig?: {
        channel: ChannelAccessConfig | {};
        organization: OrganizationAccessConfig | {};
      };
      ctx: {
        organizationId: string | null | undefined;
        conversationId: string | null | undefined;
        userId: string | null | undefined;
      };
    }
  }
}

export {};
