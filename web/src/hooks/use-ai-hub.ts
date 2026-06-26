import { axiosClient } from "@/lib/axios";

export function useAiHubClient() {
  async function listResources({
    token,
    organizationId,
  }: {
    token: string;
    organizationId: string;
  }) {
    const res = await axiosClient.get("/ai-hub", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as {
      message: string;
      code: number;
      result: IAiHubResource[];
    };
  }

  async function createResource({
    token,
    organizationId,
    body,
  }: {
    token: string;
    organizationId: string;
    body: {
      type: AiHubResourceType;
      name?: string;
      description?: string;
      content: string;
      tags: string[];
      allowedChannelIds: string[];
    };
  }) {
    const res = await axiosClient.post("/ai-hub", body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as {
      message: string;
      code: number;
      result: IAiHubResource;
    };
  }

  async function updateResource({
    token,
    organizationId,
    body,
  }: {
    token: string;
    organizationId: string;
    body: {
      id: string;
      name?: string;
      description?: string;
      allowedChannelIds?: string[];
      tags?: string[];
    };
  }) {
    const res = await axiosClient.patch("/ai-hub", body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as {
      message: string;
      code: number;
      result: IAiHubResource;
    };
  }

  async function deleteResource({
    token,
    organizationId,
    id,
  }: {
    token: string;
    organizationId: string;
    id: string;
  }) {
    const res = await axiosClient.delete("/ai-hub", {
      data: { id },
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as { message: string; code: number };
  }

  return { listResources, createResource, updateResource, deleteResource };
}
