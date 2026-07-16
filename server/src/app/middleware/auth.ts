import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { ResponseCodes } from "../types/codes.js";
import { HttpResponse } from "../adapter/http.js";
import { accessConfigRepository } from "../db/repository/access-config.js";
import { conversationMember } from "../db/schema.js";
import { conversationMemberRepository } from "../db/repository/conservation-member.js";
import {
  getChannelAccessConfig,
  getOrganizationAccessConfig,
} from "./access-configs.js";
import { HeaderKeys } from "../lib/constants.js";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const headers = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers,
  });

  if (!session?.user) {
    res.status(ResponseCodes.UNAUTHORIZED).json({
      ...new HttpResponse({
        code: ResponseCodes.UNAUTHORIZED,
        message: "Unauthorized user",
      }),
    });
    return;
  }

  const organizationId = headers.get(HeaderKeys.organizationId);
  const conversationId = headers.get(HeaderKeys.conversationId);

  res.ctx = {
    organizationId: organizationId,
    conversationId: conversationId,
    userId: session.user.id,
  };

  if (organizationId) {
    const result = await accessConfigRepository.getAccessConfigsByUserId({
      userId: session.user.id,
      organizationId: organizationId,
      spaceId: conversationId ? [organizationId, conversationId] : [organizationId],
    });

    const channelConfig = result.filter((conf) => conf.spaceType == "channel");
    const orgConfig = result.filter((conf) => conf.spaceType == "organization");
    const { members } = await auth.api.listMembers({
      query: {
        organizationId,
        limit: 1,
        filterField: "userId",
        filterValue: session.user.id,
        filterOperator: "eq",
      },
      headers,
    });

    const organizationMembership = members[0];
    const channelMembership = conversationId
      ? await conversationMemberRepository.getConversationMembershipOfUser({
          userId: session.user.id,
          conversationId: conversationId,
        })
      : null;

    const accessConfig = {
      channel: channelMembership
        ? getChannelAccessConfig(channelMembership.role)
        : {},
      organization: organizationMembership
        ? getOrganizationAccessConfig(organizationMembership.role)
        : {},
    };

    accessConfig.channel = {
      ...accessConfig.channel,
      ...(channelConfig.length > 0 ? (channelConfig[0]?.config ?? {}) : {}),
    };
    accessConfig.organization = {
      ...accessConfig.organization,
      ...(orgConfig.length > 0 ? (orgConfig[0]?.config ?? {}) : {}),
    };

    // Workspace owners/admins trump channel-level roles and overrides: they
    // get full channel capabilities in every conversation of their org.
    if (
      organizationMembership?.role === "owner" ||
      organizationMembership?.role === "admin"
    ) {
      accessConfig.channel = getChannelAccessConfig("owner");
    }

    res.accessConfig = accessConfig;
  }

  return next();
}
