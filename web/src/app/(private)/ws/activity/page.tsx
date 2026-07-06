import { ActivityFeed } from "@/components/activity/activity-feed";
import { useNotificationClient } from "@/hooks/use-notifications";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const ActivityPage = async () => {
  const { getServerSession } = useAuthServer();
  const session = await getServerSession();
  const token = session?.session.token;
  if (!token) {
    redirect("/auth");
  }

  const { getUserPreference } = usePreferenceClient();
  const { result: preference } = await getUserPreference(token);
  const organizationId = preference?.organizationId;

  if (!organizationId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <h2 className="text-lg font-semibold tracking-tight">Activity</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Select an organization to see your mentions, thread replies and
          invites.
        </p>
      </div>
    );
  }

  const { listNotifications } = useNotificationClient();
  const { result: notifications } = await listNotifications({
    token,
    organizationId,
  });

  return (
    <ActivityFeed
      token={token}
      organizationId={organizationId}
      initialNotifications={notifications ?? []}
    />
  );
};

export default ActivityPage;
