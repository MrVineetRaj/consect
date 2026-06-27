import { axiosClient } from "@/lib/axios";

export function useApiKeyClient() {
  async function listApiKeys({
    token,
    organizationId,
  }: {
    token: string;
    organizationId: string;
  }) {
    const res = await axiosClient.get("/api-key", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as {
      message: string;
      code: number;
      result: IApiKey[];
    };
  }

  async function createApiKey({
    token,
    organizationId,
    name,
  }: {
    token: string;
    organizationId: string;
    name?: string;
  }) {
    const res = await axiosClient.post(
      "/api-key",
      { name },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-organization-id": organizationId,
        },
      },
    );

    // The result carries the one-time `apiSecret` — surface it immediately.
    return res.data as {
      message: string;
      code: number;
      result: IApiKey;
    };
  }

  async function deleteApiKey({
    token,
    organizationId,
    id,
  }: {
    token: string;
    organizationId: string;
    id: string;
  }) {
    const res = await axiosClient.delete("/api-key", {
      data: { id },
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as { message: string; code: number };
  }

  return { listApiKeys, createApiKey, deleteApiKey };
}
