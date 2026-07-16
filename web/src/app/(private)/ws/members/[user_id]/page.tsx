import { UserProfileView } from "@/components/ws/user-profile";
import { useOrganizationClient } from "@/hooks/use-organization";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const UserProfilePage = async ({
  params,
}: {
  params: Promise<{ user_id: string }>;
}) => {
  const { user_id } = await params;

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
    redirect("/ws/home");
  }

  const { listWorkspaceMembers } = useOrganizationClient();
  const members = await listWorkspaceMembers({ token, organizationId })
    .then((res) => res.result)
    .catch(() => null);

  const member = members?.members.find((m) => m.userId === user_id);
  // Profiles only exist for people in the current workspace.
  if (!member) {
    redirect("/ws/members");
  }

  return (
    <main className="h-full w-full">
      <UserProfileView
        member={member}
        organizationId={organizationId}
        currentUserId={session?.user.id}
      />
    </main>
  );
};

export default UserProfilePage;
