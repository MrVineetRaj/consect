import { Navigation } from "@/components/ws/navigation";
import { SideBottomActions } from "@/components/ws/side-bottom-actions";
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
    <div className="bg-primary/50 h-svh flex p-3 gap-3">
      <aside className="w-13 pt-3 flex flex-col justify-between">
        <Navigation />
        <SideBottomActions />
      </aside>
      <main className="bg-background w-full h-full rounded-lg flex flex-col">
        <div className="w-full p-2">Command Slit</div>
        {children}
      </main>
    </div>
  );
};

export default WorkspaceLayout;
