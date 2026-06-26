import { MessageShell } from "@/components/conversations/message-shell";
import { OrganizationModel } from "@/components/ws/organizations-model";
import { useMessageClient } from "@/hooks/use-messages";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const DmConversationPage = async ({
  params,
}: {
  params: Promise<{ conversation_id: string }>;
}) => {
  const { conversation_id } = await params;

  const { getServerSession } = useAuthServer();
  const { listMessages } = useMessageClient();
  const session = await getServerSession();
  const token = session?.session.token;
  if (!token) {
    redirect("/auth");
  }
  const { getUserPreference, updateUserPreference } = usePreferenceClient();
  const { result: preference } = await getUserPreference(token);

  if (preference?.lastOpenedDMConversation != conversation_id) {
    await updateUserPreference(token, {
      lastOpenedDMConversation: conversation_id,
    });
  }

  const organizationId = preference?.organizationId;
  const messages = organizationId
    ? (
        await listMessages({
          token,
          conversationId: conversation_id,
          organizationId,
        })
      ).result
    : [];

  return (
    <main className="flex h-full w-full">
      <div className="flex-5 min-h-0 h-full">
        <MessageShell
          initMessages={messages}
          conversationId={conversation_id}
          organizationId={organizationId}
        />
      </div>
      {/* <div className="flex-2 bg-muted rounded-l-2xl hidden md:block" /> */}
      <OrganizationModel />
    </main>
  );
};

export default DmConversationPage;
