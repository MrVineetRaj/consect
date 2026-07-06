import { HttpResponse } from "../../adapter/http.js";
import { conversationRepository } from "../../db/repository/conversation.js";
import { messageRepository } from "../../db/repository/messages.js";
import { organizationRepository } from "../../db/repository/organization.js";
import { ResponseCodes } from "../../types/codes.js";
import type { WorkspaceSearchPropType } from "./schema.js";

class Controller {
  /**
   * Workspace-wide search. `@term` searches members, `#term` searches
   * channels, a bare term searches both — and messages (in conversations the
   * user belongs to) are always searched with the prefix stripped.
   */
  async search({ ctx, query }: WorkspaceSearchPropType) {
    const raw = query.q.trim();
    const mode = raw.startsWith("@")
      ? ("members" as const)
      : raw.startsWith("#")
        ? ("channels" as const)
        : ("all" as const);
    const term = mode === "all" ? raw : raw.slice(1).trim();

    const [members, channels, messages] = await Promise.all([
      mode !== "channels"
        ? organizationRepository.searchOrganizationMembers({
            organizationId: ctx.organizationId,
            query: term,
          })
        : Promise.resolve([]),
      mode !== "members"
        ? conversationRepository.searchChannels({
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            query: term,
          })
        : Promise.resolve([]),
      term
        ? messageRepository.searchMessages({
            organizationId: ctx.organizationId,
            userId: ctx.userId,
            query: term,
          })
        : Promise.resolve([]),
    ]);

    return new HttpResponse({
      code: ResponseCodes.SUCCESS,
      message: "Search results",
      result: { mode, members, channels, messages },
    });
  }
}

export const controller = new Controller();
