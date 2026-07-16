import { WorkspaceMembersView } from "@/components/ws/workspace-members";
import { useOrganizationClient } from "@/hooks/use-organization";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const MembersPage = async () => {
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

  if (!members) {
    redirect("/ws/home");
  }

  return (
    <main className="h-full w-full">
      <WorkspaceMembersView
        initialMembers={members}
        organizationId={organizationId}
      />
    </main>
  );
};

export default MembersPage;
