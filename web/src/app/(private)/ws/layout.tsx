import { StoreProvider } from "@/components/shared/store-provider";
import { Navigation } from "@/components/ws/navigation";
import { SideBottomActions } from "@/components/ws/side-bottom-actions";
import { WorkspaceShell } from "@/components/ws/ws-shell";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import React from "react";

const WorkspaceLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { getServerSession, listOrganizationMembersServer } = useAuthServer();
  const { getUserPreference } = usePreferenceClient();
  const session = await getServerSession();

  if (!session?.session.token) {
    redirect("/auth");
  }

  const pref = await getUserPreference(session.session.token);
  const organizationId = pref.result?.organizationId;
  const orgMemberResult = organizationId
    ? await listOrganizationMembersServer(organizationId)
    : null;
  return (
    <StoreProvider
      user={session.user}
      token={session.session.token}
      userPreference={pref.result}
      orgMembers={
        orgMemberResult?.members?.filter(
          (mem) => mem.userId != session.user.id,
        ) ?? []
      }
    >
      <WorkspaceShell>{children}</WorkspaceShell>
    </StoreProvider>
  );
};

export default WorkspaceLayout;
