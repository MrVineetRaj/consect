import { StoreProvider } from "@/components/shared/store-provider";
import { Navigation } from "@/components/ws/navigation";
import { SideBottomActions } from "@/components/ws/side-bottom-actions";
import { WorkspaceShell } from "@/components/ws/ws-shell";
import { useAuthServer } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import React from "react";

const WorkspaceLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { getServerSession } = useAuthServer();
  const session = await getServerSession();

  if (!session?.session.token) {
    redirect("/auth");
  }

  return (
    <StoreProvider user={session.user} token={session.session.token}>
      <WorkspaceShell>{children}</WorkspaceShell>
    </StoreProvider>
  );
};

export default WorkspaceLayout;
