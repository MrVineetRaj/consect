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

  return { listRecentConversations };
}
