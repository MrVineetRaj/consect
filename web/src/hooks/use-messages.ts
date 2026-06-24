import { axiosClient } from "@/lib/axios";

export function useMessageClient() {
  async function listMessages({
    token,
    conversationId,
    organizationId,
  }: {
    token: string;
    organizationId: string;
    conversationId: string;
  }) {
    const res = await axiosClient.get("/message", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
        "X-conversation-id": conversationId,
      },
    });

    return res.data as {
      message: string;
      code: number;
      result: IMessage[];
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
