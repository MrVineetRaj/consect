import { axiosClient } from "@/lib/axios";

export function useMessageClient() {
  async function listMessages({
    token,
    conversationId,
    organizationId,
    before,
    limit,
  }: {
    token: string;
    organizationId: string;
    conversationId: string;
    /** Message id cursor — fetches the page older than this message. */
    before?: string;
    limit?: number;
  }) {
    const res = await axiosClient.get("/message", {
      params: {
        ...(before ? { before } : {}),
        ...(limit ? { limit } : {}),
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
        "X-conversation-id": conversationId,
      },
    });

    return res.data as {
      message: string;
      code: number;
      result: {
        messages: IMessage[];
        nextCursor: string | null;
        hasMore: boolean;
      };
    };
  }

  async function sendMessage({
    token,
    conversationId,
    organizationId,
    content,
    mentions = [],
    parentMessageId = null,
  }: {
    token: string;
    organizationId: string;
    conversationId: string;
    content: string;
    mentions?: string[];
    parentMessageId?: string | null;
  }) {
    const res = await axiosClient.post(
      "/message",
      { content, mentions, parentMessageId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-organization-id": organizationId,
          "X-conversation-id": conversationId,
        },
      },
    );

    // The server returns the raw message row without the `sender` relation,
    // so callers attach the current user before rendering.
    return res.data as {
      message: string;
      code: number;
      result: IMessage;
    };
  }

  return { listMessages, sendMessage };
}
