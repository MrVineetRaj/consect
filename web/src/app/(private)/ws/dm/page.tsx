import { OrganizationModel } from "@/components/ws/organizations-model";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { MessagesSquareIcon } from "lucide-react";
import { redirect } from "next/navigation";
import React from "react";

const DirectMessagePage = async () => {
  const { getServerSession } = useAuthServer();
  const session = await getServerSession();
  const token = session?.session.token;

  if (!token) {
    redirect("/auth");
  }

  const { getUserPreference } = usePreferenceClient();
  const { result: preference } = await getUserPreference(token);

  if (preference?.lastOpenedDMConversation) {
    redirect(`/ws/dm/${preference.lastOpenedDMConversation}`);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
        <MessagesSquareIcon className="size-8" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold tracking-tight">
          Welcome to your workspace
        </h2>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Pick a channel or direct message from the sidebar to jump into the
          conversation.
        </p>
      </div>

      <OrganizationModel />
    </div>
  );
};

export default DirectMessagePage;
