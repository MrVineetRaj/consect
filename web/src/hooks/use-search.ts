import { axiosClient } from "@/lib/axios";

export interface ISearchMember {
  userId: string;
  role: "owner" | "admin" | "member";
  name: string;
  email: string;
  image: string | null;
}

export type ISearchChannel = IConversation & { isMember: boolean };

export interface ISearchMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  conversation: IConversation;
}

export interface ISearchResults {
  mode: "members" | "channels" | "all";
  members: ISearchMember[];
  channels: ISearchChannel[];
  messages: ISearchMessage[];
}

export function useSearchClient() {
  async function searchWorkspace({
    token,
    organizationId,
    query,
  }: {
    token: string;
    organizationId: string;
    query: string;
  }) {
    const res = await axiosClient.get("/search", {
      params: { q: query },
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as {
      message: string;
      code: number;
      result: ISearchResults;
    };
  }

  return { searchWorkspace };
}
