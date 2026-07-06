import { axiosClient } from "@/lib/axios";

export function useNotificationClient() {
  async function listNotifications({
    token,
    organizationId,
    type,
    unreadOnly,
    limit,
    offset,
  }: {
    token: string;
    organizationId: string;
    type?: NotificationKind;
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const res = await axiosClient.get("/notification", {
      params: {
        ...(type && { type }),
        ...(unreadOnly && { unreadOnly: "true" }),
        ...(limit && { limit }),
        ...(offset && { offset }),
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as {
      message: string;
      code: number;
      result: INotification[];
    };
  }

  async function getUnreadCount({
    token,
    organizationId,
  }: {
    token: string;
    organizationId: string;
  }) {
    const res = await axiosClient.get("/notification/unread-count", {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-organization-id": organizationId,
      },
    });

    return res.data as {
      message: string;
      code: number;
      result: { count: number };
    };
  }

  async function markRead({
    token,
    organizationId,
    ids,
  }: {
    token: string;
    organizationId: string;
    ids: string[];
  }) {
    const res = await axiosClient.patch(
      "/notification/read",
      { ids },
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
      result: INotification[];
    };
  }

  async function markAllRead({
    token,
    organizationId,
  }: {
    token: string;
    organizationId: string;
  }) {
    const res = await axiosClient.post(
      "/notification/read-all",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-organization-id": organizationId,
        },
      },
    );

    return res.data as { message: string; code: number };
  }

  return { listNotifications, getUnreadCount, markRead, markAllRead };
}
