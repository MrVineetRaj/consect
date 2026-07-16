import { ConversationHeader } from "@/components/conversations/conversation-header";
import { MessageShell } from "@/components/conversations/message-shell";
import { OrganizationModel } from "@/components/ws/organizations-model";
import { useConversationClient } from "@/hooks/use-conversations";
import { useMessageClient } from "@/hooks/use-messages";
import { usePreferenceClient } from "@/hooks/use-preference";
import { useAuthServer } from "@/lib/auth-server";
import { redirect } from "next/navigation";

const ConversationId = async ({
  params,
}: {
  params: Promise<{ conversation_id: string }>;
}) => {
  const { conversation_id } = await params;

  const { getServerSession } = useAuthServer();
  const { listMessages } = useMessageClient();
  const { getConversationDetails } = useConversationClient();
  const session = await getServerSession();
  const token = session?.session.token;
  if (!token) {
    redirect("/auth");
  }
  const { getUserPreference, updateUserPreference } = usePreferenceClient();
  const { result: preference } = await getUserPreference(token);

  if (preference?.lastOpenedHomeConversation != conversation_id) {
    await updateUserPreference(token, {
      lastOpenedHomeConversation: conversation_id,
    });
  }

  const organizationId = preference?.organizationId;
  const messagePage = organizationId
    ? (
        await listMessages({
          token,
          conversationId: conversation_id,
          organizationId,
        })
      ).result
    : { messages: [], nextCursor: null, hasMore: false };

  // Non-members (e.g. an invite not yet accepted) just don't get a header.
  const details = organizationId
    ? await getConversationDetails({
        token,
        organizationId,
        conversationId: conversation_id,
      })
        .then((res) => res.result)
        .catch(() => null)
    : null;

  return (
    <main className="flex h-full w-full">
      <div className="flex-5 min-h-0 h-full flex flex-col">
        {details && (
          <ConversationHeader
            details={details}
            detailsHref={`/ws/home/${conversation_id}/details`}
            currentUserId={session?.user.id}
          />
        )}
        <div className="flex-1 min-h-0">
          <MessageShell
            initMessages={messagePage.messages}
            initNextCursor={messagePage.nextCursor}
            initHasMore={messagePage.hasMore}
            conversationId={conversation_id}
            organizationId={organizationId}
          />
        </div>
      </div>
      <OrganizationModel />
    </main>
  );
};

export default ConversationId;
