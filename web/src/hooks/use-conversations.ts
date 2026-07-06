import { axiosClient } from "@/lib/axios";

export function useConversationClient() {
  async function listRecentConversations({
    token,
    organizationId,
  }: {
    token: string;
    organizationId: string;
  }) {
    const res = await axiosClient.get("/conversation/recent", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as {
      message: string;
      code: number;
      result: {
        channels: IConversation[];
        dmAndGroups: (IConversation & {
          members: {
            id: string;
            userId: string;
            role: string | null;
            name: string;
            email: string;
            image: string | null;
          }[];
        })[];
      };
    };
  }

  async function createConversation({
    token,
    organizationId,
    name,
    type,
    description,
    memberIds,
    visibility,
  }: {
    token: string;
    organizationId: string;
    name?: string | null;
    type: "group" | "dm" | "channel";
    description?: string | null;
    memberIds: string[];
    visibility?: ConversationVisibility;
  }) {
    const res = await axiosClient.post(
      "/conversation",
      {
        name: name ?? null,
        type,
        description: description ?? null,
        memberIds,
        visibility: visibility ?? null,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-organization-id": organizationId,
        },
      },
    );

    return res.data as {
      message: string;
      code: number;
      result: IConversation;
    };
  }

  async function browseChannels({
    token,
    organizationId,
    query,
  }: {
    token: string;
    organizationId: string;
    query?: string;
  }) {
    const res = await axiosClient.get("/conversation/browse", {
      params: query?.trim() ? { q: query.trim() } : {},
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as {
      message: string;
      code: number;
      result: (IConversation & { isMember: boolean })[];
    };
  }

  async function joinChannel({
    token,
    organizationId,
    conversationId,
  }: {
    token: string;
    organizationId: string;
    conversationId: string;
  }) {
    const res = await axiosClient.post(
      "/conversation/join",
      { conversationId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-organization-id": organizationId,
        },
      },
    );

    return res.data as {
      message: string;
      code: number;
      result: IConversation;
    };
  }

  async function acceptInvite({
    token,
    organizationId,
    conversationId,
  }: {
    token: string;
    organizationId: string;
    conversationId: string;
  }) {
    const res = await axiosClient.post(
      "/conversation/invite/accept",
      { conversationId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-organization-id": organizationId,
        },
      },
    );

    return res.data as {
      message: string;
      code: number;
      result?: IConversation;
    };
  }

  async function declineInvite({
    token,
    organizationId,
    conversationId,
  }: {
    token: string;
    organizationId: string;
    conversationId: string;
  }) {
    const res = await axiosClient.post(
      "/conversation/invite/decline",
      { conversationId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-organization-id": organizationId,
        },
      },
    );

    return res.data as { message: string; code: number };
  }

  return {
    listRecentConversations,
    createConversation,
    browseChannels,
    joinChannel,
    acceptInvite,
    declineInvite,
  };
}
